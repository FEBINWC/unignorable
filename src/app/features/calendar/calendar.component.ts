import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ScheduleService } from '../../core/services/schedule.service';
import { DaySummary } from '../../core/models/task.model';
import { ColorLegendComponent } from '../../shared/components/color-legend/color-legend.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DecimalPipe, ColorLegendComponent],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-center gap-4">
        <button class="rounded-lg p-2 hover:bg-gray-100" (click)="prevMonth()">
          <i class="mdi mdi-chevron-left text-2xl"></i>
        </button>
        <h2 class="min-w-[200px] text-center text-xl font-bold">{{ monthNames[currentMonth()] }} {{ currentYear() }}</h2>
        <button class="rounded-lg p-2 hover:bg-gray-100" (click)="nextMonth()">
          <i class="mdi mdi-chevron-right text-2xl"></i>
        </button>
      </div>

      <app-color-legend></app-color-legend>

      <div class="mt-4 grid grid-cols-7 gap-1">
        @for (day of weekDays; track day) {
          <div class="py-2 text-center text-xs font-semibold text-gray-500">{{ day }}</div>
        }
        @for (cell of calendarCells(); track $index) {
          @if (cell.day === 0) {
            <div></div>
          } @else {
            <div
              class="flex min-h-[70px] flex-col items-center rounded-md border border-gray-200 p-1.5 transition-transform md:min-h-[80px]"
              [style.background]="cell.color"
              [class.ring-2]="cell.isToday"
              [class.ring-primary]="cell.isToday"
              [class.cursor-pointer]="cell.hasTasks"
              [class.hover:scale-105]="cell.hasTasks"
              [class.hover:shadow-md]="cell.hasTasks"
              (click)="cell.hasTasks && openDay(cell.dateStr)"
            >
              <span class="text-sm font-semibold">{{ cell.day }}</span>
              @if (cell.summary) {
                <span class="mt-1 text-lg font-bold">{{ cell.summary.avgScore | number: '1.0-0' }}</span>
                <span class="text-[10px] text-gray-600">{{ cell.summary.completedTasks }}/{{ cell.summary.totalTasks }}</span>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  private router = inject(Router);

  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());
  calendarCells = signal<CalendarCell[]>([]);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  ngOnInit(): void { this.loadMonth(); }

  prevMonth(): void {
    if (this.currentMonth() === 0) { this.currentMonth.set(11); this.currentYear.update((y) => y - 1); }
    else { this.currentMonth.update((m) => m - 1); }
    this.loadMonth();
  }
  nextMonth(): void {
    if (this.currentMonth() === 11) { this.currentMonth.set(0); this.currentYear.update((y) => y + 1); }
    else { this.currentMonth.update((m) => m + 1); }
    this.loadMonth();
  }
  openDay(dateStr: string): void { this.router.navigate(['/calendar', dateStr]); }

  private async loadMonth(): Promise<void> {
    const year = this.currentYear(), month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    const summaries = await this.scheduleService.getDaySummariesForRange(startStr, endStr);
    const today = new Date().toISOString().split('T')[0];
    const cells: CalendarCell[] = [];
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    for (let i = 0; i < startDow; i++) cells.push({ day: 0, dateStr: '', color: '', isToday: false, hasTasks: false, summary: null });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const summary = summaries.get(dateStr) || null;
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const hasTasks = summary !== null && summary.totalTasks > 0;
      let color = '#ffffff';
      if (isFuture) color = '#f5f5f5';
      else if (summary && summary.totalTasks > 0) {
        if (summary.completedTasks < summary.totalTasks || summary.hasCarryOvers) color = '#fff3e0';
        else if (summary.avgScore >= 75) color = '#c8e6c9';
        else if (summary.avgScore >= 50) color = '#dcedc8';
        else if (summary.avgScore >= 35) color = '#fff9c4';
        else color = '#ffcdd2';
      }
      cells.push({ day: d, dateStr, color, isToday, hasTasks, summary });
    }
    this.calendarCells.set(cells);
  }
}

interface CalendarCell { day: number; dateStr: string; color: string; isToday: boolean; hasTasks: boolean; summary: DaySummary | null; }
