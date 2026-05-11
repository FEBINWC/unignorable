import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe, KeyValuePipe } from '@angular/common';
import { WeeklyReportService } from '../../core/services/weekly-report.service';
import { WeeklyReport } from '../../core/models/weekly-report.model';

@Component({
  selector: 'app-weekly-summary',
  standalone: true,
  imports: [DecimalPipe, DatePipe, KeyValuePipe],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-4 text-2xl font-bold">Weekly Summary</h1>

      <div class="mb-5 flex flex-wrap items-center gap-3">
        <button class="rounded-lg p-2 hover:bg-gray-800" (click)="prevWeek()">
          <i class="mdi mdi-chevron-left text-xl"></i>
        </button>
        <h2 class="min-w-[200px] text-center font-semibold">
          {{ currentWeekStart() | date: 'MMM d' }} - {{ currentWeekEnd() | date: 'MMM d, y' }}
        </h2>
        <button class="rounded-lg p-2 hover:bg-gray-800" (click)="nextWeek()">
          <i class="mdi mdi-chevron-right text-xl"></i>
        </button>
        <button class="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark" (click)="generateReport()">
          <i class="mdi mdi-refresh"></i> Generate Report
        </button>
      </div>

      @if (report(); as r) {
        <!-- Stats grid -->
        <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl border bg-surface p-4 text-center shadow-none">
            <div class="text-3xl font-bold text-primary">{{ r.overallAvg | number: '1.0-0' }}</div>
            <div class="mt-1 text-xs text-gray-500">Average Score</div>
          </div>
          <div class="rounded-xl border bg-surface p-4 text-center shadow-none">
            <div class="text-3xl font-bold text-primary">{{ r.tasksCompleted }}</div>
            <div class="mt-1 text-xs text-gray-500">Completed</div>
          </div>
          <div class="rounded-xl border bg-surface p-4 text-center shadow-none">
            <div class="text-3xl font-bold text-warning-dark">{{ r.tasksPending }}</div>
            <div class="mt-1 text-xs text-gray-500">Pending</div>
          </div>
          <div class="rounded-xl border bg-surface p-4 text-center shadow-none">
            <div class="text-3xl font-bold text-error">{{ r.carryOvers }}</div>
            <div class="mt-1 text-xs text-gray-500">Carry-overs</div>
          </div>
        </div>

        <!-- Subject scores table -->
        @if (r.subjectScores | keyvalue; as scores) {
          @if (scores.length) {
            <div class="overflow-hidden rounded-lg border bg-surface shadow-none">
              <table class="w-full text-sm">
                <thead class="bg-surface-dark">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-400">Subject</th>
                    <th class="px-4 py-3 text-right font-semibold text-gray-400">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of scores; track item.key) {
                    <tr class="border-t">
                      <td class="px-4 py-3">{{ item.key }}</td>
                      <td class="px-4 py-3 text-right font-bold"
                        [class]="item.value.avg >= 35 ? 'text-success-dark' : 'text-error'">
                        {{ item.value.avg | number: '1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      } @else {
        <div class="rounded-lg border bg-surface p-8 text-center text-gray-400 shadow-none">
          No report for this week. Click "Generate Report" to create one.
        </div>
      }
    </div>
  `,
})
export class WeeklySummaryComponent implements OnInit {
  private reportService = inject(WeeklyReportService);
  currentWeekStart = signal(this.getMonday(new Date()));
  currentWeekEnd = signal(this.getSunday(new Date()));
  report = signal<WeeklyReport | null>(null);

  async ngOnInit(): Promise<void> { await this.loadReport(); }
  prevWeek(): void { const s = new Date(this.currentWeekStart()); s.setDate(s.getDate() - 7); this.currentWeekStart.set(s); this.currentWeekEnd.set(this.getSunday(s)); this.loadReport(); }
  nextWeek(): void { const s = new Date(this.currentWeekStart()); s.setDate(s.getDate() + 7); this.currentWeekStart.set(s); this.currentWeekEnd.set(this.getSunday(s)); this.loadReport(); }
  async generateReport(): Promise<void> { this.report.set(await this.reportService.generateWeeklyReport(this.currentWeekStart())); }
  private async loadReport(): Promise<void> { this.report.set(await this.reportService.getWeeklyReport(this.reportService.getWeekKey(this.currentWeekStart()))); }
  private getMonday(d: Date): Date { const date = new Date(d); const day = date.getDay(); return new Date(date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))); }
  private getSunday(m: Date): Date { const d = new Date(m); d.setDate(d.getDate() + 6); return d; }
}
