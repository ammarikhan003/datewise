import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { OrderError, OrderRequest } from '../api/api.models';
import { ApiService } from '../api/api.service';
import { formatPrice } from '../shared/format';
import { load } from '../shared/load';
import { AlertComponent } from '../ui/alert/alert.component';
import { ButtonComponent } from '../ui/button/button.component';
import { formatLongDate, reasonText } from '../ui/date-picker/calendar';
import { ErrorSummaryComponent, FieldError } from '../ui/error-summary/error-summary.component';
import { ControlDirective, FieldComponent } from '../ui/field/field.component';
import { SkeletonComponent } from '../ui/skeleton/skeleton.component';

type FieldName = 'customer_name' | 'email' | 'address';
const FIELDS: FieldName[] = ['customer_name', 'email', 'address'];

const REQUIRED: Record<FieldName, string> = {
  customer_name: 'Enter your full name',
  email: 'Enter your email address',
  address: 'Enter the delivery address',
};
const EMAIL_FORMAT = 'Enter an email address in the correct format, like name@example.com';

/** A problem with the submission as a whole, shown in an alert above the form. */
type SubmitProblem = { kind: 'unavailable'; reason: string } | { kind: 'rate_limited' } | { kind: 'failed' };

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    ControlDirective,
    ErrorSummaryComponent,
    FieldComponent,
    ReactiveFormsModule,
    RouterLink,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute).snapshot;

  protected readonly slug = this.route.paramMap.get('slug') ?? '';
  /** Only a well-formed date is used; anything else counts as missing. */
  protected readonly date = /^\d{4}-\d{2}-\d{2}$/.test(this.route.queryParamMap.get('date') ?? '')
    ? this.route.queryParamMap.get('date')
    : null;

  protected readonly product = load(() => (this.date ? this.api.product(this.slug) : of(null)));

  protected readonly form = new FormGroup({
    customer_name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  /** Errors appear only after a submit, as the GOV.UK pattern advises. */
  protected readonly fieldErrors = signal<Partial<Record<FieldName, string>>>({});
  protected readonly summary = signal<FieldError[]>([]);
  protected readonly problem = signal<SubmitProblem | null>(null);
  protected readonly submitting = signal(false);

  protected readonly formatPrice = formatPrice;
  protected readonly formatLongDate = formatLongDate;

  /** Field ids come from ui-field, which the template passes in. */
  protected submit(ids: Record<FieldName, string>): void {
    if (this.submitting() || !this.date) return;
    this.problem.set(null);

    const errors = this.clientErrors();
    this.showFieldErrors(errors, ids);
    if (Object.keys(errors).length) return;

    const values = this.form.getRawValue();
    const order: OrderRequest = {
      product_slug: this.slug,
      delivery_date: this.date,
      customer_name: values.customer_name.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
    };

    this.submitting.set(true);
    this.api.placeOrder(order).subscribe({
      next: (placed) => this.router.navigate(['/orders/confirmation'], { state: { order: placed } }),
      error: (error: unknown) => {
        this.submitting.set(false);
        this.handleFailure(error, ids);
      },
    });
  }

  private clientErrors(): Partial<Record<FieldName, string>> {
    const errors: Partial<Record<FieldName, string>> = {};
    for (const field of FIELDS) {
      const control = this.form.controls[field];
      if (control.hasError('required') || !control.value.trim()) errors[field] = REQUIRED[field];
      else if (control.hasError('email')) errors[field] = EMAIL_FORMAT;
    }
    return errors;
  }

  private showFieldErrors(errors: Partial<Record<FieldName, string>>, ids: Record<FieldName, string>): void {
    this.fieldErrors.set(errors);
    // A new array each time, so the summary takes focus on every failed submit.
    this.summary.set(
      FIELDS.filter((field) => errors[field]).map((field) => ({ fieldId: ids[field], message: errors[field]! })),
    );
  }

  /** The server is the final word: its answers override the browser's checks. */
  private handleFailure(error: unknown, ids: Record<FieldName, string>): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.problem.set({ kind: 'failed' });
      return;
    }
    if (error.status === 429) {
      this.problem.set({ kind: 'rate_limited' });
      return;
    }
    const body = error.error as OrderError | null;
    if (error.status === 422 && body?.error === 'unavailable') {
      this.problem.set({ kind: 'unavailable', reason: reasonText(body.reason) });
      return;
    }
    if (error.status === 422 && body?.error === 'invalid') {
      const errors: Partial<Record<FieldName, string>> = {};
      for (const field of FIELDS) {
        const messages = body.details[field];
        if (messages?.length) errors[field] = this.serverMessage(field, messages[0]);
      }
      if (Object.keys(errors).length) {
        this.showFieldErrors(errors, ids);
        return;
      }
    }
    this.problem.set({ kind: 'failed' });
  }

  /** Turns Rails messages ("can't be blank", "is invalid") into the form's own wording. */
  private serverMessage(field: FieldName, message: string): string {
    if (message === "can't be blank") return REQUIRED[field];
    if (field === 'email') return EMAIL_FORMAT;
    return message;
  }
}
