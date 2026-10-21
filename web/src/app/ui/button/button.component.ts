import { ChangeDetectionStrategy, Component, ElementRef, Input, booleanAttribute, inject } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';

/**
 * Styles a native <button> or <a>, so it keeps everything the browser
 * already does: form submission, keyboard activation, link behaviour.
 *
 * Loading keeps the button focusable (unlike `disabled`, which would drop
 * focus mid-action), marks it aria-disabled and aria-busy, adds hidden
 * "Loading," text before the label and swallows clicks.
 */
@Component({
  // An attribute selector keeps the native element; see the class comment.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[uiButton], a[uiButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading) {
      <span class="ui-button__spinner" aria-hidden="true"></span>
      <span class="visually-hidden">Loading, </span>
    }
    <ng-content />
  `,
  styleUrl: './button.component.scss',
  host: {
    class: 'ui-button',
    '[class.ui-button--primary]': "variant === 'primary'",
    '[class.ui-button--secondary]': "variant === 'secondary'",
    '[attr.aria-disabled]': 'loading || null',
    '[attr.aria-busy]': 'loading || null',
  },
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input({ transform: booleanAttribute }) loading = false;

  constructor() {
    // A capture listener on the element runs before the (click) handlers
    // other templates attach, so it can stop them while loading.
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.addEventListener(
      'click',
      (event) => {
        if (!this.loading) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  }
}
