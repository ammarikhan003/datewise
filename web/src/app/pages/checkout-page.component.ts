import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatLongDate } from '../ui/date-picker/calendar';

// Placeholder until milestone 7 adds the checkout form.
@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Checkout</h1>
    @if (date) {
      <p>Delivery on {{ formatLongDate(date) }}.</p>
    }
    <p>The checkout form is coming soon.</p>
    <p><a [routerLink]="['/products', slug]">Back to the gift</a></p>
  `,
})
export class CheckoutPageComponent {
  private readonly route = inject(ActivatedRoute).snapshot;
  protected readonly slug = this.route.paramMap.get('slug') ?? '';
  protected readonly date = this.route.queryParamMap.get('date');
  protected readonly formatLongDate = formatLongDate;
}
