import { Component } from '@angular/core';

@Component({
  selector: 'app-color-legend',
  standalone: true,
  template: `
    <div class="legend">
      @for (item of legendItems; track item.label) {
        <div class="legend-item">
          <div class="legend-color" [style.background]="item.color"></div>
          <span class="legend-label">{{ item.label }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 3px;
        border: 1px solid rgba(0, 0, 0, 0.12);
      }
      .legend-label {
        font-size: 12px;
        color: #555;
      }
    `,
  ],
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
