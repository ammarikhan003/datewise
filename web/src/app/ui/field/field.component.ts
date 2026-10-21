import { ChangeDetectionStrategy, Component, Directive, Input, inject } from '@angular/core';

let nextId = 0;

/**
 * Label, hint, error and control, wired together. Put `uiControl` on the
 * projected input, textarea or select and it gets the field's id (so the
 * label's `for` matches), aria-describedby pointing at the hint and error,
 * and aria-invalid while there is an error.
 *
 * The error message is passed in by the form, which decides when to show
 * it (usually after submit). Order follows the GOV.UK pattern: label, hint,
 * error, then the control.
 */
@Component({
  selector: 'ui-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  @Input({ required: true }) label!: string;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  readonly controlId = `ui-field-${nextId++}`;
  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  get describedBy(): string | null {
    const ids = [this.hint && this.hintId, this.error && this.errorId].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }
}

@Directive({
  selector: 'input[uiControl], textarea[uiControl], select[uiControl]',
  standalone: true,
  host: {
    class: 'ui-control',
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy',
    '[attr.aria-invalid]': "field.error ? 'true' : null",
  },
})
export class ControlDirective {
  protected readonly field = inject(FieldComponent);
}
