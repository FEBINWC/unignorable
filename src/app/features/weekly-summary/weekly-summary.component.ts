import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe, KeyValuePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { WeeklyReportService } from '../../core/services/weekly-report.service';
import { WeeklyReport } from '../../core/models/weekly-report.model';

@Component({
  selector: 'app-weekly-summary',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    KeyValuePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  template: `
    <div class="weekly-page">
      <h1>Weekly Summary</h1>

      <div class="week-nav">
        <button mat-icon-button (click)="prevWeek()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>{{ currentWeekStart() | date: 'MMM d' }} - {{ currentWeekEnd() | date: 'MMM d, y' }}</h2>
        <button mat-icon-button (click)="nextWeek()">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <button mat-raised-button color="primary" (click)="generateReport()">
          <mat-icon>refresh</mat-icon>
          Generate Report
        </button>
      </div>

      @if (report(); as r) {
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ r.overallAvg | number: '1.0-0' }}</div>
              <div class="stat-label">Average Score</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ r.tasksCompleted }}</div>
              <div class="stat-label">Completed</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value warn">{{ r.tasksPending }}</div>
              <div class="stat-label">Pending</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value danger">{{ r.carryOvers }}</div>
              <div class="stat-label">Carry-overs</div>
            </mat-card-content>
          </mat-card>
        </div>

        @if (r.subjectScores | keyvalue; as scores) {
          <mat-card class="subject-table">
            <mat-card-header>
              <mat-card-title>Subject Scores</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="scores" class="full-width">
                <ng-container matColumnDef="key">
                  <th mat-header-cell *matHeaderCellDef>Subject</th>
                  <td mat-cell *matCellDef="let item">{{ item.key }}</td>
                </ng-container>
                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Avg Score</th>
                  <td mat-cell *matCellDef="let item"
                    [class.pass]="item.value.avg >= 35"
                    [class.fail]="item.value.avg < 35"
                  >{{ item.value.avg | number: '1.0-0' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['key', 'value']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['key', 'value']"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <mat-card>
          <mat-card-content>
            <p class="no-data">No report for this week. Click "Generate Report" to create one.</p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .weekly-page { max-width: 800px; margin: 0 auto; }
      .week-nav {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .week-nav h2 { margin: 0; min-width: 200px; text-align: center; }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .stat-card { text-align: center; }
      .stat-value { font-size: 32px; font-weight: 700; color: #1976d2; }
      .stat-value.warn { color: #e65100; }
      .stat-value.danger { color: #c62828; }
      .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
      .subject-table { margin-top: 16px; }
      .full-width { width: 100%; }
      .pass { color: #2e7d32; font-weight: 600; }
      .fail { color: #c62828; font-weight: 600; }
      .no-data { text-align: center; color: #888; padding: 24px; }
    `,
  ],
})
export class WeeklySummaryComponent implements OnInit {
  private reportService = inject(WeeklyReportService);

  currentWeekStart = signal(this.getMonday(new Date()));
  currentWeekEnd = signal(this.getSunday(new Date()));
  report = signal<WeeklyReport | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadReport();
  }

  prevWeek(): void {
    const start = new Date(this.currentWeekStart());
    start.setDate(start.getDate() - 7);
    this.currentWeekStart.set(start);
    this.currentWeekEnd.set(this.getSunday(start));
    this.loadReport();
  }

  nextWeek(): void {
    const start = new Date(this.currentWeekStart());
    start.setDate(start.getDate() + 7);
    this.currentWeekStart.set(start);
    this.currentWeekEnd.set(this.getSunday(start));
    this.loadReport();
  }

  async generateReport(): Promise<void> {
    const r = await this.reportService.generateWeeklyReport(
      this.currentWeekStart()
    );
    this.report.set(r);
  }

  private async loadReport(): Promise<void> {
    const weekKey = this.reportService.getWeekKey(this.currentWeekStart());
    const r = await this.reportService.getWeeklyReport(weekKey);
    this.report.set(r);
  }

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  private getSunday(monday: Date): Date {
    const date = new Date(monday);
    date.setDate(date.getDate() + 6);
    return date;
  }
}
