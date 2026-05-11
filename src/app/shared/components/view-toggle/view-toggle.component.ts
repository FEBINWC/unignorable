import { Component, inject } from '@angular/core';
import { ViewModeService } from '../../../core/services/view-mode.service';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  template: `
    <div class="flex rounded-lg border border-white/30 text-sm">
      <button
        class="rounded-l-lg px-3 py-1 transition-colors"
        [class]="viewMode.viewMode() === 'febin' ? 'bg-white text-primary font-semibold' : 'text-white/80 hover:bg-white/10'"
        (click)="viewMode.setMode('febin')"
      >Febin</button>
      <button
        class="rounded-r-lg px-3 py-1 transition-colors"
        [class]="viewMode.viewMode() === 'abin' ? 'bg-white text-primary font-semibold' : 'text-white/80 hover:bg-white/10'"
        (click)="viewMode.setMode('abin')"
      >Abin</button>
    </div>
  `,
})
export class ViewToggleComponent {
  viewMode = inject(ViewModeService);
}
