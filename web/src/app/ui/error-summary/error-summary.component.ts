import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';

let nextId = 0;

export interface FieldError {
  /** The id of the input the error belongs to (ui-field's controlId). */
  fieldId: string;
  message: string;
}

/**
 * The GOV.UK error summary: shown at the top of a form after a failed
 * submit, listing each error as a link to its field. It takes focus every
 * time it receives a new list of errors, so screen readers read it out.
 *
 * Links focus the field directly instead of following "#id": with
 * <base href="/"> the browser would resolve that against the site root.
 */
@Component({
  selector: 'ui-error-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-summary.component.html',
  styleUrl: './error-summary.component.scss',
})
export class ErrorSummaryComponent implements AfterViewChecked {
  @Input() set errors(errors: FieldError[]) {
    this.list = errors;
    this.focusPending = errors.length > 0;
  }

  @ViewChild('summary') private summary?: ElementRef<HTMLElement>;

  protected readonly titleId = `ui-error-summary-${nextId++}-title`;
  protected list: FieldError[] = [];
  private focusPending = false;

  /** Runs once the summary is rendered, so there's an element to focus. */
  ngAfterViewChecked(): void {
    if (!this.focusPending || !this.summary) return;
    this.focusPending = false;
    this.summary.nativeElement.focus();
  }

  protected focusField(event: Event, fieldId: string): void {
    event.preventDefault();
    document.getElementById(fieldId)?.focus();
  }
}
