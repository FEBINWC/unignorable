import { Component, inject, signal, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Database, ref, set, update, get } from '@angular/fire/database';
import { generateFullSchedule } from './seed-schedule';
import { SEED_DEADLINES } from './seed-deadlines';
import { Deadline } from '../core/models/deadline.model';

@Component({
  selector: 'app-seed-runner',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto mt-10 max-w-xl">
      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <h2 class="text-xl font-bold">Database Seed Tool</h2>
        <p class="mb-4 text-sm text-gray-500">Populate Firebase with the 44-week study schedule</p>

        @if (status() === 'idle') {
          <p class="text-sm text-gray-600">This will generate and upload the entire 44-week study plan to Firebase.</p>
          <p class="mt-1 text-sm font-medium text-gray-700">Warning: This will overwrite any existing schedule data.</p>
        }
        @if (status() === 'checking') {
          <p class="text-sm text-gray-600">Checking database...</p>
          <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div class="h-full animate-pulse rounded-full bg-primary" style="width: 50%"></div>
          </div>
        }
        @if (status() === 'exists') {
          <p class="text-sm font-medium text-warning-dark">Database already has schedule data. Seeding again will overwrite it.</p>
        }
        @if (status() === 'seeding') {
          <p class="mb-2 text-sm text-gray-600">{{ seedProgress() }}</p>
          <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div class="h-full rounded-full bg-primary transition-all" [style.width.%]="seedPercent()"></div>
          </div>
        }
        @if (status() === 'done') {
          <div class="flex items-center gap-2 text-success">
            <i class="mdi mdi-check-circle text-xl"></i>
            <span class="font-medium">Seeding complete! {{ taskCount() }} tasks across {{ dayCount() }} days created.</span>
          </div>
        }
        @if (status() === 'error') {
          <div class="flex items-center gap-2 text-error">
            <i class="mdi mdi-alert-circle text-xl"></i>
            <span class="font-medium">Error: {{ errorMsg() }}</span>
          </div>
        }

        <div class="mt-4 flex gap-3">
          @if (status() === 'idle' || status() === 'exists') {
            <button class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50" (click)="checkDb()">
              <i class="mdi mdi-magnify"></i> Check Database
            </button>
            <button class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark" (click)="seed()">
              <i class="mdi mdi-cloud-upload"></i> Seed Database
            </button>
          }
          @if (status() === 'done') {
            <a routerLink="/dashboard" class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
              <i class="mdi mdi-view-dashboard"></i> Go to Dashboard
            </a>
          }
          @if (status() === 'error') {
            <button class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark" (click)="status.set('idle')">
              <i class="mdi mdi-refresh"></i> Try Again
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class SeedRunnerComponent {
  private db = inject(Database);
  private zone = inject(NgZone);

  status = signal<'idle' | 'checking' | 'exists' | 'seeding' | 'done' | 'error'>('idle');
  taskCount = signal(0);
  dayCount = signal(0);
  errorMsg = signal('');
  seedProgress = signal('Preparing...');
  seedPercent = signal(0);

  async checkDb(): Promise<void> {
    this.status.set('checking');
    try {
      const snapshot = await get(ref(this.db, 'schedule'));
      this.status.set(snapshot.exists() ? 'exists' : 'idle');
    } catch (e: any) {
      this.status.set('error');
      this.errorMsg.set(e.message || 'Failed to check database');
    }
  }

  async seed(): Promise<void> {
    console.log('[Seed] Starting...');
    this.status.set('seeding');
    this.seedProgress.set('Generating 44-week schedule...');
    this.seedPercent.set(5);
    try {
      const schedule = generateFullSchedule();
      const days = Object.keys(schedule).length;
      let tasks = 0;
      Object.values(schedule).forEach((day) => { tasks += Object.keys(day.tasks).length; });
      console.log(`[Seed] Generated ${days} days, ${tasks} tasks`);
      this.seedProgress.set(`Uploading ${days} days to Firebase...`);
      this.seedPercent.set(10);

      const dates = Object.keys(schedule).sort();
      const chunkSize = 14;
      const totalChunks = Math.ceil(dates.length / chunkSize);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize, end = Math.min(start + chunkSize, dates.length);
        const chunk: Record<string, any> = {};
        dates.slice(start, end).forEach((d) => { chunk[d] = schedule[d]; });
        this.zone.run(() => {
          this.seedProgress.set(`Uploading days ${start + 1}-${end} of ${dates.length}...`);
          this.seedPercent.set(10 + Math.round((i / totalChunks) * 80));
        });
        console.log(`[Seed] Chunk ${i + 1}/${totalChunks}...`);
        await update(ref(this.db, 'schedule'), chunk);
      }

      console.log('[Seed] Uploading deadlines...');
      this.zone.run(() => { this.seedProgress.set('Uploading deadlines...'); this.seedPercent.set(95); });
      const deadlinesData: Record<string, Omit<Deadline, 'id'>> = {};
      SEED_DEADLINES.forEach((d, i) => { deadlinesData[`deadline_${i}`] = d; });
      await set(ref(this.db, 'deadlines'), deadlinesData);

      console.log('[Seed] Complete!');
      this.zone.run(() => { this.dayCount.set(days); this.taskCount.set(tasks); this.seedPercent.set(100); this.status.set('done'); });
    } catch (e: any) {
      console.error('[Seed] Error:', e);
      this.zone.run(() => { this.status.set('error'); this.errorMsg.set(e.message || 'Failed to seed database'); });
    }
  }
}
