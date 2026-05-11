import { Injectable, NgZone } from '@angular/core';
import { Database, get, ref, set } from '@angular/fire/database';
import { Task } from '../models/task.model';
import { SubjectScore, WeeklyReport } from '../models/weekly-report.model';

@Injectable({ providedIn: 'root' })
export class WeeklyReportService {
  private readonly REPORTS_PATH = 'weeklyReports';

  constructor(private db: Database, private zone: NgZone) {}

  async getWeeklyReport(weekKey: string): Promise<WeeklyReport | null> {
    const reportRef = ref(this.db, `${this.REPORTS_PATH}/${weekKey}`);
    const snapshot = await get(reportRef);
    return snapshot.val();
  }

  async generateWeeklyReport(weekStart: Date): Promise<WeeklyReport> {
    const startStr = weekStart.toISOString().split('T')[0];
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endStr = endDate.toISOString().split('T')[0];

    const weekKey = this.getWeekKey(weekStart);

    // Fetch all schedule data for the week
    const scheduleRef = ref(this.db, 'schedule');
    const snapshot = await get(scheduleRef);
    const data = snapshot.val();

    const subjectScores: { [subject: string]: SubjectScore } = {};
    let tasksCompleted = 0;
    let tasksPending = 0;
    let carryOvers = 0;
    let totalMarks = 0;
    let totalReviewed = 0;

    if (data) {
      Object.keys(data)
        .filter((d) => d >= startStr && d <= endStr)
        .forEach((date) => {
          const tasks = data[date]?.tasks;
          if (!tasks) return;

          Object.values(tasks).forEach((t: any) => {
            const task = t as Task;
            if (
              task.status === 'reviewed' ||
              task.status === 'submitted'
            ) {
              tasksCompleted++;
            } else if (task.status === 'pending') {
              tasksPending++;
            }

            if (task.isCarryOver) carryOvers++;

            if (task.status === 'reviewed' && task.marks !== null) {
              totalMarks += task.marks;
              totalReviewed++;

              if (task.subject) {
                if (!subjectScores[task.subject]) {
                  subjectScores[task.subject] = { avg: 0, count: 0, total: 0 };
                }
                subjectScores[task.subject].count++;
                subjectScores[task.subject].total += task.marks;
                subjectScores[task.subject].avg =
                  subjectScores[task.subject].total /
                  subjectScores[task.subject].count;
              }
            }
          });
        });
    }

    const report: WeeklyReport = {
      weekKey,
      weekStart: startStr,
      weekEnd: endStr,
      subjectScores,
      tasksCompleted,
      tasksPending,
      carryOvers,
      overallAvg: totalReviewed > 0 ? Math.round((totalMarks / totalReviewed) * 10) / 10 : 0,
    };

    // Save report
    const reportRef = ref(this.db, `${this.REPORTS_PATH}/${weekKey}`);
    await set(reportRef, report);

    return report;
  }

  getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const dayOfYear = Math.ceil(
      (date.getTime() - oneJan.getTime()) / 86400000
    );
    const weekNum = Math.ceil((dayOfYear + oneJan.getDay()) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  getWeekStartFromKey(weekKey: string): Date {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7 - jan1.getDay() + 1;
    return new Date(year, 0, 1 + daysOffset);
  }
}
