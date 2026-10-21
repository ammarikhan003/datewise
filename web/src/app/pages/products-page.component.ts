import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { deliveryText, formatPrice } from '../shared/format';
import { load } from '../shared/load';
import { AlertComponent } from '../ui/alert/alert.component';
import { ButtonComponent } from '../ui/button/button.component';
import { CardComponent } from '../ui/card/card.component';
import { SkeletonComponent } from '../ui/skeleton/skeleton.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [AlertComponent, ButtonComponent, CardComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent {
  private readonly api = inject(ApiService);

  protected readonly products = load(() => this.api.products());
  protected readonly formatPrice = formatPrice;
  protected readonly deliveryText = deliveryText;
}
