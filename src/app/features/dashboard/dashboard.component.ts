import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScheduleService } from '../../core/services/schedule.service';
import { DeadlineService } from '../../core/services/deadline.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { Task, DayOrder, Progress } from '../../core/models/task.model';
import { Deadline } from '../../core/models/deadline.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { StreakBadgeComponent } from '../../shared/components/streak-badge/streak-badge.component';
import { PaceIndicatorComponent } from '../../shared/components/pace-indicator/pace-indicator.component';
import { CountdownPipe } from '../../shared/pipes/countdown.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, TaskCardComponent, StreakBadgeComponent, PaceIndicatorComponent, CountdownPipe],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="mb-4">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ viewMode.viewMode() === 'febin' ? "Febin's Dashboard" : "Parent's Review Queue" }}
        </h1>
        <p class="text-sm text-gray-500">{{ today | date: 'EEEE, MMMM d, y' }}</p>
      </div>

      <!-- Pace + Streak + Deadline -->
      <div class="mb-6 flex flex-col gap-4">
        <app-pace-indicator></app-pace-indicator>
        <div class="flex flex-wrap gap-4">
          <app-streak-badge></app-streak-badge>
          @if (nextDeadline(); as deadline) {
            <div class="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-w-[200px]">
              <i class="mdi mdi-flag text-2xl text-warning"></i>
              <div>
                <strong class="text-sm">{{ deadline.title }}</strong>
                <p class="text-sm font-medium text-orange-600">{{ deadline.date | countdown }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      @if (viewMode.viewMode() === 'parent') {
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 font-medium text-primary">
          <i class="mdi mdi-file-document-edit-outline text-xl"></i>
          {{ pendingReviewCount() }} tasks pending review
          <a routerLink="/calendar" class="ml-auto text-sm text-primary hover:underline">View Calendar</a>
        </div>
      }

      <!-- Current Day Order -->
      @if (currentDayOrder(); as dayOrder) {
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Day Order #{{ dayOrder.dayOrder }}</h2>
          <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Phase {{ dayOrder.phase }} &middot; {{ dayOrder.dayType }}
          </span>
        </div>
      } @else {
        <h2 class="mb-3 text-lg font-semibold">Today's Tasks</h2>
      }

      @if (tasks().length === 0) {
        <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading tasks...
        </div>
      }

      @for (task of tasks(); track task.id) {
        <app-task-card [task]="task" [dayOrderNum]="progress()?.currentDayOrder || 1"></app-task-card>
      }

      <!-- Complete Day Order button (Febin view, all submitted) -->
      @if (viewMode.viewMode() === 'febin' && allSubmitted() && tasks().length > 0) {
        <button
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-success py-3 text-lg font-semibold text-white shadow-md hover:bg-success-dark"
          (click)="completeDayOrder()"
        >
          <i class="mdi mdi-check-all text-2xl"></i>
          Complete Day Order #{{ progress()?.currentDayOrder }}
        </button>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  viewMode = inject(ViewModeService);
  private scheduleService = inject(ScheduleService);
  private deadlineService = inject(DeadlineService);

  today = new Date();
  tasks = signal<Task[]>([]);
  currentDayOrder = signal<DayOrder | null>(null);
  progress = signal<Progress | null>(null);
  deadlines = signal<Deadline[]>([]);

  pendingReviewCount = computed(() => this.tasks().filter((t) => t.status === 'submitted').length);
  allSubmitted = computed(() => this.tasks().length > 0 && this.tasks().every((t) => t.status === 'submitted' || t.status === 'reviewed'));
  nextDeadline = computed(() => {
    const todayStr = this.today.toISOString().split('T')[0];
    return this.deadlines().find((d) => !d.completed && d.date >= todayStr) || null;
  });

  ngOnInit(): void {
    this.scheduleService.getCurrentDayOrder().subscribe((data) => {
      this.progress.set(data.progress);
      this.currentDayOrder.set(data.dayOrder);
      this.tasks.set(data.tasks);
    });
    this.deadlineService.deadlines$.subscribe((d) => this.deadlines.set(d));
  }

  async completeDayOrder(): Promise<void> {
    const p = this.progress();
    if (p) {
      await this.scheduleService.completeDayOrder(p.currentDayOrder);
    }
  }
}
