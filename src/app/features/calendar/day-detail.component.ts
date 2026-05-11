import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ScheduleService } from '../../core/services/schedule.service';
import { ViewModeService } from '../../core/services/view-mode.service';
import { Task } from '../../core/models/task.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, TaskCardComponent],
  template: `
    <div class="day-detail">
      <div class="header">
        <a mat-icon-button routerLink="/calendar">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1>{{ dateObj | date: 'EEEE, MMMM d, y' }}</h1>
      </div>

      @if (tasks().length === 0) {
        <p class="no-tasks">No tasks scheduled for this day.</p>
      }

      @if (carryOverTasks().length > 0) {
        <h3 class="section-title carry-over-title">
          <mat-icon color="warn">replay</mat-icon>
          Carry-over Tasks ({{ carryOverTasks().length }})
        </h3>
        @for (task of carryOverTasks(); track task.id) {
          <app-task-card [task]="task" [date]="date"></app-task-card>
        }
      }

      @if (examTasks().length > 0) {
        <h3 class="section-title exam-title">
          <mat-icon>school</mat-icon>
          Exam Tasks
        </h3>
        @for (task of examTasks(); track task.id) {
          <app-task-card [task]="task" [date]="date"></app-task-card>
        }
      }

      @if (salesTasks().length > 0) {
        <h3 class="section-title sales-title">
          <mat-icon>handshake</mat-icon>
          Sales Tasks
        </h3>
        @for (task of salesTasks(); track task.id) {
          <app-task-card [task]="task" [date]="date"></app-task-card>
        }
      }

      @if (codingTasks().length > 0) {
        <h3 class="section-title coding-title">
          <mat-icon>code</mat-icon>
          Coding Tasks
        </h3>
        @for (task of codingTasks(); track task.id) {
          <app-task-card [task]="task" [date]="date"></app-task-card>
        }
      }
    </div>
  `,
  styles: [
    `
      .day-detail { max-width: 800px; margin: 0 auto; }
      .header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .header h1 { margin: 0; }
      .no-tasks { color: #888; font-size: 16px; text-align: center; padding: 40px; }
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 20px 0 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e0e0e0;
      }
      .exam-title { border-bottom-color: #1976d2; }
      .sales-title { border-bottom-color: #388e3c; }
      .coding-title { border-bottom-color: #7b1fa2; }
      .carry-over-title { border-bottom-color: #e65100; }
    `,
  ],
})
export class DayDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private scheduleService = inject(ScheduleService);
  viewMode = inject(ViewModeService);

  date = '';
  dateObj = new Date();
  tasks = signal<Task[]>([]);

  carryOverTasks = computed(() =>
    this.tasks().filter((t) => t.isCarryOver)
  );
  examTasks = computed(() =>
    this.tasks().filter((t) => t.type === 'exam' && !t.isCarryOver)
  );
  salesTasks = computed(() =>
    this.tasks().filter((t) => t.type === 'sales' && !t.isCarryOver)
  );
  codingTasks = computed(() =>
    this.tasks().filter((t) => t.type === 'coding' && !t.isCarryOver)
  );

  ngOnInit(): void {
    this.date = this.route.snapshot.paramMap.get('date') || '';
    this.dateObj = new Date(this.date + 'T00:00:00');
    this.scheduleService.getTasksForDate(this.date).subscribe((tasks) => {
      this.tasks.set(tasks);
    });
  }
}
