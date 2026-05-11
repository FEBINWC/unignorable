import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ScheduleService } from '../../core/services/schedule.service';
import { Task, Completion } from '../../core/models/task.model';
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

      @if (completion()) {
        <div class="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-primary font-medium">
          Day Order #{{ completion()!.dayOrder }} completed on this date
        </div>

        @if (examTasks().length > 0) {
          <h3 class="mb-3 flex items-center gap-2 border-b-2 border-exam pb-2 font-semibold text-exam">
            <i class="mdi mdi-school text-xl"></i> Exam Tasks
          </h3>
          @for (task of examTasks(); track task.id) { <app-task-card [task]="task" [dayOrderNum]="completion()!.dayOrder"></app-task-card> }
        }

        @if (salesTasks().length > 0) {
          <h3 class="mb-3 mt-5 flex items-center gap-2 border-b-2 border-sales pb-2 font-semibold text-sales">
            <i class="mdi mdi-handshake text-xl"></i> Sales Tasks
          </h3>
          @for (task of salesTasks(); track task.id) { <app-task-card [task]="task" [dayOrderNum]="completion()!.dayOrder"></app-task-card> }
        }

        @if (codingTasks().length > 0) {
          <h3 class="mb-3 mt-5 flex items-center gap-2 border-b-2 border-coding pb-2 font-semibold text-coding">
            <i class="mdi mdi-code-tags text-xl"></i> Coding Tasks
          </h3>
          @for (task of codingTasks(); track task.id) { <app-task-card [task]="task" [dayOrderNum]="completion()!.dayOrder"></app-task-card> }
        }
      } @else {
        <p class="py-10 text-center text-gray-400">No work recorded on this date.</p>
      }
    </div>
  `,
})
export class DayDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private scheduleService = inject(ScheduleService);

  date = '';
  dateObj = new Date();
  completion = signal<Completion | null>(null);
  tasks = signal<Task[]>([]);

  examTasks = computed(() => this.tasks().filter((t) => t.type === 'exam'));
  salesTasks = computed(() => this.tasks().filter((t) => t.type === 'sales'));
  codingTasks = computed(() => this.tasks().filter((t) => t.type === 'coding'));

  async ngOnInit(): Promise<void> {
    this.date = this.route.snapshot.paramMap.get('date') || '';
    this.dateObj = new Date(this.date + 'T00:00:00');

    // Find completion for this date
    const completions = await this.scheduleService.getCompletionsForDateRange(this.date, this.date);
    const comp = completions.get(this.date) || null;
    this.completion.set(comp);

    if (comp?.tasks) {
      const tasks: Task[] = [];
      Object.keys(comp.tasks).forEach((key) => {
        tasks.push({ ...comp.tasks[key], id: key });
      });
      this.tasks.set(tasks);
    }
  }
}
