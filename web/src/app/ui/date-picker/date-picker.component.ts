import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AvailabilityDate, UnavailableReason } from '../../api/api.models';
import { ButtonComponent } from '../button/button.component';
import {
  addDays,
  addMonths,
  cellLabel,
  clampDate,
  formatLongDate,
  formatMonth,
  monthGrid,
  monthOf,
  moveDate,
  reasonText,
} from './calendar';

let nextId = 0;

const WEEKDAYS = [
  { short: 'Mon', long: 'Monday' },
  { short: 'Tue', long: 'Tuesday' },
  { short: 'Wed', long: 'Wednesday' },
  { short: 'Thu', long: 'Thursday' },
  { short: 'Fri', long: 'Friday' },
  { short: 'Sat', long: 'Saturday' },
  { short: 'Sun', long: 'Sunday' },
];

/**
 * A date picker dialog following the WAI-ARIA date picker dialog pattern.
 *
 * It only shows the API's answer: `availability` covers `from`..`to`, dates
 * before `from` are past and dates after `to` are too far ahead. Focus can
 * rest on unavailable dates so their reason is read out, but they can't
 * be chosen.
 *
 * Keys in the grid: arrows move by day and week, Page Up/Down by month,
 * Home/End to Monday/Sunday, Enter or Space chooses, Escape closes. Focus
 * returns to the trigger whenever the dialog closes.
 */
@Component({
  selector: 'ui-date-picker',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
})
export class DatePickerComponent {
  @Input({ required: true }) set availability(dates: AvailabilityDate[]) {
    this.reasons.set(new Map(dates.map((d) => [d.date, d.available ? null : d.reason])));
  }
  @Input({ required: true }) set from(date: string) {
    this.windowStart.set(date);
  }
  @Input({ required: true }) set to(date: string) {
    this.windowEnd.set(date);
  }
  @Input() set value(date: string | null) {
    this.selected.set(date);
  }
  @Output() readonly valueChange = new EventEmitter<string>();

  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('trigger', { static: true, read: ElementRef }) private trigger!: ElementRef<HTMLButtonElement>;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly changeDetector = inject(ChangeDetectorRef);

  private readonly reasons = signal(new Map<string, UnavailableReason | null>());
  private readonly windowStart = signal('');
  private readonly windowEnd = signal('');
  protected readonly selected = signal<string | null>(null);
  protected readonly focused = signal('');

  protected readonly id = `ui-date-picker-${nextId++}`;
  protected readonly weekdays = WEEKDAYS;
  protected readonly cellLabel = cellLabel;

  protected readonly today = computed(() => addDays(this.windowStart(), -1));
  protected readonly month = computed(() => monthOf(this.focused() || this.windowStart()));
  protected readonly weeks = computed(() => monthGrid(this.month()));
  protected readonly monthLabel = computed(() => formatMonth(this.month()));

  /** Focus can move anywhere in the months the booking window touches. */
  private readonly firstNavigable = computed(() => `${monthOf(this.windowStart())}-01`);
  private readonly lastNavigable = computed(() =>
    addDays(`${monthOf(addMonths(`${monthOf(this.windowEnd())}-01`, 1))}-01`, -1),
  );

  protected readonly canGoBack = computed(() => this.month() > monthOf(this.windowStart()));
  protected readonly canGoForward = computed(() => this.month() < monthOf(this.windowEnd()));
  protected readonly previousMonthLabel = computed(() => formatMonth(monthOf(addMonths(`${this.month()}-01`, -1))));
  protected readonly nextMonthLabel = computed(() => formatMonth(monthOf(addMonths(`${this.month()}-01`, 1))));

  /** The line under the grid that tells sighted users about the focused date. */
  protected readonly status = computed(() => {
    const date = this.focused();
    if (!date) return '';
    const reason = this.reasonFor(date);
    return `${formatLongDate(date)}: ${reason ? reasonText(reason) : 'available'}`;
  });

  protected readonly selectedLabel = computed(() => {
    const date = this.selected();
    return date ? formatLongDate(date) : null;
  });

  reasonFor(date: string): UnavailableReason | null {
    if (date < this.windowStart()) return 'past';
    if (date > this.windowEnd()) return 'too_far';
    return this.reasons().get(date) ?? null;
  }

  protected open(): void {
    this.focused.set(this.initialFocus());
    this.dialog.nativeElement.showModal();
    this.focusCell();
  }

  protected close(): void {
    this.dialog.nativeElement.close();
    this.trigger.nativeElement.focus();
  }

  /** Native close (including the browser's own Escape handling). */
  protected onDialogClosed(): void {
    this.trigger.nativeElement.focus();
  }

  protected choose(date: string): void {
    if (this.reasonFor(date)) return;
    this.selected.set(date);
    this.valueChange.emit(date);
    this.close();
  }

  /**
   * Keys on a date cell. Escape is also handled by the native <dialog>
   * anywhere inside it; handling it here as well keeps the grid's
   * behaviour testable where <dialog> is only partly implemented.
   */
  protected onCellKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.choose(this.focused());
      return;
    }

    const target = moveDate(this.focused(), event.key);
    if (!target) return;
    event.preventDefault();
    this.focused.set(clampDate(target, this.firstNavigable(), this.lastNavigable()));
    this.focusCell();
  }

  /** Month buttons move the grid but leave focus on the button, as the pattern says. */
  protected changeMonth(step: 1 | -1): void {
    if (step === 1 ? !this.canGoForward() : !this.canGoBack()) return;
    this.focused.set(clampDate(addMonths(this.focused(), step), this.firstNavigable(), this.lastNavigable()));
  }

  private initialFocus(): string {
    const selected = this.selected();
    if (selected && !this.reasonFor(selected)) return selected;
    for (const [date, reason] of this.reasons()) {
      if (reason === null) return date;
    }
    return this.windowStart();
  }

  /**
   * Re-renders the grid now, then focuses the date. Done synchronously
   * rather than after the next render: when the month changes, the cell
   * doesn't exist until the grid has re-rendered, and waiting for "after
   * render" made that depend on when Angular happened to refresh this view.
   */
  private focusCell(): void {
    this.changeDetector.detectChanges();
    this.host.nativeElement.querySelector<HTMLElement>(`td[data-date="${this.focused()}"]`)?.focus();
  }
}
