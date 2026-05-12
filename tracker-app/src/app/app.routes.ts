import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
      },
      {
        path: 'calendar/:date',
        loadComponent: () =>
          import('./features/calendar/day-detail.component').then(
            (m) => m.DayDetailComponent
          ),
      },
      {
        path: 'deadlines',
        loadComponent: () =>
          import('./features/deadlines/deadlines.component').then(
            (m) => m.DeadlinesComponent
          ),
      },
      {
        path: 'trends',
        loadComponent: () =>
          import('./features/trends/trends.component').then(
            (m) => m.TrendsComponent
          ),
      },
      {
        path: 'weekly-summary',
        loadComponent: () =>
          import('./features/weekly-summary/weekly-summary.component').then(
            (m) => m.WeeklySummaryComponent
          ),
      },
      {
        path: 'question-bank',
        loadComponent: () =>
          import('./features/question-bank/question-bank.component').then(
            (m) => m.QuestionBankComponent
          ),
      },
      {
        path: 'reading-list',
        loadComponent: () =>
          import('./features/reading-list/reading-list.component').then(
            (m) => m.ReadingListComponent
          ),
      },
      {
        path: 'manage-day-orders',
        loadComponent: () =>
          import('./features/manage-day-orders/manage-day-orders.component').then(
            (m) => m.ManageDayOrdersComponent
          ),
      },
    ],
  },
];
