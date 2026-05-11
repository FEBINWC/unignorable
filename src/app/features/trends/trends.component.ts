import { Component, inject, OnInit, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, Filler } from 'chart.js';
import { ScheduleService } from '../../core/services/schedule.service';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip, Filler);

const SUBJECT_COLORS: Record<string, string> = {
  Accountancy: '#e53935', Economics: '#fb8c00', 'Computer Science': '#7b1fa2',
  English: '#1976d2', Psychology: '#00897b', 'Business Studies': '#43a047',
};

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-4 text-2xl font-bold">Score Trends</h1>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
          [class]="selectedSubject() === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          (click)="selectSubject('all')"
        >All Subjects</button>
        @for (subject of subjects; track subject) {
          <button
            class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            [class]="selectedSubject() === subject ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            (click)="selectSubject(subject)"
          >{{ subject }}</button>
        }
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        @if (chartData(); as data) {
          <div class="h-[400px]">
            <canvas baseChart [data]="data" [options]="chartOptions" type="line"></canvas>
          </div>
        } @else {
          <p class="py-10 text-center text-gray-400">No reviewed tasks yet. Scores will appear here once Abin reviews submissions.</p>
        }
      </div>
    </div>
  `,
})
export class TrendsComponent implements OnInit {
  private scheduleService = inject(ScheduleService);
  subjects = ['Accountancy', 'Economics', 'Computer Science', 'English', 'Psychology', 'Business Studies'];
  selectedSubject = signal<string>('all');
  chartData = signal<ChartData<'line'> | null>(null);
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { min: 0, max: 100, title: { display: true, text: 'Marks' } }, x: { title: { display: true, text: 'Date' } } },
  };
  private allTasks: { date: string; subject: string; marks: number }[] = [];

  async ngOnInit(): Promise<void> {
    const reviewed = await this.scheduleService.getAllReviewedTasks();
    this.allTasks = reviewed.filter((r) => r.task.type === 'exam' && r.task.marks !== null && r.task.subject)
      .map((r) => ({ date: r.date, subject: r.task.subject!, marks: r.task.marks! })).sort((a, b) => a.date.localeCompare(b.date));
    this.buildChart();
  }

  selectSubject(subject: string): void { this.selectedSubject.set(subject); this.buildChart(); }

  private buildChart(): void {
    if (this.allTasks.length === 0) { this.chartData.set(null); return; }
    const selected = this.selectedSubject();
    const dates = [...new Set(this.allTasks.map((t) => t.date))];
    const datasets: ChartData<'line'>['datasets'] = [];
    for (const subject of (selected === 'all' ? this.subjects : [selected])) {
      const subjectData = this.allTasks.filter((t) => t.subject === subject);
      if (subjectData.length === 0) continue;
      datasets.push({
        label: subject, data: dates.map((d) => { const m = subjectData.find((t) => t.date === d); return m ? m.marks : NaN; }),
        borderColor: SUBJECT_COLORS[subject] || '#666', backgroundColor: (SUBJECT_COLORS[subject] || '#666') + '20',
        tension: 0.3, spanGaps: true, pointRadius: 4,
      });
    }
    this.chartData.set({ labels: dates.map((d) => d.substring(5)), datasets });
  }
}
