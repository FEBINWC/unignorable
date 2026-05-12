import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Database, get, ref, set, update, remove } from '@angular/fire/database';
import { DayOrder, Task, Progress } from '../../core/models/task.model';
import { ScheduleService } from '../../core/services/schedule.service';

@Component({
  selector: 'app-manage-day-orders',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-2 text-2xl font-bold">Manage Day Orders</h1>
      <p class="mb-6 text-sm text-gray-500">Edit, reorder, add, or remove day orders from the curriculum. Changes take effect immediately.</p>

      <!-- Progress pointer -->
      @if (progress()) {
        <div class="mb-6 flex items-center gap-4 rounded-lg bg-primary/10 p-4">
          <div>
            <span class="text-sm text-gray-400">Current pointer:</span>
            <span class="ml-2 text-lg font-bold text-primary">Day Order #{{ progress()!.currentDayOrder }}</span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <label class="text-sm text-gray-400">Jump to:</label>
            <input type="number" [(ngModel)]="jumpTo" min="1" [max]="dayOrders().length"
              class="w-20 rounded border border-gray-600 px-2 py-1 text-sm focus:border-primary focus:outline-none" />
            <button class="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-dark" (click)="jumpToOrder()">Go</button>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-400">Phase:</label>
          <select [(ngModel)]="filterPhase" (ngModelChange)="applyFilter()" class="rounded border border-gray-600 px-2 py-1 text-sm">
            <option [ngValue]="0">All</option>
            <option [ngValue]="1">Phase 1 (Open Book)</option>
            <option [ngValue]="2">Phase 2 (Closed Book)</option>
            <option [ngValue]="3">Phase 3 (TMA + Papers)</option>
            <option [ngValue]="4">Phase 4 (Sprint)</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-400">Search:</label>
          <input type="text" [(ngModel)]="searchText" (ngModelChange)="applyFilter()" placeholder="Subject or chapter..."
            class="rounded border border-gray-600 px-2 py-1 text-sm focus:border-primary focus:outline-none" />
        </div>
        <span class="ml-auto text-sm text-gray-500">{{ filtered().length }} of {{ dayOrders().length }} day orders</span>
      </div>

      <!-- Add new day order -->
      <div class="mb-4">
        <button class="flex items-center gap-2 rounded-lg border border-dashed border-gray-600 px-4 py-2 text-sm text-gray-400 hover:border-primary hover:text-primary"
          (click)="showAddForm.set(!showAddForm())">
          <i class="mdi mdi-plus"></i> Add Day Order
        </button>
      </div>

      @if (showAddForm()) {
        <div class="mb-6 rounded-lg border bg-surface p-4 shadow-none">
          <h3 class="mb-3 font-semibold">Add New Day Order</h3>
          <div class="flex flex-col gap-3">
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Insert at position</label>
                <input type="number" [(ngModel)]="newPosition" min="1" [max]="dayOrders().length + 1"
                  class="w-full rounded border border-gray-600 px-2 py-1 text-sm" />
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Phase</label>
                <select [(ngModel)]="newPhase" class="w-full rounded border border-gray-600 px-2 py-1 text-sm">
                  <option [ngValue]="1">Phase 1</option><option [ngValue]="2">Phase 2</option>
                  <option [ngValue]="3">Phase 3</option><option [ngValue]="4">Phase 4</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Type</label>
                <select [(ngModel)]="newDayType" class="w-full rounded border border-gray-600 px-2 py-1 text-sm">
                  <option value="full">Full</option><option value="light">Light</option><option value="cumulative">Cumulative</option>
                </select>
              </div>
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Exam Subject</label>
              <input type="text" [(ngModel)]="newSubject" placeholder="e.g., Accountancy" class="w-full rounded border border-gray-600 px-2 py-1 text-sm" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Chapters</label>
              <input type="text" [(ngModel)]="newChapters" placeholder="e.g., Ch 1, Ch 2, Ch 3" class="w-full rounded border border-gray-600 px-2 py-1 text-sm" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">Exam Type</label>
              <select [(ngModel)]="newExamType" class="w-full rounded border border-gray-600 px-2 py-1 text-sm">
                <option value="open-book">Open Book</option><option value="closed-book">Closed Book</option>
                <option value="cumulative">Cumulative</option><option value="mock">Mock</option>
              </select>
            </div>
            <div class="flex justify-end gap-2">
              <button class="rounded px-3 py-1 text-sm text-gray-400 hover:bg-gray-800" (click)="showAddForm.set(false)">Cancel</button>
              <button class="rounded bg-primary px-4 py-1 text-sm text-white hover:bg-primary-dark" (click)="addDayOrder()">Add</button>
            </div>
          </div>
        </div>
      }

      <!-- Day orders list -->
      <div class="space-y-2">
        @for (do_ of filtered(); track do_.dayOrder) {
          <div class="rounded-lg border bg-surface p-3 shadow-none"
            [class.ring-2]="do_.dayOrder === progress()?.currentDayOrder"
            [class.ring-primary]="do_.dayOrder === progress()?.currentDayOrder"
            [class.bg-primary/10]="do_.dayOrder === progress()?.currentDayOrder">

            @if (editingOrder() === do_.dayOrder) {
              <!-- Edit mode -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-gray-400">#{{ do_.dayOrder }}</span>
                  <select [(ngModel)]="editPhase" class="rounded border border-gray-600 px-2 py-1 text-xs">
                    <option [ngValue]="1">Phase 1</option><option [ngValue]="2">Phase 2</option>
                    <option [ngValue]="3">Phase 3</option><option [ngValue]="4">Phase 4</option>
                  </select>
                  <select [(ngModel)]="editDayType" class="rounded border border-gray-600 px-2 py-1 text-xs">
                    <option value="full">Full</option><option value="light">Light</option><option value="cumulative">Cumulative</option>
                  </select>
                </div>
                @for (task of editTasks; track $index) {
                  <div class="flex gap-2 rounded p-2"
                    [class]="task.type === 'exam' ? 'bg-primary/10' : task.type === 'sales' ? 'bg-success/10' : 'bg-coding/10'">
                    <span class="flex w-16 items-center justify-center rounded-full text-[10px] font-bold uppercase"
                      [class]="task.type === 'exam' ? 'bg-blue-200 text-blue-800' : task.type === 'sales' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'">
                      {{ task.type }}
                    </span>
                    <input type="text" [(ngModel)]="task.title" placeholder="Title" class="flex-1 rounded border border-gray-600 bg-transparent px-2 py-1 text-xs" />
                    <input type="text" [(ngModel)]="task.description" placeholder="Description" class="flex-[2] rounded border border-gray-600 bg-transparent px-2 py-1 text-xs" />
                    @if (task.type === 'exam') {
                      <input type="text" [(ngModel)]="task.subject" placeholder="Subject" class="w-28 rounded border border-gray-600 bg-transparent px-2 py-1 text-xs" />
                      <input type="text" [(ngModel)]="task.chapters" placeholder="Chapters" class="w-32 rounded border border-gray-600 bg-transparent px-2 py-1 text-xs" />
                      <select [(ngModel)]="task.examType" class="rounded border border-gray-600 bg-transparent px-2 py-1 text-xs">
                        <option value="open-book">Open</option><option value="closed-book">Closed</option>
                        <option value="cumulative">Cumulative</option><option value="mock">Mock</option>
                      </select>
                    }
                  </div>
                }
                <div class="flex justify-end gap-2">
                  <button class="rounded px-3 py-1 text-xs text-gray-500 hover:bg-gray-800" (click)="editingOrder.set(0)">Cancel</button>
                  <button class="rounded bg-primary px-3 py-1 text-xs text-white hover:bg-primary-dark" (click)="saveEdit(do_)">Save</button>
                </div>
              </div>
            } @else {
              <!-- View mode -->
              <div class="flex items-center gap-3">
                <span class="w-10 text-right text-sm font-bold text-gray-400">#{{ do_.dayOrder }}</span>
                <span class="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">P{{ do_.phase }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs"
                  [class]="do_.dayType === 'cumulative' ? 'bg-coding/20 text-coding' : do_.dayType === 'light' ? 'bg-yellow-100 text-yellow-700' : 'bg-primary/20 text-primary'">
                  {{ do_.dayType }}
                </span>
                <div class="flex flex-1 flex-wrap gap-1.5">
                  @for (task of getTasksArray(do_); track $index) {
                    <span class="rounded-md px-2 py-0.5 text-xs"
                      [class]="task.type === 'exam' ? 'bg-primary/10 text-primary' : task.type === 'sales' ? 'bg-success/10 text-success' : 'bg-coding/10 text-coding'">
                      @if (task.type === 'exam') {
                        <strong>{{ task.subject }}</strong> · {{ task.chapters }}
                      } @else {
                        {{ task.title }}
                      }
                    </span>
                  }
                </div>
                <div class="flex gap-1">
                  <button class="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-primary" (click)="startEdit(do_)" title="Edit">
                    <i class="mdi mdi-pencil"></i>
                  </button>
                  @if (do_.dayOrder > (progress()?.currentDayOrder || 1)) {
                    <button class="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-error" (click)="deleteDayOrder(do_.dayOrder)" title="Delete">
                      <i class="mdi mdi-delete"></i>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="py-10 text-center text-gray-400">Loading day orders...</div>
      }
    </div>
  `,
})
export class ManageDayOrdersComponent implements OnInit {
  private db = inject(Database);
  private scheduleService = inject(ScheduleService);

  dayOrders = signal<DayOrder[]>([]);
  filtered = signal<DayOrder[]>([]);
  progress = signal<Progress | null>(null);
  loading = signal(true);
  editingOrder = signal(0);
  showAddForm = signal(false);

  filterPhase = 0;
  searchText = '';
  jumpTo = 1;

  // Edit fields
  editPhase = 1;
  editDayType = 'full';
  editTasks: Task[] = [];

  // Add fields
  newPosition = 1;
  newPhase = 1;
  newDayType = 'full';
  newSubject = '';
  newChapters = '';
  newExamType = 'open-book';

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    const [doSnap, progSnap] = await Promise.all([
      get(ref(this.db, 'dayOrders')),
      get(ref(this.db, 'progress')),
    ]);

    const data = doSnap.val();
    if (data) {
      const orders: DayOrder[] = Object.keys(data)
        .map((k) => ({ ...data[k], dayOrder: parseInt(k) }))
        .sort((a, b) => a.dayOrder - b.dayOrder);
      this.dayOrders.set(orders);
      this.newPosition = orders.length + 1;
    }

    this.progress.set(progSnap.val());
    this.jumpTo = progSnap.val()?.currentDayOrder || 1;
    this.applyFilter();
    this.loading.set(false);
  }

  applyFilter(): void {
    let result = this.dayOrders();
    if (this.filterPhase > 0) {
      result = result.filter((d) => d.phase === this.filterPhase);
    }
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      result = result.filter((d) => {
        const tasks = this.getTasksArray(d);
        return tasks.some((t) =>
          (t.subject?.toLowerCase().includes(search)) ||
          (t.chapters?.toLowerCase().includes(search)) ||
          (t.title?.toLowerCase().includes(search))
        );
      });
    }
    this.filtered.set(result);
  }

  getTasksArray(dayOrder: DayOrder): Task[] {
    if (!dayOrder.tasks) return [];
    return Object.keys(dayOrder.tasks).map((k) => ({ ...dayOrder.tasks[k], id: k }));
  }

  startEdit(dayOrder: DayOrder): void {
    this.editingOrder.set(dayOrder.dayOrder);
    this.editPhase = dayOrder.phase;
    this.editDayType = dayOrder.dayType;
    this.editTasks = this.getTasksArray(dayOrder);
  }

  async saveEdit(dayOrder: DayOrder): Promise<void> {
    const tasks = this.editTasks;
    const taskMap: Record<string, any> = {};
    tasks.forEach((t) => {
      const { id, ...rest } = t;
      taskMap[id!] = rest;
    });

    await update(ref(this.db, `dayOrders/${dayOrder.dayOrder}`), {
      phase: this.editPhase,
      dayType: this.editDayType,
      tasks: taskMap,
    });

    this.editingOrder.set(0);
    await this.loadData();
  }

  async deleteDayOrder(num: number): Promise<void> {
    if (!confirm(`Delete Day Order #${num}? This cannot be undone.`)) return;

    await remove(ref(this.db, `dayOrders/${num}`));

    // Renumber subsequent day orders
    const remaining = this.dayOrders().filter((d) => d.dayOrder !== num);
    const toRenumber = remaining.filter((d) => d.dayOrder > num);

    for (const d of toRenumber) {
      const oldRef = ref(this.db, `dayOrders/${d.dayOrder}`);
      const snap = await get(oldRef);
      const data = snap.val();
      if (data) {
        data.dayOrder = d.dayOrder - 1;
        await set(ref(this.db, `dayOrders/${d.dayOrder - 1}`), data);
        await remove(oldRef);
      }
    }

    // Update total
    const p = this.progress();
    if (p) {
      await update(ref(this.db, 'progress'), { totalDayOrders: p.totalDayOrders - 1 });
    }

    await this.loadData();
  }

  async addDayOrder(): Promise<void> {
    if (!this.newSubject) return;

    const total = this.dayOrders().length;
    const pos = Math.min(Math.max(this.newPosition, 1), total + 1);

    // Shift existing orders at and after position
    if (pos <= total) {
      for (let i = total; i >= pos; i--) {
        const snap = await get(ref(this.db, `dayOrders/${i}`));
        const data = snap.val();
        if (data) {
          data.dayOrder = i + 1;
          await set(ref(this.db, `dayOrders/${i + 1}`), data);
        }
      }
    }

    // Insert new day order
    const newOrder: any = {
      dayOrder: pos,
      dayType: this.newDayType,
      phase: this.newPhase,
      tasks: {
        task_0: {
          type: 'exam',
          title: `${this.newSubject} Exam`,
          description: `${this.newExamType === 'open-book' ? 'Open' : 'Closed'} book exam.`,
          subject: this.newSubject,
          chapters: this.newChapters,
          examType: this.newExamType,
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
        },
        task_1: {
          type: 'sales',
          title: 'Sales Activity',
          description: 'Complete assigned sales task.',
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
        },
        task_2: {
          type: 'coding',
          title: 'patternsOfLife: Development',
          description: 'Work on current milestone.',
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
        },
      },
    };

    await set(ref(this.db, `dayOrders/${pos}`), newOrder);

    // Update total + adjust pointer if needed
    const p = this.progress();
    if (p) {
      const updates: any = { totalDayOrders: total + 1 };
      if (pos <= p.currentDayOrder) {
        updates.currentDayOrder = p.currentDayOrder + 1;
      }
      await update(ref(this.db, 'progress'), updates);
    }

    this.showAddForm.set(false);
    this.newSubject = '';
    this.newChapters = '';
    await this.loadData();
  }

  async jumpToOrder(): Promise<void> {
    if (this.jumpTo < 1 || this.jumpTo > this.dayOrders().length) return;
    await update(ref(this.db, 'progress'), { currentDayOrder: this.jumpTo });
    this.progress.set({ ...this.progress()!, currentDayOrder: this.jumpTo });
  }
}
