import { Component } from '@angular/core';

@Component({
  selector: 'app-color-legend',
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-3 rounded-lg bg-gray-100 p-3">
      @for (item of legendItems; track item.label) {
        <div class="flex items-center gap-1.5">
          <div class="h-4 w-4 rounded border border-gray-300" [style.background]="item.color"></div>
          <span class="text-xs text-gray-600">{{ item.label }}</span>
        </div>
      }
    </div>
  `,
})
export class ColorLegendComponent {
  legendItems = [
    { color: '#2e7d32', label: 'Avg >= 75' },
    { color: '#66bb6a', label: 'Avg >= 50' },
    { color: '#ffca28', label: 'Avg >= 35' },
    { color: '#ff9800', label: 'Pending / Carry-overs' },
    { color: '#e53935', label: 'Avg < 35 / Not done' },
    { color: '#e0e0e0', label: 'Future' },
    { color: '#ffffff', label: 'No tasks' },
  ];
}
