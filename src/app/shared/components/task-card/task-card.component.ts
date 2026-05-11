import { Component, inject, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../core/models/task.model';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { StreakService } from '../../../core/services/streak.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

const BORDER_COLORS: Record<string, string> = {
  exam: 'border-l-exam',
  sales: 'border-l-sales',
  coding: 'border-l-coding',
};

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [UpperCasePipe, FormsModule, FileUploadComponent],
  template: `
    <div
      class="mb-4 rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm"
      [class]="BORDER_COLORS[task.type] || ''"
      [class.bg-orange-50]="task.isCarryOver"
    >
      <!-- Header -->
      <div class="mb-2 flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-gray-900">
            @if (task.isCarryOver) {
              <i class="mdi mdi-replay text-warning mr-1"></i>
            }
            {{ task.title }}
          </h3>
          <div class="mt-1 flex flex-wrap gap-1.5">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium"
              [class]="task.type === 'exam' ? 'bg-blue-100 text-blue-700' : task.type === 'sales' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'">
              {{ task.type | uppercase }}
            </span>
            @if (task.subject) {
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ task.subject }}</span>
            }
            @if (task.examType) {
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ task.examType }}</span>
            }
            <span class="rounded-full px-2 py-0.5 text-xs font-medium"
              [class]="task.status === 'reviewed' ? 'bg-green-100 text-green-700' : task.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'">
              {{ task.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Body -->
      <p class="text-sm text-gray-600">{{ task.description }}</p>
      @if (task.chapters) {
        <p class="mt-1 text-sm"><strong>Chapters:</strong> {{ task.chapters }}</p>
      }
      @if (task.isCarryOver && task.carryOverFromDate) {
        <p class="mt-1 text-xs text-orange-700">Carried over from {{ task.carryOverFromDate }}</p>
      }

      <!-- Proofs -->
      @if (task.proofUrls.length) {
        <div class="mt-3">
          <strong class="text-sm">Proofs ({{ task.proofUrls.length }}):</strong>
          <div class="mt-1 flex flex-wrap gap-2">
            @for (url of task.proofUrls; track url; let i = $index) {
              <a [href]="url" target="_blank" class="flex items-center gap-1 text-sm text-primary hover:underline">
                <i class="mdi mdi-attachment"></i> File {{ i + 1 }}
              </a>
            }
          </div>
        </div>
      }

      <!-- Score -->
      @if (task.marks !== null && task.marks !== undefined) {
        <div class="mt-3 inline-block rounded-md px-3 py-1.5 text-lg font-bold"
          [class]="task.marks >= 35 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
          Score: {{ task.marks }}/100
        </div>
      }
      @if (task.feedback) {
        <p class="mt-1 text-sm italic text-gray-500">Feedback: {{ task.feedback }}</p>
      }

      <!-- Febin: Upload + Submit -->
      @if (viewMode.viewMode() === 'febin' && task.status === 'pending') {
        <div class="mt-4">
          <app-file-upload [date]="date" [taskId]="task.id || ''" (uploaded)="onFileUploaded($event)"></app-file-upload>
          <button
            class="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            (click)="submitTask()"
            [disabled]="!task.proofUrls.length"
          >
            <i class="mdi mdi-send"></i> Mark as Submitted
          </button>
        </div>
      }

      <!-- Abin: Review -->
      @if (viewMode.viewMode() === 'abin' && task.status === 'submitted') {
        <div class="mt-4 flex flex-col gap-3 rounded-lg bg-gray-50 p-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Marks (0-100)</label>
            <input type="number" [(ngModel)]="reviewMarks" min="0" max="100"
              class="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Feedback</label>
            <textarea [(ngModel)]="reviewFeedback" rows="2"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
          </div>
          <button
            class="flex w-fit items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            (click)="submitReview()"
          >
            <i class="mdi mdi-check-circle"></i> Submit Review
          </button>
        </div>
      }

      <!-- Abin: Carry-over for low scores -->
      @if (viewMode.viewMode() === 'abin' && task.status === 'reviewed' && task.marks !== null && task.marks < 35) {
        <button
          class="mt-3 flex items-center gap-2 rounded-lg border border-warning px-4 py-2 text-sm font-medium text-warning hover:bg-warning/10"
          (click)="triggerCarryOver()"
        >
          <i class="mdi mdi-replay"></i> Process Carry-Over
        </button>
      }
    </div>
  `,
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() date = '';

  viewMode = inject(ViewModeService);
  private scheduleService = inject(ScheduleService);
  private streakService = inject(StreakService);

  BORDER_COLORS = BORDER_COLORS;
  reviewMarks = 0;
  reviewFeedback = '';

  async onFileUploaded(url: string): Promise<void> {
    if (this.task.id) await this.scheduleService.addProofUrl(this.date, this.task.id, url);
  }
  async submitTask(): Promise<void> {
    if (this.task.id) {
      await this.scheduleService.updateTaskStatus(this.date, this.task.id, 'submitted');
      await this.streakService.recalculateStreak();
    }
  }
  async submitReview(): Promise<void> {
    if (this.task.id) await this.scheduleService.updateTaskMarks(this.date, this.task.id, this.reviewMarks, this.reviewFeedback);
  }
  async triggerCarryOver(): Promise<void> {
    if (this.task.id) await this.scheduleService.processCarryOver(this.date, this.task.id);
  }
}
