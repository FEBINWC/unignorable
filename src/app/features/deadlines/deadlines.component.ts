import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeadlineService } from '../../core/services/deadline.service';
import { PaceService } from '../../core/services/pace.service';
import { Deadline, DeadlineType } from '../../core/models/deadline.model';
import { Vacation } from '../../core/models/task.model';
import { CountdownPipe } from '../../shared/pipes/countdown.pipe';

@Component({
  selector: 'app-deadlines',
  standalone: true,
  imports: [DatePipe, FormsModule, CountdownPipe],
  template: `
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-4 text-2xl font-bold">Important Deadlines</h1>

      @for (deadline of deadlines(); track deadline.id) {
        <div class="mb-3 flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm"
          [class.opacity-60]="deadline.completed"
          [class.border-l-4]="!deadline.completed"
          [class.border-l-warning]="isUrgent(deadline)"
          [class.border-l-error]="isOverdue(deadline)"
          [class.border-l-gray-300]="!isUrgent(deadline) && !isOverdue(deadline)">
          <input type="checkbox" [checked]="deadline.completed" (change)="toggleComplete(deadline.id!)"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <div class="flex-1">
            <h3 class="font-semibold" [class.line-through]="deadline.completed">{{ deadline.title }}</h3>
            <p class="text-sm text-gray-500">{{ deadline.description }}</p>
            <div class="mt-2 flex items-center gap-3">
              <span class="text-xs text-gray-400">{{ deadline.date | date: 'MMM d, y' }}</span>
              @if (!deadline.completed) {
                <span class="text-sm font-semibold" [class]="isOverdue(deadline) ? 'text-error' : isUrgent(deadline) ? 'text-warning-dark' : 'text-primary'">
                  {{ deadline.date | countdown }}
                </span>
              }
            </div>
          </div>
        </div>
      }

      @if (showDeadlineForm()) {
        <div class="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-semibold">Add Deadline</h3>
          <div class="flex flex-col gap-3">
            <input type="text" [(ngModel)]="newTitle" placeholder="Title" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="date" [(ngModel)]="newDate" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <select [(ngModel)]="newType" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="tma">TMA</option><option value="exam">Exam</option><option value="practical">Practical</option><option value="phase">Phase</option><option value="custom">Custom</option>
            </select>
            <textarea [(ngModel)]="newDesc" rows="2" placeholder="Description" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
            <div class="flex justify-end gap-2">
              <button class="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" (click)="showDeadlineForm.set(false)">Cancel</button>
              <button class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark" (click)="addDeadline()">Add</button>
            </div>
          </div>
        </div>
      }

      <!-- Vacations Section -->
      <h2 class="mb-3 mt-8 text-xl font-bold">Vacations / Leaves</h2>

      @for (vac of vacations(); track vac.id) {
        <div class="mb-3 flex items-center gap-3 rounded-lg border bg-purple-50 p-4 shadow-sm">
          <i class="mdi mdi-palm-tree text-xl text-purple-600"></i>
          <div class="flex-1">
            <p class="font-medium">{{ vac.start | date: 'MMM d' }} - {{ vac.end | date: 'MMM d, y' }}</p>
            <p class="text-sm text-gray-500">{{ vac.reason }}</p>
          </div>
          <button class="rounded p-1 text-gray-400 hover:text-error" (click)="removeVacation(vac.id!)">
            <i class="mdi mdi-delete text-xl"></i>
          </button>
        </div>
      }

      @if (showVacationForm()) {
        <div class="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-semibold">Add Vacation / Leave</h3>
          <div class="flex flex-col gap-3">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Start Date</label>
                <input type="date" [(ngModel)]="vacStart" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">End Date</label>
                <input type="date" [(ngModel)]="vacEnd" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <input type="text" [(ngModel)]="vacReason" placeholder="Reason (e.g., Family trip)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            <div class="flex justify-end gap-2">
              <button class="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" (click)="showVacationForm.set(false)">Cancel</button>
              <button class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700" (click)="addVacation()">Add Vacation</button>
            </div>
          </div>
        </div>
      }

      <!-- FAB -->
      @if (!showDeadlineForm() && !showVacationForm()) {
        <div class="fixed bottom-6 right-6 flex flex-col gap-2">
          <button class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700" (click)="showVacationForm.set(true)" title="Add Vacation">
            <i class="mdi mdi-palm-tree text-xl"></i>
          </button>
          <button class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark" (click)="showDeadlineForm.set(true)" title="Add Deadline">
            <i class="mdi mdi-plus text-2xl"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class DeadlinesComponent implements OnInit {
  private deadlineService = inject(DeadlineService);
  private paceService = inject(PaceService);

  deadlines = signal<Deadline[]>([]);
  vacations = signal<Vacation[]>([]);
  showDeadlineForm = signal(false);
  showVacationForm = signal(false);

  newTitle = ''; newDate = ''; newType: DeadlineType = 'custom'; newDesc = '';
  vacStart = ''; vacEnd = ''; vacReason = '';

  ngOnInit(): void {
    this.deadlineService.deadlines$.subscribe((d) => this.deadlines.set(d));
    this.paceService.vacations$.subscribe((v) => this.vacations.set(v));
  }

  isUrgent(d: Deadline): boolean { if (d.completed) return false; const diff = new Date(d.date).getTime() - Date.now(); return diff > 0 && diff < 14 * 86400000; }
  isOverdue(d: Deadline): boolean { return !d.completed && new Date(d.date) < new Date(); }
  async toggleComplete(id: string): Promise<void> { await this.deadlineService.toggleCompleted(id); }

  async addDeadline(): Promise<void> {
    if (!this.newTitle || !this.newDate) return;
    await this.deadlineService.addDeadline({ title: this.newTitle, date: this.newDate, type: this.newType, description: this.newDesc, completed: false });
    this.newTitle = ''; this.newDate = ''; this.newDesc = ''; this.showDeadlineForm.set(false);
  }

  async addVacation(): Promise<void> {
    if (!this.vacStart || !this.vacEnd) return;
    await this.paceService.addVacation(this.vacStart, this.vacEnd, this.vacReason);
    this.vacStart = ''; this.vacEnd = ''; this.vacReason = ''; this.showVacationForm.set(false);
  }

  async removeVacation(id: string): Promise<void> {
    await this.paceService.removeVacation(id);
  }
}
