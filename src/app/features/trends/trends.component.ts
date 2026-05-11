import { Component, inject, OnInit, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ScheduleService } from '../../core/services/schedule.service';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler
);

const SUBJECT_COLORS: { [key: string]: string } = {
  Accountancy: '#e53935',
  Economics: '#fb8c00',
  'Computer Science': '#7b1fa2',
  English: '#1976d2',
  Psychology: '#00897b',
  'Business Studies': '#43a047',
};

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [BaseChartDirective, MatCardModule, MatChipsModule],
  template: `
    <div class="trends-page">
      <h1>Score Trends</h1>

      <div class="filter-chips">
        <mat-chip-set>
          <mat-chip
            [class.selected]="selectedSubject() === 'all'"
            (click)="selectSubject('all')"
          >All Subjects</mat-chip>
          @for (subject of subjects; track subject) {
            <mat-chip
              [class.selected]="selectedSubject() === subject"
              (click)="selectSubject(subject)"
            >{{ subject }}</mat-chip>
          }
        </mat-chip-set>
      </div>

      <mat-card class="chart-card">
        <mat-card-content>
          @if (chartData(); as data) {
            <canvas baseChart
              [data]="data"
              [options]="chartOptions"
              type="line"
            ></canvas>
          } @else {
            <p class="no-data">No reviewed tasks yet. Scores will appear here once Abin reviews submissions.</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .trends-page { max-width: 900px; margin: 0 auto; }
      .filter-chips { margin-bottom: 16px; }
      .chart-card { padding: 16px; }
      .no-data { text-align: center; color: #888; padding: 40px; }
      .selected { font-weight: 700; }
    `,
  ],
})
export class TrendsComponent implements OnInit {
  private scheduleService = inject(ScheduleService);

  subjects = [
    'Accountancy',
    'Economics',
    'Computer Science',
    'English',
    'Psychology',
    'Business Studies',
  ];

  selectedSubject = signal<string>('all');
  chartData = signal<ChartData<'line'> | null>(null);

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Marks' },
      },
      x: {
        title: { display: true, text: 'Date' },
      },
    },
  };

  private allTasks: { date: string; subject: string; marks: number }[] = [];

  async ngOnInit(): Promise<void> {
    const reviewed = await this.scheduleService.getAllReviewedTasks();
    this.allTasks = reviewed
      .filter((r) => r.task.type === 'exam' && r.task.marks !== null && r.task.subject)
      .map((r) => ({
        date: r.date,
        subject: r.task.subject!,
        marks: r.task.marks!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    this.buildChart();
  }

  selectSubject(subject: string): void {
    this.selectedSubject.set(subject);
    this.buildChart();
  }

  private buildChart(): void {
    if (this.allTasks.length === 0) {
      this.chartData.set(null);
      return;
    }

    const selected = this.selectedSubject();
    const dates = [...new Set(this.allTasks.map((t) => t.date))];

    const datasets: ChartData<'line'>['datasets'] = [];

    const subjectsToShow =
      selected === 'all' ? this.subjects : [selected];

    for (const subject of subjectsToShow) {
      const subjectData = this.allTasks.filter(
        (t) => t.subject === subject
      );
      if (subjectData.length === 0) continue;

      const dataPoints = dates.map((date) => {
        const match = subjectData.find((t) => t.date === date);
        return match ? match.marks : NaN;
      });

      datasets.push({
        label: subject,
        data: dataPoints,
        borderColor: SUBJECT_COLORS[subject] || '#666',
        backgroundColor: (SUBJECT_COLORS[subject] || '#666') + '20',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4,
      });
    }

    this.chartData.set({
      labels: dates.map((d) => d.substring(5)), // MM-DD format
      datasets,
    });
  }
}
