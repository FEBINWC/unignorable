import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  get,
  onValue,
  ref,
  set,
  update,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { Completion, DayOrder, DaySummary, Progress, Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class ScheduleService implements OnDestroy {
  private listeners: Unsubscribe[] = [];

  private progressSubject = new BehaviorSubject<Progress | null>(null);
  progress$ = this.progressSubject.asObservable();

  constructor(private db: Database, private zone: NgZone) {
    this.listenToProgress();
  }

  private listenToProgress(): void {
    const progressRef = ref(this.db, 'progress');
    const unsub = onValue(progressRef, (snapshot) => {
      this.zone.run(() => this.progressSubject.next(snapshot.val()));
    });
    this.listeners.push(unsub);
  }

  // --- Day Orders (static curriculum) ---

  async getDayOrder(num: number): Promise<DayOrder | null> {
    const snapshot = await get(ref(this.db, `dayOrders/${num}`));
    return snapshot.val();
  }

  getCurrentDayOrder(): Observable<{ progress: Progress; dayOrder: DayOrder | null; tasks: Task[] }> {
    const subject = new BehaviorSubject<{ progress: Progress; dayOrder: DayOrder | null; tasks: Task[] }>({
      progress: { currentDayOrder: 1, targetEndDate: '', startDate: '', totalDayOrders: 0 },
      dayOrder: null,
      tasks: [],
    });

    const progressRef = ref(this.db, 'progress');
    const unsub = onValue(progressRef, async (snapshot) => {
      const progress: Progress = snapshot.val();
      if (!progress) return;

      const dayOrderSnap = await get(ref(this.db, `dayOrders/${progress.currentDayOrder}`));
      const dayOrder: DayOrder | null = dayOrderSnap.val();
      const tasks: Task[] = [];
      if (dayOrder?.tasks) {
        Object.keys(dayOrder.tasks).forEach((key) => {
          tasks.push({ ...dayOrder.tasks[key], id: key });
        });
      }

      // Check if there's an in-progress completion (started but not fully submitted)
      const completionSnap = await get(ref(this.db, `completions/${progress.currentDayOrder}`));
      const completion = completionSnap.val();
      if (completion?.tasks) {
        // Merge completion task statuses onto day order tasks
        tasks.forEach((t) => {
          const compTask = completion.tasks[t.id!];
          if (compTask) {
            t.status = compTask.status;
            t.proofUrls = compTask.proofUrls || [];
            t.marks = compTask.marks;
            t.feedback = compTask.feedback || '';
          }
        });
      }

      this.zone.run(() => subject.next({ progress, dayOrder, tasks }));
    });
    this.listeners.push(unsub);
    return subject.asObservable();
  }

  // --- Completions ---

  async getCompletion(dayOrderNum: number): Promise<Completion | null> {
    const snapshot = await get(ref(this.db, `completions/${dayOrderNum}`));
    return snapshot.val();
  }

  async updateTaskStatus(dayOrderNum: number, taskId: string, status: string): Promise<void> {
    const taskRef = ref(this.db, `completions/${dayOrderNum}/tasks/${taskId}`);
    const snapshot = await get(taskRef);
    if (snapshot.exists()) {
      await update(taskRef, { status });
    } else {
      // First time touching this task — copy from day order and set status
      const doTaskSnap = await get(ref(this.db, `dayOrders/${dayOrderNum}/tasks/${taskId}`));
      const doTask = doTaskSnap.val();
      if (doTask) {
        await set(taskRef, { ...doTask, status, proofUrls: doTask.proofUrls || [] });
      }
    }
    await this.recalculateSummary(dayOrderNum);
  }

  async updateTaskMarks(dayOrderNum: number, taskId: string, marks: number, feedback: string): Promise<void> {
    const taskRef = ref(this.db, `completions/${dayOrderNum}/tasks/${taskId}`);
    await update(taskRef, { marks, feedback, status: 'reviewed' });
    await this.recalculateSummary(dayOrderNum);
  }

  async addProofUrl(dayOrderNum: number, taskId: string, url: string): Promise<void> {
    const taskRef = ref(this.db, `completions/${dayOrderNum}/tasks/${taskId}`);
    const snapshot = await get(taskRef);
    if (snapshot.exists()) {
      const task = snapshot.val();
      const urls = task.proofUrls || [];
      urls.push(url);
      await update(taskRef, { proofUrls: urls });
    } else {
      // Initialize task in completions
      const doTaskSnap = await get(ref(this.db, `dayOrders/${dayOrderNum}/tasks/${taskId}`));
      const doTask = doTaskSnap.val();
      if (doTask) {
        await set(taskRef, { ...doTask, proofUrls: [url], status: 'pending' });
      }
    }
  }

  async completeDayOrder(dayOrderNum: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const completionRef = ref(this.db, `completions/${dayOrderNum}`);
    await update(completionRef, {
      dayOrder: dayOrderNum,
      completedDate: today,
    });
    await this.recalculateSummary(dayOrderNum);
    // Advance pointer
    await update(ref(this.db, 'progress'), { currentDayOrder: dayOrderNum + 1 });
  }

  async getCompletionsForDateRange(start: string, end: string): Promise<Map<string, Completion>> {
    const result = new Map<string, Completion>();
    const snapshot = await get(ref(this.db, 'completions'));
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach((key) => {
        const comp = data[key] as Completion;
        if (comp.completedDate && comp.completedDate >= start && comp.completedDate <= end) {
          result.set(comp.completedDate, comp);
        }
      });
    }
    return result;
  }

  async getAllCompletions(): Promise<Completion[]> {
    const snapshot = await get(ref(this.db, 'completions'));
    const data = snapshot.val();
    if (!data) return [];
    return Object.keys(data)
      .map((key) => ({ ...data[key], dayOrder: parseInt(key) } as Completion))
      .filter((c) => c.completedDate)
      .sort((a, b) => a.dayOrder - b.dayOrder);
  }

  // --- Helpers ---

  private async recalculateSummary(dayOrderNum: number): Promise<void> {
    const tasksSnap = await get(ref(this.db, `completions/${dayOrderNum}/tasks`));
    const data = tasksSnap.val();
    if (!data) return;

    const tasks = Object.values(data) as Task[];
    const reviewed = tasks.filter((t) => t.status === 'reviewed');
    const totalMarks = reviewed.reduce((sum, t) => sum + (t.marks || 0), 0);
    const avgScore = reviewed.length > 0 ? Math.round((totalMarks / reviewed.length) * 10) / 10 : 0;
    const completedTasks = tasks.filter((t) => t.status === 'reviewed' || t.status === 'submitted').length;

    const summary: DaySummary = { avgScore, totalTasks: tasks.length, completedTasks };
    await set(ref(this.db, `completions/${dayOrderNum}/daySummary`), summary);
  }

  // --- Seed ---

  async seedDayOrders(data: { [num: string]: DayOrder }): Promise<void> {
    await update(ref(this.db, 'dayOrders'), data);
  }

  async seedProgress(progress: Progress): Promise<void> {
    await set(ref(this.db, 'progress'), progress);
  }

  ngOnDestroy(): void {
    this.listeners.forEach((unsub) => unsub());
  }
}
