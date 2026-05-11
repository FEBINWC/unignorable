import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ViewToggleComponent } from '../../shared/components/view-toggle/view-toggle.component';
import { ViewModeService } from '../../core/services/view-mode.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ViewToggleComponent],
  template: `
    <div class="flex h-screen flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-50 flex items-center gap-3 bg-primary px-4 py-3 text-white shadow-md">
        <button
          class="rounded p-1 hover:bg-primary-dark lg:hidden"
          (click)="sidebarOpen.set(!sidebarOpen())"
        >
          <i class="mdi mdi-menu text-2xl"></i>
        </button>
        <span class="text-lg font-semibold">NIOS Study Tracker</span>
        <span class="flex-1"></span>
        <span class="hidden text-sm opacity-90 sm:inline">{{ viewMode.viewMode() === 'febin' ? 'Febin' : 'Parent' }}</span>
        <app-view-toggle></app-view-toggle>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar backdrop (mobile) -->
        @if (sidebarOpen()) {
          <div
            class="fixed inset-0 z-30 bg-black/40 lg:hidden"
            (click)="sidebarOpen.set(false)"
          ></div>
        }

        <!-- Sidebar -->
        <nav
          class="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 transform bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200"
          [class.-translate-x-full]="!sidebarOpen()"
          [class.translate-x-0]="sidebarOpen()"
        >
          <div class="flex flex-col gap-1 p-3">
            @for (item of navItems; track item.route) {
              @if (!item.parentOnly || viewMode.viewMode() === 'parent') {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-primary/10 text-primary font-semibold"
                  class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100"
                  (click)="sidebarOpen.set(false)"
                >
                  <i class="mdi mdi-{{ item.icon }} text-xl"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
            }
          </div>
        </nav>

        <!-- Main content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  viewMode = inject(ViewModeService);
  sidebarOpen = signal(false);

  navItems = [
    { route: '/dashboard', icon: 'view-dashboard', label: 'Dashboard', parentOnly: false },
    { route: '/calendar', icon: 'calendar-month', label: 'Calendar', parentOnly: false },
    { route: '/deadlines', icon: 'flag', label: 'Deadlines', parentOnly: false },
    { route: '/trends', icon: 'trending-up', label: 'Score Trends', parentOnly: false },
    { route: '/weekly-summary', icon: 'file-document-outline', label: 'Weekly Summary', parentOnly: false },
    { route: '/reading-list', icon: 'book-open-variant', label: 'Reading List', parentOnly: false },
    { route: '/manage-day-orders', icon: 'format-list-numbered', label: 'Manage Day Orders', parentOnly: true },
  ];
}
