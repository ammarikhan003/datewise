import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { API_URL } from './api/api.service';
import { provideAppTitleStrategy } from './app-title.strategy';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAppTitleStrategy(),
    // Same origin: the dev server proxies /api to Rails (see proxy.conf.js).
    { provide: API_URL, useValue: '' },
  ],
};
