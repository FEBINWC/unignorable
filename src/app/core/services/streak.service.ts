import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  get,
  onValue,
  ref,
  set,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { Streak } from '../models/streak.model';
import { DaySummary } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class StreakService implements OnDestroy {
  private readonly STREAK_PATH = 'streaks';
  private streakSubject = new BehaviorSubject<Streak>({
    current: 0,
    longest: 0,
    lastCompletedDate: '',
  });
  private unsub: Unsubscribe | null = null;

  streak$ = this.streakSubject.asObservable();

  constructor(private db: Database, private zone: NgZone) {
    this.listenToStreak();
  }

  private listenToStreak(): void {
    const streakRef = ref(this.db, this.STREAK_PATH);
    this.unsub = onValue(streakRef, (snapshot) => {
      this.zone.run(() => {
        const data = snapshot.val();
        if (data) {
          this.streakSubject.next(data);
        }
      });
    });
  }

  async recalculateStreak(): Promise<void> {
    const scheduleRef = ref(this.db, 'schedule');
    const snapshot = await get(scheduleRef);
    const data = snapshot.val();

    if (!data) return;

    const today = new Date().toISOString().split('T')[0];
    const dates = Object.keys(data)
      .filter((d) => d <= today)
      .sort()
      .reverse();

    let current = 0;
    let lastCompleted = '';

    for (const date of dates) {
      const summary: DaySummary = data[date]?.daySummary;
      if (!summary) continue;

      // A day counts if all tasks are done (submitted or reviewed)
      if (summary.completedTasks >= summary.totalTasks && summary.totalTasks > 0) {
        current++;
        if (!lastCompleted) lastCompleted = date;
      } else {
        break;
      }
    }

    const streakRef = ref(this.db, this.STREAK_PATH);
    const existing = this.streakSubject.getValue();
    const longest = Math.max(existing.longest, current);

    await set(streakRef, {
      current,
      longest,
      lastCompletedDate: lastCompleted,
    });
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }
}
