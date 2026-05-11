import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  Database,
  onValue,
  push,
  ref,
  set,
  update,
  Unsubscribe,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { Deadline } from '../models/deadline.model';

@Injectable({ providedIn: 'root' })
export class DeadlineService implements OnDestroy {
  private readonly DEADLINES_PATH = 'deadlines';
  private deadlinesSubject = new BehaviorSubject<Deadline[]>([]);
  private unsub: Unsubscribe | null = null;

  deadlines$ = this.deadlinesSubject.asObservable();

  constructor(private db: Database, private zone: NgZone) {
    this.listenToDeadlines();
  }

  private listenToDeadlines(): void {
    const deadlinesRef = ref(this.db, this.DEADLINES_PATH);
    this.unsub = onValue(deadlinesRef, (snapshot) => {
      this.zone.run(() => {
        const data = snapshot.val();
        const deadlines: Deadline[] = [];
        if (data) {
          Object.keys(data).forEach((key) => {
            deadlines.push({ ...data[key], id: key });
          });
        }
        deadlines.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.deadlinesSubject.next(deadlines);
      });
    });
  }

  async addDeadline(deadline: Omit<Deadline, 'id'>): Promise<void> {
    const deadlinesRef = ref(this.db, this.DEADLINES_PATH);
    await push(deadlinesRef, deadline);
  }

  async toggleCompleted(id: string): Promise<void> {
    const current = this.deadlinesSubject
      .getValue()
      .find((d) => d.id === id);
    if (current) {
      const deadlineRef = ref(this.db, `${this.DEADLINES_PATH}/${id}`);
      await update(deadlineRef, { completed: !current.completed });
    }
  }

  async seedDeadlines(deadlines: Omit<Deadline, 'id'>[]): Promise<void> {
    const deadlinesRef = ref(this.db, this.DEADLINES_PATH);
    const data: { [key: string]: Omit<Deadline, 'id'> } = {};
    deadlines.forEach((d, i) => {
      data[`deadline_${i}`] = d;
    });
    await set(deadlinesRef, data);
  }

  ngOnDestroy(): void {
    if (this.unsub) this.unsub();
  }
}
