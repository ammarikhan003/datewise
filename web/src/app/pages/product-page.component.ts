import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AvailabilityDate } from '../api/api.models';
import { ApiService } from '../api/api.service';
import { deliveryText, formatPrice } from '../shared/format';
import { load } from '../shared/load';
import { AlertComponent } from '../ui/alert/alert.component';
import { ButtonComponent } from '../ui/button/button.component';
import { DatePickerComponent } from '../ui/date-picker/date-picker.component';
import { SkeletonComponent } from '../ui/skeleton/skeleton.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [AlertComponent, ButtonComponent, DatePickerComponent, RouterLink, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss',
})
export class ProductPageComponent {
  private readonly api = inject(ApiService);
  protected readonly slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';

  /** The product and its availability window, fetched together. */
  protected readonly page = load(() =>
    forkJoin({ product: this.api.product(this.slug), availability: this.api.availability(this.slug) }),
  );
  protected readonly date = signal<string | null>(null);

  protected readonly formatPrice = formatPrice;
  protected readonly deliveryText = deliveryText;

  /**
   * One h1 that stays in place while its text changes, so the focus the
   * app shell puts on it after navigation isn't lost when data arrives.
   */
  protected readonly heading = computed(() => {
    const state = this.page.state();
    if (state.status === 'loaded') return state.data.product.name;
    if (state.status === 'loading') return 'Loading gift…';
    return state.notFound ? "We couldn't find that gift" : 'Something went wrong';
  });

  protected hasAvailableDate(dates: AvailabilityDate[]): boolean {
    return dates.some((date) => date.available);
  }

  constructor() {
    const title = inject(Title);
    effect(() => {
      const state = this.page.state();
      if (state.status === 'loaded') title.setTitle(`${state.data.product.name} | Datewise`);
    });
  }
}
