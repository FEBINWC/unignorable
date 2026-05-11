import { Injectable, signal } from '@angular/core';

export type ViewMode = 'febin' | 'abin';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly viewMode = signal<ViewMode>('febin');

  toggle(): void {
    this.viewMode.update((m) => (m === 'febin' ? 'abin' : 'febin'));
  }

  setMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
}
