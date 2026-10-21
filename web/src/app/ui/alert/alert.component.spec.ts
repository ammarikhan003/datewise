import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { AlertComponent, AlertVariant } from './alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent],
  template: `
    <ui-alert [variant]="variant" [heading]="heading">
      <p>Your order is booked for Thursday 12 November.</p>
    </ui-alert>
  `,
})
class HostComponent {
  variant: AlertVariant = 'success';
  heading: string | null = 'Order placed';
}

describe('AlertComponent (ui-alert)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;

  // Renders, waits out the announcement delay, then renders the message.
  async function render() {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    root = fixture.nativeElement;
  });

  it('creates an empty polite live region before adding the message', async () => {
    fixture.detectChanges();
    const region = root.querySelector('[role="status"]');

    expect(region).not.toBeNull();
    expect(region?.textContent?.trim()).toBe('');

    await render();
    expect(region?.textContent).toContain('Your order is booked for Thursday 12 November.');
  });

  it('never uses the assertive alert role', async () => {
    fixture.componentInstance.variant = 'error';
    await render();

    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(root.querySelector('[role="status"]')).not.toBeNull();
  });

  it.each([
    ['info', 'Information:'],
    ['success', 'Success:'],
    ['error', 'Error:'],
  ] as [AlertVariant, string][])('labels a %s alert in words, not just colour', async (variant, label) => {
    fixture.componentInstance.variant = variant;
    await render();

    expect(root.querySelector('.ui-alert')?.classList).toContain(`ui-alert--${variant}`);
    expect(root.querySelector('.visually-hidden')?.textContent?.trim()).toBe(label);
    expect(root.querySelector('.ui-alert__icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows an optional heading', async () => {
    await render();
    expect(root.querySelector('.ui-alert__heading')?.textContent?.trim()).toBe('Order placed');

    fixture.componentInstance.heading = null;
    fixture.detectChanges();
    expect(root.querySelector('.ui-alert__heading')).toBeNull();
  });

  it.each(['info', 'success', 'error'] as AlertVariant[])('has no axe violations as %s', async (variant) => {
    fixture.componentInstance.variant = variant;
    await render();

    expect(await axe(root)).toHaveNoViolations();
  });
});
