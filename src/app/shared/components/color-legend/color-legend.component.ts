import { Component } from '@angular/core';

@Component({
  selector: 'app-color-legend',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-3 rounded-lg bg-surface-light p-3">
      @for (item of legendItems; track item.label) {
        <div class="flex items-center gap-1.5">
          <div class="h-4 w-4 rounded border border-gray-600" [style.background]="item.color"></div>
          <span class="text-xs text-gray-400">{{ item.label }}</span>
        </div>
      }
    </div>
  `,
})
export class ColorLegendComponent {
  legendItems = [
    { color: '#2e7d32', label: 'Avg >= 75' },
    { color: '#4caf50', label: 'Avg >= 50' },
    { color: '#b8860b', label: 'Avg >= 35' },
    { color: '#e85d04', label: 'Pending / Missed' },
    { color: '#d32f2f', label: 'Avg < 35' },
    { color: '#7b1fa2', label: 'Vacation' },
    { color: '#2a2a2a', label: 'Future' },
    { color: '#1e1e1e', label: 'No tasks' },
  ];
}
