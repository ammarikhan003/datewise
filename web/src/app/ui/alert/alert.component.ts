import { ChangeDetectionStrategy, Component, DestroyRef, Input, afterNextRender, inject, signal } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'error';

/** Long enough for screen readers to register the empty region first. */
const ANNOUNCE_DELAY_MS = 100;

const LABELS: Record<AlertVariant, string> = {
  info: 'Information:',
  success: 'Success:',
  error: 'Error:',
};

const ICONS: Record<AlertVariant, string> = {
  info: 'i',
  success: '✓',
  error: '!',
};

/**
 * A message announced politely (role="status") for every variant, as the
 * spec asks. Screen readers only announce changes inside a live region that
 * already exists, so the region renders empty first and the message is
 * added shortly after, in a separate task. That way an alert inserted with
 * its message already in it is still read out.
 *
 * Each variant has an icon and a hidden word label, so meaning never
 * depends on colour alone.
 */
@Component({
  selector: 'ui-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() heading: string | null = null;

  protected readonly shown = signal(false);
  protected readonly labels = LABELS;
  protected readonly icons = ICONS;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // A separate task, not just the next render: the region must reach the
    // accessibility tree on its own before the message is added.
    afterNextRender(() => {
      const timer = setTimeout(() => this.shown.set(true), ANNOUNCE_DELAY_MS);
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });
  }
}
