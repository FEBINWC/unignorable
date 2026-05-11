import { Component, signal } from '@angular/core';
import { PAPERS, Paper } from './papers';

const SUBJECT_COLORS: Record<string, string> = {
  Accountancy: 'bg-error/20 text-error',
  Economics: 'bg-primary/20 text-primary',
  'Computer Science': 'bg-coding/20 text-coding',
  English: 'bg-primary/20 text-primary',
  Psychology: 'bg-success/20 text-success',
  'Business Studies': 'bg-success/20 text-success',
};

@Component({
  selector: 'app-question-bank',
  standalone: true,
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-1 text-2xl font-bold">Question Bank</h1>
      <p class="mb-6 text-sm text-gray-500">{{ papers.length }} question papers. Click to view, then print (Ctrl+P / Cmd+P).</p>

      <!-- Subject filters -->
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
          [class]="filter() === '' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-white/10'"
          (click)="filter.set('')"
        >All ({{ papers.length }})</button>
        @for (sub of subjects; track sub) {
          <button
            class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            [class]="filter() === sub ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300 hover:bg-white/10'"
            (click)="filter.set(sub)"
          >{{ sub }} ({{ countBySubject(sub) }})</button>
        }
      </div>

      <!-- Papers list -->
      @if (filtered().length === 0) {
        <div class="rounded-lg border bg-surface p-8 text-center text-gray-400">
          No papers available{{ filter() ? ' for ' + filter() : '' }} yet.
        </div>
      }

      @for (paper of filtered(); track paper.id) {
        <div class="mb-3 flex items-center gap-4 rounded-lg border bg-surface p-4 shadow-none hover:shadow-md transition-shadow">
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
            [class]="colors[paper.subject] || 'bg-gray-800 text-gray-400'">
            <i class="mdi mdi-file-document-outline text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-100">{{ paper.title }}</h3>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span class="rounded-full bg-gray-800 px-2 py-0.5 font-medium text-gray-300">{{ paper.subject }}</span>
              <span>{{ paper.chapters }}</span>
              @if (paper.dayOrders) {
                <span class="font-medium text-primary">Day Order {{ paper.dayOrders }}</span>
              }
            </div>
          </div>
          <a
            [href]="'/question-papers/' + paper.file"
            target="_blank"
            class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <i class="mdi mdi-printer"></i> Open & Print
          </a>
        </div>
      }
    </div>
  `,
})
export class QuestionBankComponent {
  papers = PAPERS;
  subjects = [...new Set(PAPERS.map((p) => p.subject))];
  filter = signal('');
  colors = SUBJECT_COLORS;

  filtered = () => {
    const f = this.filter();
    return f ? this.papers.filter((p) => p.subject === f) : this.papers;
  };

  countBySubject(sub: string): number {
    return this.papers.filter((p) => p.subject === sub).length;
  }
}
