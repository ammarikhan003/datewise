import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Gifts',
    loadComponent: () => import('./pages/products-page.component').then((m) => m.ProductsPageComponent),
  },
  {
    path: 'products/:slug',
    title: 'Gift',
    loadComponent: () => import('./pages/product-page.component').then((m) => m.ProductPageComponent),
  },
  {
    path: 'products/:slug/checkout',
    title: 'Checkout',
    loadComponent: () => import('./pages/checkout-page.component').then((m) => m.CheckoutPageComponent),
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
