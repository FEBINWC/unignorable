import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { AngularFireModule } from '@angular/fire/compat';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Firebase — modular SDK providers
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),
    provideStorage(() => getStorage()),

    // Firebase — compat initialization (makes Firebase globally available,
    // prevents "outside injection context" errors in async code)
    importProvidersFrom(AngularFireModule.initializeApp(environment.firebaseConfig)),

    // PWA — disabled temporarily to clear stale caches
    // provideServiceWorker('ngsw-worker.js', {
    //   enabled: !isDevMode(),
    //   registrationStrategy: 'registerWhenStable:30000',
    // }),
  ],
};
