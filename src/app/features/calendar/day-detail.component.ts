import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ScheduleService } from '../../core/services/schedule.service';
import { Task } from '../../core/models/task.model';
import { TaskCardComponent } from '../../shared/components/task-card/task-card.component';

@Component({
  selector: 'app-day-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, TaskCardComponent],
  template: `
    <div class="mx-auto max-w-3xl">
      <div class="mb-4 flex items-center gap-3">
        <a routerLink="/calendar" class="rounded-lg p-2 hover:bg-gray-100">
          <i class="mdi mdi-arrow-left text-xl"></i>
        </a>
        <h1 class="text-xl font-bold">{{ dateObj | date: 'EEEE, MMMM d, y' }}</h1>
      </div>

      @if (tasks().length === 0) {
        <p class="py-10 text-center text-gray-400">No tasks scheduled for this day.</p>
      }

      @if (carryOverTasks().length > 0) {
        <h3 class="mb-3 flex items-center gap-2 border-b-2 border-orange-400 pb-2 font-semibold text-orange-700">
          <i class="mdi mdi-replay text-xl"></i> Carry-over Tasks ({{ carryOverTasks().length }})
        </h3>
        @for (task of carryOverTasks(); track task.id) {
          <app-task-card [task]="task" [date]="date"></app-task-card>
        }
      }

      @if (examTasks().length > 0) {
        <h3 class="mb-3 mt-5 flex items-center gap-2 border-b-2 border-exam pb-2 font-semibold text-exam">
          <i class="mdi mdi-school text-xl"></i> Exam Tasks
        </h3>
        @for (task of examTasks(); track task.id) { <app-task-card [task]="task" [date]="date"></app-task-card> }
      }

      @if (salesTasks().length > 0) {
        <h3 class="mb-3 mt-5 flex items-center gap-2 border-b-2 border-sales pb-2 font-semibold text-sales">
          <i class="mdi mdi-handshake text-xl"></i> Sales Tasks
        </h3>
        @for (task of salesTasks(); track task.id) { <app-task-card [task]="task" [date]="date"></app-task-card> }
      }

      @if (codingTasks().length > 0) {
        <h3 class="mb-3 mt-5 flex items-center gap-2 border-b-2 border-coding pb-2 font-semibold text-coding">
          <i class="mdi mdi-code-tags text-xl"></i> Coding Tasks
        </h3>
        @for (task of codingTasks(); track task.id) { <app-task-card [task]="task" [date]="date"></app-task-card> }
      }
    </div>
  `,
})
export class DayDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private scheduleService = inject(ScheduleService);

  date = '';
  dateObj = new Date();
  tasks = signal<Task[]>([]);

  carryOverTasks = computed(() => this.tasks().filter((t) => t.isCarryOver));
  examTasks = computed(() => this.tasks().filter((t) => t.type === 'exam' && !t.isCarryOver));
  salesTasks = computed(() => this.tasks().filter((t) => t.type === 'sales' && !t.isCarryOver));
  codingTasks = computed(() => this.tasks().filter((t) => t.type === 'coding' && !t.isCarryOver));

  ngOnInit(): void {
    this.date = this.route.snapshot.paramMap.get('date') || '';
    this.dateObj = new Date(this.date + 'T00:00:00');
    this.scheduleService.getTasksForDate(this.date).subscribe((t) => this.tasks.set(t));
  }
}
