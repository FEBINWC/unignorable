import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ViewModeService } from '../../../core/services/view-mode.service';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      [value]="viewMode.viewMode()"
      (change)="viewMode.setMode($event.value)"
      appearance="standard"
    >
      <mat-button-toggle value="febin">Febin</mat-button-toggle>
      <mat-button-toggle value="abin">Abin</mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: [
    `
      mat-button-toggle-group {
        height: 36px;
      }
    `,
  ],
})
export class ViewToggleComponent {
  viewMode = inject(ViewModeService);
}
