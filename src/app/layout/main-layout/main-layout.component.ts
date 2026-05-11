import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ViewToggleComponent } from '../../shared/components/view-toggle/view-toggle.component';
import { ViewModeService } from '../../core/services/view-mode.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ViewToggleComponent,
  ],
  template: `
    <div class="layout-container">
      <mat-toolbar color="primary" class="toolbar">
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="title">NIOS Study Tracker</span>
        <span class="spacer"></span>
        <span class="mode-label">{{ viewMode.viewMode() === 'febin' ? 'Febin' : 'Abin' }}</span>
        <app-view-toggle></app-view-toggle>
      </mat-toolbar>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="isMobile() ? 'over' : 'side'"
          [opened]="!isMobile()"
          class="sidenav"
        >
          <mat-nav-list>
            @for (item of navItems; track item.route) {
              <a
                mat-list-item
                [routerLink]="item.route"
                routerLinkActive="active-link"
                (click)="isMobile() && sidenav.close()"
              >
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content class="content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .layout-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .title {
        margin-left: 8px;
        font-size: 18px;
        font-weight: 500;
      }
      .spacer {
        flex: 1;
      }
      .mode-label {
        font-size: 14px;
        margin-right: 8px;
        opacity: 0.9;
      }
      .sidenav-container {
        flex: 1;
      }
      .sidenav {
        width: 240px;
      }
      .content {
        padding: 24px;
      }
      .active-link {
        background: rgba(25, 118, 210, 0.08);
      }
      @media (max-width: 768px) {
        .content {
          padding: 12px;
        }
        .title {
          font-size: 16px;
        }
        .mode-label {
          display: none;
        }
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  viewMode = inject(ViewModeService);
  private breakpointObserver = inject(BreakpointObserver);
  isMobile = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => this.isMobile.set(result.matches));
  }

  navItems = [
    { route: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { route: '/calendar', icon: 'calendar_month', label: 'Calendar' },
    { route: '/deadlines', icon: 'flag', label: 'Deadlines' },
    { route: '/trends', icon: 'trending_up', label: 'Score Trends' },
    { route: '/weekly-summary', icon: 'summarize', label: 'Weekly Summary' },
  ];
}
