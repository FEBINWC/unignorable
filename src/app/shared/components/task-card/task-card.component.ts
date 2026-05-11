import { Component, inject, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { Task } from '../../../core/models/task.model';
import { ViewModeService } from '../../../core/services/view-mode.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { StreakService } from '../../../core/services/streak.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    UpperCasePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatBadgeModule,
    FileUploadComponent,
  ],
  template: `
    <mat-card [class]="'task-card type-' + task.type" [class.carry-over]="task.isCarryOver">
      <mat-card-header>
        <mat-card-title>
          @if (task.isCarryOver) {
            <mat-icon class="carry-over-icon" color="warn">replay</mat-icon>
          }
          {{ task.title }}
        </mat-card-title>
        <mat-card-subtitle>
          <mat-chip-set>
            <mat-chip [class]="'chip-' + task.type">{{ task.type | uppercase }}</mat-chip>
            @if (task.subject) {
              <mat-chip>{{ task.subject }}</mat-chip>
            }
            @if (task.examType) {
              <mat-chip>{{ task.examType }}</mat-chip>
            }
            <mat-chip [class]="'status-' + task.status">{{ task.status }}</mat-chip>
          </mat-chip-set>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p class="description">{{ task.description }}</p>
        @if (task.chapters) {
          <p class="chapters"><strong>Chapters:</strong> {{ task.chapters }}</p>
        }
        @if (task.isCarryOver && task.carryOverFromDate) {
          <p class="carry-over-info">Carried over from {{ task.carryOverFromDate }}</p>
        }

        <!-- Proof attachments -->
        @if (task.proofUrls.length) {
          <div class="proofs">
            <strong>Proofs ({{ task.proofUrls.length }}):</strong>
            <div class="proof-list">
              @for (url of task.proofUrls; track url; let i = $index) {
                <a [href]="url" target="_blank" class="proof-link">
                  <mat-icon>attachment</mat-icon>
                  File {{ i + 1 }}
                </a>
              }
            </div>
          </div>
        }

        <!-- Marks display -->
        @if (task.marks !== null && task.marks !== undefined) {
          <div class="marks-display" [class.pass]="task.marks >= 35" [class.fail]="task.marks < 35">
            <strong>Score: {{ task.marks }}/100</strong>
          </div>
        }
        @if (task.feedback) {
          <p class="feedback"><em>Feedback: {{ task.feedback }}</em></p>
        }

        <!-- FEBIN VIEW: Upload & Submit -->
        @if (viewMode.viewMode() === 'febin' && task.status === 'pending') {
          <app-file-upload
            [date]="date"
            [taskId]="task.id || ''"
            (uploaded)="onFileUploaded($event)"
          ></app-file-upload>
          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            (click)="submitTask()"
            [disabled]="!task.proofUrls.length"
          >
            <mat-icon>send</mat-icon>
            Mark as Submitted
          </button>
        }

        <!-- ABIN VIEW: Review -->
        @if (viewMode.viewMode() === 'abin' && task.status === 'submitted') {
          <div class="review-section">
            <mat-form-field appearance="outline" class="marks-input">
              <mat-label>Marks (0-100)</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="reviewMarks"
                min="0"
                max="100"
              />
            </mat-form-field>
            <mat-form-field appearance="outline" class="feedback-input">
              <mat-label>Feedback</mat-label>
              <textarea matInput [(ngModel)]="reviewFeedback" rows="2"></textarea>
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="submitReview()">
              <mat-icon>check_circle</mat-icon>
              Submit Review
            </button>
          </div>
        }

        <!-- ABIN VIEW: Carry-over button for low scores -->
        @if (viewMode.viewMode() === 'abin' && task.status === 'reviewed' && task.marks !== null && task.marks < 35) {
          <button
            mat-stroked-button
            color="warn"
            class="carry-over-btn"
            (click)="triggerCarryOver()"
          >
            <mat-icon>replay</mat-icon>
            Process Carry-Over
          </button>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .task-card {
        margin-bottom: 16px;
        border-left: 4px solid #ccc;
      }
      .type-exam { border-left-color: #1976d2; }
      .type-sales { border-left-color: #388e3c; }
      .type-coding { border-left-color: #7b1fa2; }
      .carry-over {
        background: #fff3e0;
      }
      .carry-over-icon { vertical-align: middle; margin-right: 4px; }
      .carry-over-info { color: #e65100; font-size: 13px; }
      .description { color: #555; margin: 8px 0; }
      .chapters { color: #333; }
      .proofs { margin: 12px 0; }
      .proof-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
      .proof-link {
        display: flex;
        align-items: center;
        gap: 2px;
        color: #1976d2;
        text-decoration: none;
        font-size: 13px;
      }
      .marks-display {
        font-size: 18px;
        padding: 8px 12px;
        border-radius: 6px;
        display: inline-block;
        margin: 8px 0;
      }
      .marks-display.pass { background: #e8f5e9; color: #2e7d32; }
      .marks-display.fail { background: #ffebee; color: #c62828; }
      .feedback { color: #666; font-size: 13px; }
      .submit-btn { margin-top: 12px; }
      .review-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .marks-input { max-width: 180px; }
      .carry-over-btn { margin-top: 8px; }
      .chip-exam { --mdc-chip-elevated-container-color: #e3f2fd; }
      .chip-sales { --mdc-chip-elevated-container-color: #e8f5e9; }
      .chip-coding { --mdc-chip-elevated-container-color: #f3e5f5; }
      .status-pending { --mdc-chip-elevated-container-color: #fff3e0; }
      .status-submitted { --mdc-chip-elevated-container-color: #e3f2fd; }
      .status-reviewed { --mdc-chip-elevated-container-color: #e8f5e9; }
    `,
  ],
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() date = '';

  viewMode = inject(ViewModeService);
  private scheduleService = inject(ScheduleService);
  private streakService = inject(StreakService);

  reviewMarks: number = 0;
  reviewFeedback: string = '';

  async onFileUploaded(url: string): Promise<void> {
    if (this.task.id) {
      await this.scheduleService.addProofUrl(this.date, this.task.id, url);
    }
  }

  async submitTask(): Promise<void> {
    if (this.task.id) {
      await this.scheduleService.updateTaskStatus(
        this.date,
        this.task.id,
        'submitted'
      );
      await this.streakService.recalculateStreak();
    }
  }

  async submitReview(): Promise<void> {
    if (this.task.id) {
      await this.scheduleService.updateTaskMarks(
        this.date,
        this.task.id,
        this.reviewMarks,
        this.reviewFeedback
      );
    }
  }

  async triggerCarryOver(): Promise<void> {
    if (this.task.id) {
      await this.scheduleService.processCarryOver(this.date, this.task.id);
    }
  }
}
