import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, tap } from 'rxjs';
import { AdminDay, DayChanges } from '../api/api.models';
import { ApiService } from '../api/api.service';
import { AdminTokenService } from '../shared/admin-token.service';
import { load } from '../shared/load';
import { AlertComponent } from '../ui/alert/alert.component';
import { ButtonComponent } from '../ui/button/button.component';
import { formatLongDate, isSunday } from '../ui/date-picker/calendar';
import { ErrorSummaryComponent, FieldError } from '../ui/error-summary/error-summary.component';
import { ControlDirective, FieldComponent } from '../ui/field/field.component';
import { SkeletonComponent } from '../ui/skeleton/skeleton.component';

const TOKEN_REJECTED = "That token wasn't accepted. Check it and try again.";
const CAPACITY_INVALID = 'Enter a capacity of 0 or more, in whole orders';

/**
 * Orders booked against capacity for today and the next 30 days, with a
 * form to close, reopen or resize a day. Access needs the single admin
 * token from the API's environment (v1 has no accounts).
 */
@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    AlertComponent,
    ButtonComponent,
    ControlDirective,
    ErrorSummaryComponent,
    FieldComponent,
    ReactiveFormsModule,
    SkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent implements AfterViewChecked {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(AdminTokenService);

  // Sign-in
  protected readonly signInForm = new FormGroup({ token: new FormControl('', { nonNullable: true }) });
  protected readonly tokenError = signal<string | null>(null);
  protected readonly tokenSummary = signal<FieldError[]>([]);
  protected readonly signedIn = computed(() => this.tokens.token() !== null);

  /** A 401 means the token is wrong: forget it and ask again. */
  protected readonly days = load(() => {
    const token = this.tokens.token();
    if (!token) return EMPTY;
    return this.api.adminDays(token).pipe(tap({ error: (error: unknown) => this.rejectIfUnauthorised(error) }));
  });

  /** Rows saved since the last load, shown in place of the loaded ones. */
  private readonly saved = signal(new Map<string, AdminDay>());
  protected readonly rows = computed(() => {
    const state = this.days.state();
    if (state.status !== 'loaded') return [];
    const saved = this.saved();
    return state.data.map((day) => saved.get(day.date) ?? day);
  });

  // Editing
  protected readonly editing = signal<AdminDay | null>(null);
  protected readonly editForm = new FormGroup({
    closed: new FormControl(false, { nonNullable: true }),
    closed_reason: new FormControl('', { nonNullable: true }),
    capacity: new FormControl<number | null>(null),
  });
  protected readonly capacityError = signal<string | null>(null);
  protected readonly editSummary = signal<FieldError[]>([]);
  protected readonly saving = signal(false);
  protected readonly saveFailed = signal(false);
  /** One notice at a time; a new id re-creates the alert so it's announced again. */
  protected readonly notice = signal<{ id: number; text: string } | null>(null);

  @ViewChild('editHeading') private editHeading?: ElementRef<HTMLElement>;
  private focusEditHeading = false;
  private returnFocusTo: HTMLElement | null = null;
  private noticeId = 0;

  protected readonly formatLongDate = formatLongDate;

  ngAfterViewChecked(): void {
    if (!this.focusEditHeading || !this.editHeading) return;
    this.focusEditHeading = false;
    this.editHeading.nativeElement.focus();
  }

  protected signIn(): void {
    const token = this.signInForm.controls.token.value.trim();
    if (!token) {
      this.showTokenError('Enter the admin token');
      return;
    }
    this.tokenError.set(null);
    this.tokenSummary.set([]);
    this.signInForm.reset();
    this.tokens.set(token);
    this.saved.set(new Map());
    this.days.retry();
  }

  protected signOut(): void {
    this.editing.set(null);
    this.notice.set(null);
    this.tokens.clear();
  }

  protected status(day: AdminDay): string {
    if (day.closed) return day.closed_reason ? `Closed: ${day.closed_reason}` : 'Closed';
    if (day.bank_holiday) return `Bank holiday: ${day.bank_holiday}`;
    if (isSunday(day.date)) return 'No deliveries on Sundays';
    if (day.booked >= day.capacity) return 'Full';
    return 'Open';
  }

  /** Remembers the Edit button that was used, so focus can go back to it. */
  protected edit(day: AdminDay, event: Event): void {
    this.returnFocusTo = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    this.editForm.reset({ closed: day.closed, closed_reason: day.closed_reason ?? '', capacity: day.capacity });
    this.capacityError.set(null);
    this.editSummary.set([]);
    this.saveFailed.set(false);
    this.notice.set(null);
    this.editing.set(day);
    this.focusEditHeading = true;
  }

  protected cancel(): void {
    this.editing.set(null);
    this.returnFocusTo?.focus();
  }

  protected save(): void {
    const day = this.editing();
    const token = this.tokens.token();
    if (!day || !token || this.saving()) return;

    const { closed, closed_reason, capacity } = this.editForm.getRawValue();
    if (capacity === null || !Number.isInteger(capacity) || capacity < 0) {
      this.showCapacityError(CAPACITY_INVALID);
      return;
    }
    this.capacityError.set(null);
    this.editSummary.set([]);
    this.saveFailed.set(false);

    const changes: DayChanges = { closed, closed_reason: closed ? closed_reason.trim() || null : null, capacity };
    this.saving.set(true);
    this.api.updateDay(token, day.date, changes).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.saved.update((saved) => new Map(saved).set(updated.date, updated));
        this.editing.set(null);
        this.notice.set({ id: ++this.noticeId, text: `Saved ${formatLongDate(updated.date)}.` });
        this.returnFocusTo?.focus();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (this.rejectIfUnauthorised(error)) return;
        const details = error instanceof HttpErrorResponse && error.status === 422 ? error.error?.details : null;
        if (details?.capacity?.length) this.showCapacityError(CAPACITY_INVALID);
        else this.saveFailed.set(true);
      },
    });
  }

  private rejectIfUnauthorised(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) return false;
    this.editing.set(null);
    this.tokens.clear();
    this.showTokenError(TOKEN_REJECTED);
    return true;
  }

  private showTokenError(message: string): void {
    this.tokenError.set(message);
    this.tokenSummary.set([{ fieldId: 'admin-token', message }]);
  }

  private showCapacityError(message: string): void {
    this.capacityError.set(message);
    this.editSummary.set([{ fieldId: 'day-capacity', message }]);
  }
}
