import { Injectable, signal } from '@angular/core';

export type ViewMode = 'febin' | 'parent';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly viewMode = signal<ViewMode>('febin');

  toggle(): void {
    this.viewMode.update((m) => (m === 'febin' ? 'parent' : 'febin'));
  }

  setMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
}
