import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertComponent, AlertVariant } from '../ui/alert/alert.component';
import { ButtonComponent } from '../ui/button/button.component';
import { CardComponent } from '../ui/card/card.component';
import { ErrorSummaryComponent } from '../ui/error-summary/error-summary.component';
import { ControlDirective, FieldComponent } from '../ui/field/field.component';

/** Every design-system component in every state, for review and axe checks. */
@Component({
  selector: 'app-design-system-page',
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    CardComponent,
    ControlDirective,
    ErrorSummaryComponent,
    FieldComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-page.component.html',
  styleUrl: './design-system-page.component.scss',
})
export class DesignSystemPageComponent {
  protected readonly saving = signal(false);
  protected readonly showError = signal(false);
  /** Each click adds a new alert, to hear how a fresh one is announced. */
  protected readonly liveAlerts = signal<{ id: number; variant: AlertVariant }[]>([]);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  protected readonly cards = [
    { slug: 'classic-red-roses', name: 'Classic Red Roses', price: '£35.00', lead: 'Next-day delivery' },
    { slug: 'personalised-mug', name: 'Personalised Mug', price: '£18.00', lead: 'Made to order: 2 extra days' },
    { slug: 'scented-candle-gift-set', name: 'Scented Candle Gift Set', price: '£29.00', lead: 'Out of stock' },
  ];

  protected toggleSaving(): void {
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 2000);
  }

  protected addAlert(variant: AlertVariant): void {
    this.liveAlerts.update((alerts) => [...alerts, { id: alerts.length + 1, variant }]);
  }
}
