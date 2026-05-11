import { Component, inject, OnInit, signal } from '@angular/core';
import { PaceService } from '../../../core/services/pace.service';
import { PaceInfo } from '../../../core/models/task.model';

const STATUS_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  'ahead': { bg: 'bg-green-50', text: 'text-success-dark', bar: 'bg-success' },
  'on-track': { bg: 'bg-green-50', text: 'text-success-dark', bar: 'bg-success' },
  'slightly-behind': { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  'behind': { bg: 'bg-orange-50', text: 'text-warning-dark', bar: 'bg-warning' },
  'critical': { bg: 'bg-red-50', text: 'text-error', bar: 'bg-error' },
};

@Component({
  selector: 'app-pace-indicator',
  standalone: true,
  template: `
    @if (pace(); as p) {
      <div class="rounded-xl border p-4 shadow-sm" [class]="styles[p.status].bg">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-2xl font-bold" [class]="styles[p.status].text">
              Day {{ p.currentDayOrder }}
            </span>
            <span class="text-sm text-gray-500"> of {{ p.totalDayOrders }}</span>
          </div>
          <div class="text-right">
            @if (p.behindBy > 0) {
              <span class="text-sm font-semibold" [class]="styles[p.status].text">
                {{ p.behindBy }} day{{ p.behindBy > 1 ? 's' : '' }} behind
              </span>
            } @else if (p.status === 'ahead') {
              <span class="text-sm font-semibold text-success-dark">Ahead of schedule</span>
            } @else {
              <span class="text-sm font-semibold text-success-dark">On track</span>
            }
            <div class="text-xs text-gray-500">{{ p.workingDaysRemaining }} working days left</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div class="h-full rounded-full transition-all" [class]="styles[p.status].bar"
            [style.width.%]="(p.dayOrdersCompleted / p.totalDayOrders) * 100"></div>
        </div>

        <!-- Suggestion -->
        <p class="mt-2 text-xs" [class]="styles[p.status].text">{{ p.suggestion }}</p>

        @if (p.requiredPace > 1) {
          <div class="mt-1 text-xs text-gray-500">
            Required pace: {{ p.requiredPace }}x ({{ p.requiredPace > 1 ? 'need to do more than 1 day order/day' : 'normal' }})
          </div>
        }
      </div>
    }
  `,
})
export class PaceIndicatorComponent implements OnInit {
  private paceService = inject(PaceService);
  pace = signal<PaceInfo | null>(null);
  styles = STATUS_STYLES;

  async ngOnInit(): Promise<void> {
    this.pace.set(await this.paceService.getPaceInfo());
  }
}
