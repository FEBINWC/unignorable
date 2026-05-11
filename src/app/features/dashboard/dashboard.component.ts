import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TaskCardComponent,
    StreakBadgeComponent,
    CountdownPipe,
  ],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>
          @if (viewMode.viewMode() === 'febin') {
            Febin's Dashboard
          } @else {
            Abin's Review Queue
          }
        </h1>
        <p class="today-date">{{ today | date: 'EEEE, MMMM d, y' }}</p>
      </div>

      <div class="top-section">
        <app-streak-badge></app-streak-badge>

        @if (nextDeadline(); as deadline) {
          <mat-card class="deadline-card">
            <mat-card-content>
              <div class="deadline-info">
                <mat-icon color="warn">flag</mat-icon>
                <div>
                  <strong>{{ deadline.title }}</strong>
                  <p>{{ deadline.date | countdown }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      @if (viewMode.viewMode() === 'abin') {
        <div class="pending-count">
          <mat-icon>rate_review</mat-icon>
          {{ pendingReviewCount() }} tasks pending review
          <a mat-button routerLink="/calendar" color="primary">View Calendar</a>
        </div>
      }

      <h2>Today's Tasks</h2>
      @if (tasks().length === 0) {
        <mat-card>
          <mat-card-content>
            <p>No tasks scheduled for today. Enjoy your rest!</p>
          </mat-card-content>
        </mat-card>
      }

      <!-- Carry-over tasks first -->
      @for (task of carryOverTasks(); track task.id) {
        <app-task-card [task]="task" [date]="todayStr"></app-task-card>
      }

      <!-- Regular tasks -->
      @for (task of regularTasks(); track task.id) {
        <app-task-card [task]="task" [date]="todayStr"></app-task-card>
      }
    </div>
  `,
  styles: [
    `
      .dashboard { max-width: 800px; margin: 0 auto; }
      .header h1 { margin: 0; }
      .today-date { color: #666; margin: 4px 0 16px; }
      .top-section {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .deadline-card {
        flex: 1;
        min-width: 200px;
      }
      .deadline-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .deadline-info p {
        margin: 4px 0 0;
        color: #e65100;
        font-weight: 500;
      }
      .pending-count {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #e3f2fd;
        border-radius: 8px;
        margin-bottom: 16px;
        font-weight: 500;
      }
      h2 { margin: 16px 0 12px; }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  viewMode = inject(ViewModeService);
  private scheduleService = inject(ScheduleService);
  private deadlineService = inject(DeadlineService);

  today = new Date();
  todayStr = this.today.toISOString().split('T')[0];

  tasks = signal<Task[]>([]);
  deadlines = signal<Deadline[]>([]);

  carryOverTasks = computed(() =>
    this.tasks().filter((t) => t.isCarryOver)
  );
  regularTasks = computed(() =>
    this.tasks().filter((t) => !t.isCarryOver)
  );
  pendingReviewCount = computed(() =>
    this.tasks().filter((t) => t.status === 'submitted').length
  );
  nextDeadline = computed(() => {
    const upcoming = this.deadlines().find(
      (d) => !d.completed && d.date >= this.todayStr
    );
    return upcoming || null;
  });

  ngOnInit(): void {
    this.scheduleService.getTasksForDate(this.todayStr).subscribe((tasks) => {
      this.tasks.set(tasks);
    });
    this.deadlineService.deadlines$.subscribe((d) => {
      this.deadlines.set(d);
    });
  }
}
