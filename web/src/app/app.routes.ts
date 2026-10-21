import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Gifts',
    loadComponent: () => import('./pages/products-page.component').then((m) => m.ProductsPageComponent),
  },
  {
    path: 'admin',
    title: 'Delivery days',
    loadComponent: () => import('./pages/admin-page.component').then((m) => m.AdminPageComponent),
  },
  {
    path: 'design-system',
    title: 'Design system',
    loadComponent: () =>
      import('./pages/design-system-page.component').then((m) => m.DesignSystemPageComponent),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('./pages/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
