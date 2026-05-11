import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DeadlineService } from '../../core/services/deadline.service';
import { Deadline, DeadlineType } from '../../core/models/deadline.model';
import { CountdownPipe } from '../../shared/pipes/countdown.pipe';

@Component({
  selector: 'app-deadlines',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CountdownPipe,
  ],
  template: `
    <div class="deadlines-page">
      <h1>Important Deadlines</h1>

      @for (deadline of deadlines(); track deadline.id) {
        <mat-card
          class="deadline-card"
          [class.completed]="deadline.completed"
          [class.urgent]="isUrgent(deadline)"
          [class.overdue]="isOverdue(deadline)"
        >
          <mat-card-content>
            <div class="deadline-row">
              <mat-checkbox
                [checked]="deadline.completed"
                (change)="toggleComplete(deadline.id!)"
              ></mat-checkbox>
              <div class="deadline-info">
                <h3 [class.done]="deadline.completed">{{ deadline.title }}</h3>
                <p>{{ deadline.description }}</p>
                <div class="deadline-meta">
                  <mat-chip [class]="'type-' + deadline.type">{{ deadline.type }}</mat-chip>
                  <span class="date">{{ deadline.date | date: 'MMM d, y' }}</span>
                  @if (!deadline.completed) {
                    <span class="countdown" [class.urgent-text]="isUrgent(deadline)" [class.overdue-text]="isOverdue(deadline)">
                      {{ deadline.date | countdown }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Add deadline form -->
      @if (showForm()) {
        <mat-card class="add-form">
          <mat-card-content>
            <h3>Add Deadline</h3>
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="newTitle" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput type="date" [(ngModel)]="newDate" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Type</mat-label>
              <mat-select [(ngModel)]="newType">
                <mat-option value="tma">TMA</mat-option>
                <mat-option value="exam">Exam</mat-option>
                <mat-option value="practical">Practical</mat-option>
                <mat-option value="phase">Phase</mat-option>
                <mat-option value="custom">Custom</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="newDesc" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              <button mat-button (click)="showForm.set(false)">Cancel</button>
              <button mat-raised-button color="primary" (click)="addDeadline()">Add</button>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <button mat-fab color="primary" class="add-btn" (click)="showForm.set(true)">
          <mat-icon>add</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .deadlines-page { max-width: 700px; margin: 0 auto; }
      .deadline-card { margin-bottom: 12px; }
      .deadline-card.completed { opacity: 0.6; }
      .deadline-card.urgent { border-left: 4px solid #ff9800; }
      .deadline-card.overdue { border-left: 4px solid #e53935; }
      .deadline-row { display: flex; align-items: flex-start; gap: 12px; }
      .deadline-info { flex: 1; }
      .deadline-info h3 { margin: 0; }
      .deadline-info h3.done { text-decoration: line-through; color: #999; }
      .deadline-info p { margin: 4px 0; color: #666; font-size: 14px; }
      .deadline-meta { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
      .date { font-size: 13px; color: #888; }
      .countdown { font-weight: 600; font-size: 14px; color: #1976d2; }
      .urgent-text { color: #e65100; }
      .overdue-text { color: #c62828; }
      .type-tma { --mdc-chip-elevated-container-color: #e3f2fd; }
      .type-exam { --mdc-chip-elevated-container-color: #fce4ec; }
      .type-practical { --mdc-chip-elevated-container-color: #f3e5f5; }
      .type-phase { --mdc-chip-elevated-container-color: #e8f5e9; }
      .add-form { margin-top: 16px; }
      .add-form mat-form-field { width: 100%; }
      .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
      .add-btn { position: fixed; bottom: 24px; right: 24px; }
    `,
  ],
})
export class DeadlinesComponent implements OnInit {
  private deadlineService = inject(DeadlineService);

  deadlines = signal<Deadline[]>([]);
  showForm = signal(false);

  newTitle = '';
  newDate = '';
  newType: DeadlineType = 'custom';
  newDesc = '';

  ngOnInit(): void {
    this.deadlineService.deadlines$.subscribe((d) => this.deadlines.set(d));
  }

  isUrgent(d: Deadline): boolean {
    if (d.completed) return false;
    const diff = new Date(d.date).getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 60 * 60 * 1000;
  }

  isOverdue(d: Deadline): boolean {
    return !d.completed && new Date(d.date) < new Date();
  }

  async toggleComplete(id: string): Promise<void> {
    await this.deadlineService.toggleCompleted(id);
  }

  async addDeadline(): Promise<void> {
    if (!this.newTitle || !this.newDate) return;
    await this.deadlineService.addDeadline({
      title: this.newTitle,
      date: this.newDate,
      type: this.newType,
      description: this.newDesc,
      completed: false,
    });
    this.newTitle = '';
    this.newDate = '';
    this.newDesc = '';
    this.showForm.set(false);
  }
}
