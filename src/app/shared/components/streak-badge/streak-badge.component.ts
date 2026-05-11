import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { StreakService } from '../../../core/services/streak.service';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (streak$ | async; as streak) {
      <div class="flex flex-col items-center rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 px-4 py-3 text-white shadow">
        <div class="flex items-center gap-1">
          <i class="mdi mdi-fire text-3xl"></i>
          <span class="text-3xl font-bold leading-none">{{ streak.current }}</span>
          <span class="text-sm opacity-90">day streak</span>
        </div>
        <div class="mt-1 text-xs opacity-80">Best: {{ streak.longest }} days</div>
      </div>
    }
  `,
})
export class StreakBadgeComponent {
  private streakService = inject(StreakService);
  streak$ = this.streakService.streak$;
}
