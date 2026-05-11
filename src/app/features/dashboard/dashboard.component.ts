import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScheduleService } from '../../core/services/schedule.service';
import { DeadlineService } from '../../core/services/deadline.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { Task } from '../../core/models/task.model';
import { Deadline } from '../../core/models/deadline.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';
import { StreakBadgeComponent } from '../../shared/components/streak-badge/streak-badge.component';
import { CountdownPipe } from '../../shared/pipes/countdown.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, TaskCardComponent, StreakBadgeComponent, CountdownPipe],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="mb-4">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ viewMode.viewMode() === 'febin' ? "Febin's Dashboard" : "Abin's Review Queue" }}
        </h1>
        <p class="text-sm text-gray-500">{{ today | date: 'EEEE, MMMM d, y' }}</p>
      </div>

      <div class="mb-6 flex flex-wrap gap-4">
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

      @if (viewMode.viewMode() === 'abin') {
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 font-medium text-primary">
          <i class="mdi mdi-file-document-edit-outline text-xl"></i>
          {{ pendingReviewCount() }} tasks pending review
          <a routerLink="/calendar" class="ml-auto text-sm text-primary hover:underline">View Calendar</a>
        </div>
      }

      <h2 class="mb-3 text-lg font-semibold">Today's Tasks</h2>
      @if (tasks().length === 0) {
        <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          No tasks scheduled for today. Enjoy your rest!
        </div>
      }

      @for (task of carryOverTasks(); track task.id) {
        <app-task-card [task]="task" [date]="todayStr"></app-task-card>
      }
      @for (task of regularTasks(); track task.id) {
        <app-task-card [task]="task" [date]="todayStr"></app-task-card>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  viewMode = inject(ViewModeService);
  private scheduleService = inject(ScheduleService);
  private deadlineService = inject(DeadlineService);

  today = new Date();
  todayStr = this.today.toISOString().split('T')[0];
  tasks = signal<Task[]>([]);
  deadlines = signal<Deadline[]>([]);

  carryOverTasks = computed(() => this.tasks().filter((t) => t.isCarryOver));
  regularTasks = computed(() => this.tasks().filter((t) => !t.isCarryOver));
  pendingReviewCount = computed(() => this.tasks().filter((t) => t.status === 'submitted').length);
  nextDeadline = computed(() => this.deadlines().find((d) => !d.completed && d.date >= this.todayStr) || null);

  ngOnInit(): void {
    this.scheduleService.getTasksForDate(this.todayStr).subscribe((t) => this.tasks.set(t));
    this.deadlineService.deadlines$.subscribe((d) => this.deadlines.set(d));
  }
}
