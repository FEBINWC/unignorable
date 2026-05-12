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
        <h1 class="text-2xl font-bold text-white">
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
            <div class="flex flex-1 items-center gap-3 rounded-xl border border-gray-700 bg-surface p-4 shadow-sm min-w-[200px]">
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
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 font-medium text-primary">
          <i class="mdi mdi-file-document-edit-outline text-xl"></i>
          {{ pendingReviewCount() }} tasks pending review
          <a routerLink="/calendar" class="ml-auto text-sm text-primary hover:underline">View Calendar</a>
        </div>
      }

      <!-- Current Day Order -->
      @if (currentDayOrder(); as dayOrder) {
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Day Order #{{ dayOrder.dayOrder }}</h2>
          <span class="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">
            Phase {{ dayOrder.phase }} &middot; {{ dayOrder.dayType }}
          </span>
        </div>
      } @else {
        <h2 class="mb-3 text-lg font-semibold">Today's Tasks</h2>
      }

      @if (tasks().length === 0) {
        <div class="rounded-lg border border-gray-700 bg-surface p-8 text-center text-gray-500">
          Loading tasks...
        </div>
      }

      <!-- Block 1: Exam (9:00 AM - 12:30 PM) -->
      @if (examTasks().length > 0) {
        <div class="mb-5 rounded-xl border border-primary/30 bg-surface overflow-hidden">
          <div class="flex items-center gap-3 bg-primary/10 px-4 py-3 border-b border-primary/30">
            <i class="mdi mdi-school text-xl text-primary"></i>
            <div>
              <h3 class="font-semibold text-primary">Exam Block</h3>
              <p class="text-xs text-gray-500">9:00 AM — 12:30 PM (3.5 hrs)</p>
            </div>
            <div class="ml-auto flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
              <i class="mdi mdi-clock-outline text-sm"></i> 9:00 — 12:30
            </div>
          </div>
          <div class="p-4">
            @for (task of examTasks(); track task.id) {
              <app-task-card [task]="task" [dayOrderNum]="progress()?.currentDayOrder || 1"></app-task-card>
            }
          </div>
        </div>
      }

      <!-- Break indicator -->
      @if (examTasks().length > 0 && salesTasks().length > 0) {
        <div class="mb-5 flex items-center gap-3 px-4 text-xs text-gray-400">
          <div class="flex-1 border-t border-dashed border-gray-700"></div>
          <span><i class="mdi mdi-food"></i> Lunch Break &middot; 12:30 — 1:30 PM</span>
          <div class="flex-1 border-t border-dashed border-gray-700"></div>
        </div>
      }

      <!-- Block 2: Sales (1:30 PM - 4:00 PM) -->
      @if (salesTasks().length > 0) {
        <div class="mb-5 rounded-xl border border-success/30 bg-surface overflow-hidden">
          <div class="flex items-center gap-3 bg-success/10 px-4 py-3 border-b border-success/30">
            <i class="mdi mdi-handshake text-xl text-success"></i>
            <div>
              <h3 class="font-semibold text-success">Sales Block</h3>
              <p class="text-xs text-gray-500">1:30 PM — 3:45 PM (2.25 hrs)</p>
            </div>
            <div class="ml-auto flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
              <i class="mdi mdi-clock-outline text-sm"></i> 1:30 — 3:45
            </div>
          </div>
          <div class="p-4">
            @for (task of salesTasks(); track task.id) {
              <app-task-card [task]="task" [dayOrderNum]="progress()?.currentDayOrder || 1"></app-task-card>
            }
          </div>
        </div>
      }

      <!-- Break indicator -->
      @if (salesTasks().length > 0 && codingTasks().length > 0) {
        <div class="mb-5 flex items-center gap-3 px-4 text-xs text-gray-400">
          <div class="flex-1 border-t border-dashed border-gray-700"></div>
          <span><i class="mdi mdi-coffee"></i> Break &middot; 3:45 — 4:30 PM</span>
          <div class="flex-1 border-t border-dashed border-gray-700"></div>
        </div>
      }

      <!-- Block 3: Coding (4:15 PM - 7:00 PM) -->
      @if (codingTasks().length > 0) {
        <div class="mb-5 rounded-xl border border-coding/30 bg-surface overflow-hidden">
          <div class="flex items-center gap-3 bg-coding/10 px-4 py-3 border-b border-coding/30">
            <i class="mdi mdi-code-tags text-xl text-coding"></i>
            <div>
              <h3 class="font-semibold text-coding">Coding Block</h3>
              <p class="text-xs text-gray-500">4:30 PM — 7:00 PM (2.5 hrs)</p>
            </div>
            <div class="ml-auto flex items-center gap-1.5 rounded-full bg-coding/20 px-2.5 py-1 text-xs font-medium text-coding">
              <i class="mdi mdi-clock-outline text-sm"></i> 4:30 — 7:00
            </div>
          </div>
          <div class="p-4">
            @for (task of codingTasks(); track task.id) {
              <app-task-card [task]="task" [dayOrderNum]="progress()?.currentDayOrder || 1"></app-task-card>
            }
          </div>
        </div>
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

  examTasks = computed(() => this.tasks().filter((t) => t.type === 'exam'));
  salesTasks = computed(() => this.tasks().filter((t) => t.type === 'sales'));
  codingTasks = computed(() => this.tasks().filter((t) => t.type === 'coding'));
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
