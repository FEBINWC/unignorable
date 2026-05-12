import { Component, inject } from '@angular/core';
import { ViewModeService } from '../../../core/services/view-mode.service';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  template: `
    <div class="flex rounded-lg border border-gray-700 text-sm">
      <button
        class="rounded-l-lg px-3 py-1 transition-colors"
        [class]="viewMode.viewMode() === 'febin' ? 'bg-primary text-white font-semibold' : 'text-gray-400 hover:bg-white/5'"
        (click)="viewMode.setMode('febin')"
      >Febin</button>
      <button
        class="rounded-r-lg px-3 py-1 transition-colors"
        [class]="viewMode.viewMode() === 'parent' ? 'bg-primary text-white font-semibold' : 'text-gray-400 hover:bg-white/5'"
        (click)="viewMode.setMode('parent')"
      >Parent</button>
    </div>
  `,
})
export class ViewToggleComponent {
  viewMode = inject(ViewModeService);
}
