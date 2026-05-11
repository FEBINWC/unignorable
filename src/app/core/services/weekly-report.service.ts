import { Injectable } from '@angular/core';
import { Database, get, ref, set } from '@angular/fire/database';
import { Task } from '../models/task.model';
import { SubjectScore, WeeklyReport } from '../models/weekly-report.model';

@Injectable({ providedIn: 'root' })
export class WeeklyReportService {
  private readonly REPORTS_PATH = 'weeklyReports';

  constructor(private db: Database) {}

  async getWeeklyReport(weekKey: string): Promise<WeeklyReport | null> {
    const snapshot = await get(ref(this.db, `${this.REPORTS_PATH}/${weekKey}`));
    return snapshot.val();
  }

  async generateWeeklyReport(weekStart: Date): Promise<WeeklyReport> {
    const startStr = weekStart.toISOString().split('T')[0];
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endStr = endDate.toISOString().split('T')[0];
    const weekKey = this.getWeekKey(weekStart);

    // Scan completions for tasks completed within this week
    const completionsSnap = await get(ref(this.db, 'completions'));
    const data = completionsSnap.val();

    const subjectScores: { [subject: string]: SubjectScore } = {};
    let tasksCompleted = 0, tasksPending = 0, carryOvers = 0;
    let totalMarks = 0, totalReviewed = 0;

    if (data) {
      Object.values(data).forEach((comp: any) => {
        if (!comp.completedDate || comp.completedDate < startStr || comp.completedDate > endStr) return;
        if (!comp.tasks) return;

        Object.values(comp.tasks).forEach((t: any) => {
          const task = t as Task;
          if (task.status === 'reviewed' || task.status === 'submitted') tasksCompleted++;
          else if (task.status === 'pending') tasksPending++;

          if (task.status === 'reviewed' && task.marks !== null) {
            totalMarks += task.marks;
            totalReviewed++;
            if (task.subject) {
              if (!subjectScores[task.subject]) subjectScores[task.subject] = { avg: 0, count: 0, total: 0 };
              subjectScores[task.subject].count++;
              subjectScores[task.subject].total += task.marks;
              subjectScores[task.subject].avg = subjectScores[task.subject].total / subjectScores[task.subject].count;
            }
          }
        });
      });
    }

    const report: WeeklyReport = {
      weekKey, weekStart: startStr, weekEnd: endStr, subjectScores,
      tasksCompleted, tasksPending, carryOvers,
      overallAvg: totalReviewed > 0 ? Math.round((totalMarks / totalReviewed) * 10) / 10 : 0,
    };

    await set(ref(this.db, `${this.REPORTS_PATH}/${weekKey}`), report);
    return report;
  }

  getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const dayOfYear = Math.ceil((date.getTime() - oneJan.getTime()) / 86400000);
    const weekNum = Math.ceil((dayOfYear + oneJan.getDay()) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }
}
