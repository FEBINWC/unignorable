import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StreakService } from '../../../core/services/streak.service';

@Component({
  selector: 'app-streak-badge',
  standalone: true,
  imports: [AsyncPipe, MatIconModule],
  template: `
    @if (streak$ | async; as streak) {
      <div class="streak-container">
        <div class="streak-current">
          <mat-icon class="fire-icon">local_fire_department</mat-icon>
          <span class="streak-number">{{ streak.current }}</span>
          <span class="streak-label">day streak</span>
        </div>
        <div class="streak-best">
          Best: {{ streak.longest }} days
        </div>
      </div>
    }
  `,
  styles: [
    `
      .streak-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #ff6b35, #f7c948);
        border-radius: 12px;
        color: white;
      }
      .streak-current {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .fire-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .streak-number {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
      }
      .streak-label {
        font-size: 14px;
        opacity: 0.9;
      }
      .streak-best {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 4px;
      }
    `,
  ],
})
export class StreakBadgeComponent {
  private streakService = inject(StreakService);
  streak$ = this.streakService.streak$;
}
