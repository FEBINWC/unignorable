import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ScheduleService } from '../core/services/schedule.service';
import { DeadlineService } from '../core/services/deadline.service';
import { generateFullSchedule } from './seed-schedule';
import { SEED_DEADLINES } from './seed-deadlines';

@Component({
  selector: 'app-seed-runner',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="seed-page">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Database Seed Tool</mat-card-title>
          <mat-card-subtitle>Populate Firebase with the 44-week study schedule</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (status() === 'idle') {
            <p>This will generate and upload the entire 44-week study plan to Firebase.</p>
            <p><strong>Warning:</strong> This will overwrite any existing schedule data.</p>
          }
          @if (status() === 'checking') {
            <p>Checking database...</p>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
          @if (status() === 'exists') {
            <p class="warning">Database already has schedule data. Seeding again will overwrite it.</p>
          }
          @if (status() === 'seeding') {
            <p>Generating schedule and uploading to Firebase...</p>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
          @if (status() === 'done') {
            <p class="success">
              <mat-icon>check_circle</mat-icon>
              Seeding complete! {{ taskCount() }} tasks across {{ dayCount() }} days created.
            </p>
          }
          @if (status() === 'error') {
            <p class="error">
              <mat-icon>error</mat-icon>
              Error: {{ errorMsg() }}
            </p>
          }
        </mat-card-content>
        <mat-card-actions>
          @if (status() === 'idle' || status() === 'exists') {
            <button mat-raised-button (click)="checkDb()">
              <mat-icon>search</mat-icon>
              Check Database
            </button>
            <button mat-raised-button color="primary" (click)="seed()">
              <mat-icon>cloud_upload</mat-icon>
              Seed Database
            </button>
          }
          @if (status() === 'done') {
            <button mat-raised-button color="primary" routerLink="/dashboard">
              <mat-icon>dashboard</mat-icon>
              Go to Dashboard
            </button>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .seed-page {
        max-width: 600px;
        margin: 40px auto;
      }
      .warning { color: #e65100; }
      .success { color: #2e7d32; display: flex; align-items: center; gap: 8px; }
      .error { color: #c62828; display: flex; align-items: center; gap: 8px; }
      mat-card-actions { display: flex; gap: 8px; padding: 16px; }
    `,
  ],
})
export class SeedRunnerComponent {
  private scheduleService = inject(ScheduleService);
  private deadlineService = inject(DeadlineService);

  status = signal<'idle' | 'checking' | 'exists' | 'seeding' | 'done' | 'error'>('idle');
  taskCount = signal(0);
  dayCount = signal(0);
  errorMsg = signal('');

  async checkDb(): Promise<void> {
    this.status.set('checking');
    try {
      const exists = await this.scheduleService.isScheduleSeeded();
      this.status.set(exists ? 'exists' : 'idle');
    } catch (e: any) {
      this.status.set('error');
      this.errorMsg.set(e.message || 'Failed to check database');
    }
  }

  async seed(): Promise<void> {
    this.status.set('seeding');
    try {
      // Generate schedule
      const schedule = generateFullSchedule();
      const days = Object.keys(schedule).length;
      let tasks = 0;
      Object.values(schedule).forEach((day) => {
        tasks += Object.keys(day.tasks).length;
      });

      // Upload schedule
      await this.scheduleService.seedSchedule(schedule);

      // Upload deadlines
      await this.deadlineService.seedDeadlines(SEED_DEADLINES);

      this.dayCount.set(days);
      this.taskCount.set(tasks);
      this.status.set('done');
    } catch (e: any) {
      this.status.set('error');
      this.errorMsg.set(e.message || 'Failed to seed database');
    }
  }
}
