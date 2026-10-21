import { ChangeDetectionStrategy, Component } from '@angular/core';

// Placeholder until milestone 6 adds the product list.
@Component({
  selector: 'app-products-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Gifts</h1>
    <p>Choose a gift, then pick a delivery date we can meet.</p>
  `,
})
export class ProductsPageComponent {}
