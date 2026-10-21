import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Order } from '../api/api.models';
import { formatPrice } from '../shared/format';
import { formatLongDate } from '../ui/date-picker/calendar';

function isOrder(value: unknown): value is Order {
  return typeof value === 'object' && value !== null && typeof (value as Order).id === 'number';
}

/**
 * Shows the order checkout just placed. The order travels in the
 * navigation state rather than being fetched: the API deliberately has no
 * "get order by id" endpoint, which would let anyone read other customers'
 * names and addresses by guessing numbers. The browser keeps navigation
 * state across a refresh; visiting the URL directly shows a general
 * message instead.
 */
@Component({
  selector: 'app-confirmation-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation-page.component.html',
  styleUrl: './confirmation-page.component.scss',
})
export class ConfirmationPageComponent {
  protected readonly order: Order | null;
  protected readonly formatPrice = formatPrice;
  protected readonly formatLongDate = formatLongDate;

  constructor() {
    // During navigation the state is on the Router; after a reload the
    // browser keeps it in history.state.
    const state: unknown =
      inject(Router).getCurrentNavigation()?.extras.state?.['order'] ??
      (history.state as { order?: unknown } | null)?.order;
    this.order = isOrder(state) ? state : null;
  }
}
