import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaceInfo, PaceStatus, Progress, Vacation } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class PaceService implements OnDestroy {
  private vacationsSubject = new BehaviorSubject<Vacation[]>([]);
  vacations$ = this.vacationsSubject.asObservable();
  private unsub: Unsubscribe | null = null;

  constructor(private db: Database, private zone: NgZone) {
    this.listenToVacations();
  }

  private listenToVacations(): void {
    const vacRef = ref(this.db, 'vacations');
    this.unsub = onValue(vacRef, (snapshot) => {
      this.zone.run(() => {
        const data = snapshot.val();
        const vacations: Vacation[] = [];
        if (data) {
          Object.keys(data).forEach((key) => {
            vacations.push({ ...data[key], id: key });
          });
        }
        this.vacationsSubject.next(vacations);
      });
    });
  }

  async addVacation(start: string, end: string, reason: string): Promise<void> {
    await push(ref(this.db, 'vacations'), { start, end, reason });
  }

  async removeVacation(id: string): Promise<void> {
    await remove(ref(this.db, `vacations/${id}`));
  }

  async getPaceInfo(): Promise<PaceInfo> {
    const progressSnap = await get(ref(this.db, 'progress'));
    const progress: Progress = progressSnap.val() || {
      currentDayOrder: 1,
      targetEndDate: '2027-03-15',
      startDate: '2026-05-12',
      totalDayOrders: 240,
    };

    const vacations = this.vacationsSubject.getValue();
    const today = new Date().toISOString().split('T')[0];

    const dayOrdersCompleted = progress.currentDayOrder - 1;
    const dayOrdersRemaining = progress.totalDayOrders - dayOrdersCompleted;

    // Count working days passed (exclude Sundays + vacation days)
    const pastVacationDays = this.countVacationDaysInRange(vacations, progress.startDate, today);
    const workingDaysPassed = this.countWorkingDays(progress.startDate, today) - pastVacationDays;

    // Count working days remaining
    const futureVacationDays = this.countVacationDaysInRange(vacations, today, progress.targetEndDate);
    const workingDaysRemaining = this.countWorkingDays(today, progress.targetEndDate) - futureVacationDays;

    const behindBy = Math.max(0, workingDaysPassed - dayOrdersCompleted);
    const requiredPace = workingDaysRemaining > 0
      ? Math.round((dayOrdersRemaining / workingDaysRemaining) * 100) / 100
      : 999;

    let status: PaceStatus;
    let suggestion: string;

    if (dayOrdersCompleted > workingDaysPassed) {
      status = 'ahead';
      suggestion = `${dayOrdersCompleted - workingDaysPassed} day orders ahead of schedule. Great work!`;
    } else if (requiredPace <= 1.0) {
      status = 'on-track';
      suggestion = 'On schedule. Keep up the pace!';
    } else if (requiredPace <= 1.3) {
      status = 'slightly-behind';
      suggestion = `${behindBy} days behind. Complete 2 day orders on upcoming Saturdays to catch up.`;
    } else if (requiredPace <= 1.5) {
      status = 'behind';
      suggestion = `${behindBy} days behind. Use Sundays and double up Saturdays to recover.`;
    } else {
      status = 'critical';
      suggestion = `${behindBy} days behind. Parent needs to reorganize — consider compressing easier subjects.`;
    }

    return {
      currentDayOrder: progress.currentDayOrder,
      totalDayOrders: progress.totalDayOrders,
      dayOrdersCompleted,
      dayOrdersRemaining,
      workingDaysPassed,
      workingDaysRemaining,
      behindBy,
      requiredPace,
      status,
      suggestion,
    };
  }

  countWorkingDays(from: string, to: string): number {
    let count = 0;
    const start = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    const d = new Date(start);
    while (d <= end) {
      if (d.getDay() !== 0) count++; // Exclude Sundays
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  private countVacationDaysInRange(vacations: Vacation[], from: string, to: string): number {
    let count = 0;
    for (const v of vacations) {
      const vStart = new Date(Math.max(new Date(v.start + 'T00:00:00').getTime(), new Date(from + 'T00:00:00').getTime()));
      const vEnd = new Date(Math.min(new Date(v.end + 'T00:00:00').getTime(), new Date(to + 'T00:00:00').getTime()));
      const d = new Date(vStart);
      while (d <= vEnd) {
        if (d.getDay() !== 0) count++; // Only count working vacation days
        d.setDate(d.getDate() + 1);
      }
    }
    return count;
  }

  isVacationDate(date: string): boolean {
    const vacations = this.vacationsSubject.getValue();
    for (const v of vacations) {
      if (date >= v.start && date <= v.end) return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }
}
