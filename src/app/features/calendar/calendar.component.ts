import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ScheduleService } from '../../core/services/schedule.service';
import { DaySummary } from '../../core/models/task.model';
import { ColorLegendComponent } from '../../shared/components/color-legend/color-legend.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatCardModule, ColorLegendComponent],
  template: `
    <div class="calendar-page">
      <div class="calendar-header">
        <button mat-icon-button (click)="prevMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>{{ monthNames[currentMonth()] }} {{ currentYear() }}</h2>
        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <app-color-legend></app-color-legend>

      <div class="calendar-grid">
        @for (day of weekDays; track day) {
          <div class="day-header">{{ day }}</div>
        }
        @for (cell of calendarCells(); track $index) {
          @if (cell.day === 0) {
            <div class="day-cell empty"></div>
          } @else {
            <div
              class="day-cell"
              [style.background]="cell.color"
              [class.today]="cell.isToday"
              [class.clickable]="cell.hasTasks"
              (click)="cell.hasTasks && openDay(cell.dateStr)"
            >
              <span class="day-number">{{ cell.day }}</span>
              @if (cell.summary) {
                <span class="day-score">{{ cell.summary.avgScore | number: '1.0-0' }}</span>
                <span class="day-tasks">{{ cell.summary.completedTasks }}/{{ cell.summary.totalTasks }}</span>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .calendar-page { max-width: 900px; margin: 0 auto; }
      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .calendar-header h2 { margin: 0; min-width: 200px; text-align: center; }
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        margin-top: 16px;
      }
      .day-header {
        text-align: center;
        font-weight: 600;
        padding: 8px;
        color: #555;
        font-size: 13px;
      }
      .day-cell {
        min-height: 80px;
        border-radius: 6px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 1px solid #e0e0e0;
        transition: transform 0.15s;
      }
      .day-cell.empty { border: none; }
      .day-cell.clickable { cursor: pointer; }
      .day-cell.clickable:hover { transform: scale(1.05); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
      .day-cell.today { border: 2px solid #1976d2; }
      .day-number { font-weight: 600; font-size: 14px; }
      .day-score { font-size: 18px; font-weight: 700; margin-top: 4px; }
      .day-tasks { font-size: 11px; color: #555; }
      @media (max-width: 768px) {
        .day-cell { min-height: 50px; padding: 4px; }
        .day-score { font-size: 14px; }
        .day-tasks { display: none; }
      }
    `,
  ],
})
export class CalendarComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private router = inject(Router);

  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  calendarCells = signal<CalendarCell[]>([]);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  ngOnInit(): void {
    this.loadMonth();
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.update((m) => m - 1);
    }
    this.loadMonth();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.update((m) => m + 1);
    }
    this.loadMonth();
  }

  openDay(dateStr: string): void {
    this.router.navigate(['/calendar', dateStr]);
  }

  private async loadMonth(): Promise<void> {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const summaries = await this.scheduleService.getDaySummariesForRange(
      startStr,
      endStr
    );

    const today = new Date().toISOString().split('T')[0];
    const cells: CalendarCell[] = [];

    // Empty cells for days before the 1st (Monday-based)
    let startDow = firstDay.getDay(); // 0=Sun, 1=Mon...
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0
    for (let i = 0; i < startDow; i++) {
      cells.push({ day: 0, dateStr: '', color: '', isToday: false, hasTasks: false, summary: null });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const summary = summaries.get(dateStr) || null;
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const hasTasks = summary !== null && summary.totalTasks > 0;

      let color = '#ffffff'; // no tasks
      if (isFuture) {
        color = '#f5f5f5'; // gray for future
      } else if (summary && summary.totalTasks > 0) {
        if (summary.completedTasks < summary.totalTasks || summary.hasCarryOvers) {
          color = '#fff3e0'; // orange - pending/carry-overs
        } else if (summary.avgScore >= 75) {
          color = '#c8e6c9'; // dark green
        } else if (summary.avgScore >= 50) {
          color = '#dcedc8'; // light green
        } else if (summary.avgScore >= 35) {
          color = '#fff9c4'; // yellow
        } else {
          color = '#ffcdd2'; // red
        }
      }

      cells.push({ day: d, dateStr, color, isToday, hasTasks, summary });
    }

    this.calendarCells.set(cells);
  }
}

interface CalendarCell {
  day: number;
  dateStr: string;
  color: string;
  isToday: boolean;
  hasTasks: boolean;
  summary: DaySummary | null;
}
