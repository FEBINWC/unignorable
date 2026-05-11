import { Component, inject, OnInit, signal } from '@angular/core';
import { Database, get, ref, update } from '@angular/fire/database';
import { ViewModeService } from '../../core/services/view-mode.service';

interface Book {
  id: number;
  title: string;
  author: string;
  pages: string;
  month: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  style: string;
  teaches: string;
  why: string;
  status: 'not-started' | 'reading' | 'completed';
  notes: string;
}

const BOOKS: Book[] = [
  {
    id: 1, title: 'The Greatest Salesman in the World', author: 'Og Mandino',
    pages: '110', month: 'Month 1', difficulty: 'easy', style: 'Ancient fable / short novel',
    teaches: 'Mindset, persistence, self-belief, habits of success',
    why: 'Pure story about a camel boy who becomes the greatest salesman. Only 110 pages. Simple, almost poetic English. The perfect first sales book.',
    status: 'not-started', notes: '',
  },
  {
    id: 2, title: 'The Go-Giver', author: 'Bob Burg & John David Mann',
    pages: '130', month: 'Month 2', difficulty: 'easy', style: 'Business parable',
    teaches: 'Five Laws of Success — giving value is the foundation of selling',
    why: 'Young protagonist struggling with targets meets a mentor. Entirely a story with dialogue. Relatable for a teenager.',
    status: 'not-started', notes: '',
  },
  {
    id: 3, title: 'How to Win Friends and Influence People', author: 'Dale Carnegie',
    pages: '288', month: 'Month 3-4', difficulty: 'easy', style: 'Real-life stories and anecdotes',
    teaches: 'Building rapport, listening, making people feel important, persuading without pressure',
    why: 'THE foundation of all people skills. Every principle taught through stories about real people. Warm, conversational tone. Available in Hindi too.',
    status: 'not-started', notes: '',
  },
  {
    id: 4, title: 'Rich Dad Poor Dad (Teen Edition)', author: 'Robert Kiyosaki',
    pages: '176', month: 'Month 5', difficulty: 'easy', style: 'Personal memoir / story',
    teaches: 'Business mindset, why sales skills = life skills, understanding money',
    why: 'His own childhood story. Teen edition written for young readers. Builds the WHY of learning sales. Massively popular in India.',
    status: 'not-started', notes: '',
  },
  {
    id: 5, title: 'The Little Red Book of Selling', author: 'Jeffrey Gitomer',
    pages: '220', month: 'Month 6', difficulty: 'easy', style: 'Short chapters, cartoons, humor',
    teaches: '12.5 principles — from why people buy to networking and personal branding',
    why: 'Feels like a magazine, not a textbook. Bite-sized chunks. Easiest "technical" sales book ever written.',
    status: 'not-started', notes: '',
  },
  {
    id: 6, title: 'Sell or Be Sold', author: 'Grant Cardone',
    pages: '256', month: 'Month 7', difficulty: 'medium', style: 'High-energy, direct, conversational',
    teaches: 'Sales mindset, handling rejection, commitment and conviction',
    why: 'Like a motivational coach talking to you. Short sentences, simple words, no jargon. Action-oriented.',
    status: 'not-started', notes: '',
  },
  {
    id: 7, title: 'To Sell Is Human', author: 'Daniel Pink',
    pages: '272', month: 'Month 8-9', difficulty: 'medium', style: 'Stories + social science research',
    teaches: 'New ABCs of selling — Attunement, Buoyancy, Clarity. Modern consultative selling.',
    why: 'Most relevant for software sales. Clear, modern writing. Teaches selling without being pushy.',
    status: 'not-started', notes: '',
  },
  {
    id: 8, title: 'Secrets of Closing the Sale', author: 'Zig Ziglar',
    pages: '416', month: 'Month 10-12', difficulty: 'medium', style: 'Stories, jokes, anecdotes',
    teaches: '100+ closing techniques, handling objections, building trust',
    why: 'Master storyteller. Packed with real-life anecdotes and humor. Best read slowly — one chapter per week.',
    status: 'not-started', notes: '',
  },
  {
    id: 9, title: 'Sell with a Story', author: 'Paul Smith',
    pages: '288', month: 'Year 2', difficulty: 'medium', style: 'Case studies + frameworks',
    teaches: 'Using storytelling at every stage of sales — opening to closing',
    why: 'Teaches the critical skill of storytelling in sales. Real cases from Microsoft, Costco, HP.',
    status: 'not-started', notes: '',
  },
  {
    id: 10, title: 'Influence: The Psychology of Persuasion', author: 'Robert Cialdini',
    pages: '336', month: 'Year 2', difficulty: 'advanced', style: 'Stories + psychology research',
    teaches: '6 principles of persuasion — Reciprocity, Social Proof, Authority, Scarcity, Liking, Commitment',
    why: 'Understanding WHY people say yes. The scientific foundation behind all sales. Save for when basics are solid.',
    status: 'not-started', notes: '',
  },
];

const DIFFICULTY_STYLES = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const STATUS_STYLES = {
  'not-started': 'bg-gray-100 text-gray-600',
  reading: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

@Component({
  selector: 'app-reading-list',
  standalone: true,
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-1 text-2xl font-bold">Sales Reading List</h1>
      <p class="mb-6 text-sm text-gray-500">Story-driven books to build sales skills. Read 1 chapter per week alongside studies.</p>

      <!-- Progress summary -->
      <div class="mb-6 flex gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-primary">{{ completedCount() }}</div>
          <div class="text-xs text-gray-500">Completed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ readingCount() }}</div>
          <div class="text-xs text-gray-500">Reading</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-400">{{ notStartedCount() }}</div>
          <div class="text-xs text-gray-500">To Read</div>
        </div>
        <div class="ml-auto flex items-center">
          <div class="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
            <div class="h-full rounded-full bg-green-500 transition-all" [style.width.%]="(completedCount() / books().length) * 100"></div>
          </div>
          <span class="ml-2 text-xs text-gray-500">{{ completedCount() }}/{{ books().length }}</span>
        </div>
      </div>

      @for (book of books(); track book.id) {
        <div class="mb-4 rounded-lg border bg-white shadow-sm overflow-hidden"
          [class.border-l-4]="book.status === 'reading'"
          [class.border-l-blue-500]="book.status === 'reading'"
          [class.opacity-60]="book.status === 'completed'">

          <!-- Header -->
          <div class="flex items-start gap-3 p-4">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-400">
              {{ book.id }}
            </div>
            <div class="flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ book.title }}</h3>
                  <p class="text-sm text-gray-500">{{ book.author }} · {{ book.pages }} pages</p>
                </div>
                <div class="flex flex-shrink-0 gap-1.5">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-medium" [class]="difficultyStyles[book.difficulty]">
                    {{ book.difficulty }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-medium" [class]="statusStyles[book.status]">
                    {{ book.status === 'not-started' ? 'not started' : book.status }}
                  </span>
                </div>
              </div>

              <div class="mt-2 text-sm text-gray-600">
                <span class="font-medium text-gray-700">Style:</span> {{ book.style }}
              </div>
              <div class="mt-1 text-sm text-gray-600">
                <span class="font-medium text-gray-700">Teaches:</span> {{ book.teaches }}
              </div>

              @if (expandedId() === book.id) {
                <div class="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <p class="font-medium text-gray-700">Why this book:</p>
                  <p class="mt-1">{{ book.why }}</p>
                  <p class="mt-2 text-xs text-gray-400">Recommended for: {{ book.month }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 border-t bg-gray-50 px-4 py-2">
            <button class="text-xs text-gray-500 hover:text-primary" (click)="toggleExpand(book.id)">
              {{ expandedId() === book.id ? 'Less' : 'More' }}
            </button>

            @if (viewMode.viewMode() === 'parent') {
              <div class="ml-auto flex gap-1.5">
                @if (book.status !== 'reading') {
                  <button class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                    (click)="setStatus(book.id, 'reading')">
                    <i class="mdi mdi-book-open-page-variant"></i> Mark Reading
                  </button>
                }
                @if (book.status !== 'completed') {
                  <button class="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                    (click)="setStatus(book.id, 'completed')">
                    <i class="mdi mdi-check"></i> Mark Done
                  </button>
                }
                @if (book.status !== 'not-started') {
                  <button class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
                    (click)="setStatus(book.id, 'not-started')">
                    Reset
                  </button>
                }
              </div>
            } @else {
              @if (book.status === 'reading') {
                <span class="ml-auto flex items-center gap-1 text-xs font-medium text-blue-600">
                  <i class="mdi mdi-book-open-page-variant"></i> Currently reading
                </span>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ReadingListComponent implements OnInit {
  viewMode = inject(ViewModeService);
  private db = inject(Database);

  books = signal<Book[]>([...BOOKS]);
  expandedId = signal(0);

  difficultyStyles = DIFFICULTY_STYLES;
  statusStyles = STATUS_STYLES;

  completedCount = () => this.books().filter(b => b.status === 'completed').length;
  readingCount = () => this.books().filter(b => b.status === 'reading').length;
  notStartedCount = () => this.books().filter(b => b.status === 'not-started').length;

  async ngOnInit(): Promise<void> {
    // Load saved statuses from Firebase
    const snap = await get(ref(this.db, 'readingList'));
    const data = snap.val();
    if (data) {
      const updated = this.books().map(b => {
        if (data[b.id]) {
          return { ...b, status: data[b.id].status || b.status, notes: data[b.id].notes || '' };
        }
        return b;
      });
      this.books.set(updated);
    }
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? 0 : id);
  }

  async setStatus(id: number, status: 'not-started' | 'reading' | 'completed'): Promise<void> {
    const updated = this.books().map(b => b.id === id ? { ...b, status } : b);
    this.books.set(updated);
    await update(ref(this.db, `readingList/${id}`), { status });
  }
}
