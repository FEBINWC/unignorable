import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  get,
  onValue,
  push,
  ref,
  set,
  update,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DaySchedule, DaySummary, Task, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService implements OnDestroy {
  private readonly SCHEDULE_PATH = 'schedule';
  private listeners: Unsubscribe[] = [];

  constructor(private db: Database, private zone: NgZone) {}

  getTasksForDate(date: string): Observable<Task[]> {
    const subject = new BehaviorSubject<Task[]>([]);
    const tasksRef = ref(this.db, `${this.SCHEDULE_PATH}/${date}/tasks`);
    const unsub = onValue(tasksRef, (snapshot) => {
      this.zone.run(() => {
        const data = snapshot.val();
        const tasks: Task[] = [];
        if (data) {
          Object.keys(data).forEach((key) => {
            tasks.push({ ...data[key], id: key });
          });
        }
        subject.next(tasks);
      });
    });
    this.listeners.push(unsub);
    return subject.asObservable();
  }

  getDaySummary(date: string): Observable<DaySummary | null> {
    const subject = new BehaviorSubject<DaySummary | null>(null);
    const summaryRef = ref(this.db, `${this.SCHEDULE_PATH}/${date}/daySummary`);
    const unsub = onValue(summaryRef, (snapshot) => {
      this.zone.run(() => {
        subject.next(snapshot.val());
      });
    });
    this.listeners.push(unsub);
    return subject.asObservable();
  }

  async getDaySummariesForRange(
    startDate: string,
    endDate: string
  ): Promise<Map<string, DaySummary>> {
    const result = new Map<string, DaySummary>();
    const scheduleRef = ref(this.db, this.SCHEDULE_PATH);
    const snapshot = await get(scheduleRef);
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach((date) => {
        if (date >= startDate && date <= endDate && data[date]?.daySummary) {
          result.set(date, data[date].daySummary);
        }
      });
    }
    return result;
  }

  async getAllReviewedTasks(): Promise<{ date: string; task: Task }[]> {
    const result: { date: string; task: Task }[] = [];
    const scheduleRef = ref(this.db, this.SCHEDULE_PATH);
    const snapshot = await get(scheduleRef);
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach((date) => {
        const tasks = data[date]?.tasks;
        if (tasks) {
          Object.keys(tasks).forEach((taskId) => {
            if (tasks[taskId].status === 'reviewed') {
              result.push({ date, task: { ...tasks[taskId], id: taskId } });
            }
          });
        }
      });
    }
    return result;
  }

  async updateTaskStatus(
    date: string,
    taskId: string,
    status: TaskStatus
  ): Promise<void> {
    const taskRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${date}/tasks/${taskId}`
    );
    await update(taskRef, { status });
    await this.recalculateDaySummary(date);
  }

  async updateTaskMarks(
    date: string,
    taskId: string,
    marks: number,
    feedback: string
  ): Promise<void> {
    const taskRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${date}/tasks/${taskId}`
    );
    await update(taskRef, { marks, feedback, status: 'reviewed' as TaskStatus });
    await this.recalculateDaySummary(date);
  }

  async addProofUrl(
    date: string,
    taskId: string,
    url: string
  ): Promise<void> {
    const taskRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${date}/tasks/${taskId}`
    );
    const snapshot = await get(taskRef);
    const task = snapshot.val() as Task;
    const urls = task?.proofUrls || [];
    urls.push(url);
    await update(taskRef, { proofUrls: urls });
  }

  async processCarryOver(
    date: string,
    taskId: string
  ): Promise<string> {
    const taskRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${date}/tasks/${taskId}`
    );
    const snapshot = await get(taskRef);
    const task = snapshot.val() as Task;

    // Mark original as carry-over
    await update(taskRef, { status: 'carry-over' as TaskStatus });

    // Find next working day
    const nextDate = this.getNextWorkingDay(date);

    // Create carry-over task on next day
    const nextDayTasksRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${nextDate}/tasks`
    );
    await push(nextDayTasksRef, {
      type: task.type,
      title: `[CARRY-OVER] ${task.title}`,
      description: task.description,
      subject: task.subject || null,
      chapters: task.chapters || null,
      examType: task.examType || null,
      status: 'pending',
      proofUrls: [],
      marks: null,
      feedback: '',
      isCarryOver: true,
      carryOverFromDate: date,
    });

    await this.recalculateDaySummary(date);
    await this.recalculateDaySummary(nextDate);

    return nextDate;
  }

  async seedSchedule(data: {
    [date: string]: DaySchedule;
  }): Promise<void> {
    const scheduleRef = ref(this.db, this.SCHEDULE_PATH);
    await update(scheduleRef, data);
  }

  async isScheduleSeeded(): Promise<boolean> {
    const scheduleRef = ref(this.db, this.SCHEDULE_PATH);
    const snapshot = await get(scheduleRef);
    return snapshot.exists();
  }

  private async recalculateDaySummary(date: string): Promise<void> {
    const tasksRef = ref(this.db, `${this.SCHEDULE_PATH}/${date}/tasks`);
    const snapshot = await get(tasksRef);
    const data = snapshot.val();

    if (!data) return;

    const tasks = Object.values(data) as Task[];
    const reviewed = tasks.filter((t) => t.status === 'reviewed');
    const totalMarks = reviewed.reduce((sum, t) => sum + (t.marks || 0), 0);
    const avgScore = reviewed.length > 0 ? totalMarks / reviewed.length : 0;
    const completedTasks = tasks.filter(
      (t) => t.status === 'reviewed' || t.status === 'submitted'
    ).length;
    const hasCarryOvers = tasks.some((t) => t.isCarryOver);

    const summary: DaySummary = {
      avgScore: Math.round(avgScore * 10) / 10,
      totalTasks: tasks.length,
      completedTasks,
      hasCarryOvers,
    };

    const summaryRef = ref(
      this.db,
      `${this.SCHEDULE_PATH}/${date}/daySummary`
    );
    await set(summaryRef, summary);
  }

  private getNextWorkingDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    // Skip Sundays
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.listeners.forEach((unsub) => unsub());
  }
}
