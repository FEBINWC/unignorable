import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  get,
  onValue,
  ref,
  set,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { Streak } from '../models/streak.model';

@Injectable({ providedIn: 'root' })
export class StreakService implements OnDestroy {
  private streakSubject = new BehaviorSubject<Streak>({ current: 0, longest: 0, lastCompletedDate: '' });
  private unsub: Unsubscribe | null = null;
  streak$ = this.streakSubject.asObservable();

  constructor(private db: Database, private zone: NgZone) {
    this.listenToStreak();
  }

  private listenToStreak(): void {
    const streakRef = ref(this.db, 'streaks');
    this.unsub = onValue(streakRef, (snapshot) => {
      this.zone.run(() => {
        if (snapshot.val()) this.streakSubject.next(snapshot.val());
      });
    });
  }

  async recalculateStreak(): Promise<void> {
    const completionsSnap = await get(ref(this.db, 'completions'));
    const data = completionsSnap.val();
    if (!data) return;

    // Get all completion dates sorted descending
    const dates: string[] = [];
    Object.values(data).forEach((c: any) => {
      if (c.completedDate) dates.push(c.completedDate);
    });
    dates.sort().reverse();

    // Count consecutive days from most recent
    let current = 0;
    let lastCompleted = dates[0] || '';

    if (dates.length > 0) {
      current = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1] + 'T00:00:00');
        const curr = new Date(dates[i] + 'T00:00:00');
        const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
        // Allow gap of 1 (consecutive) or 2 (skipped Sunday)
        if (diffDays <= 2) {
          current++;
        } else {
          break;
        }
      }
    }

    const existing = this.streakSubject.getValue();
    await set(ref(this.db, 'streaks'), {
      current,
      longest: Math.max(existing.longest, current),
      lastCompletedDate: lastCompleted,
    });
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }
}
