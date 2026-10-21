import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { ErrorSummaryComponent, FieldError } from './error-summary.component';

@Component({
  standalone: true,
  imports: [ErrorSummaryComponent],
  template: `
    <ui-error-summary [errors]="errors" />
    <label for="name">Name</label>
    <input id="name" />
    <label for="email">Email</label>
    <input id="email" />
  `,
})
class HostComponent {
  errors: FieldError[] = [];
}

describe('ErrorSummaryComponent (ui-error-summary)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    root = fixture.nativeElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => document.body.replaceChildren());

  function showErrors(errors: FieldError[]) {
    fixture.componentInstance.errors = errors;
    fixture.detectChanges();
  }

  const twoErrors: FieldError[] = [
    { fieldId: 'name', message: 'Enter your name' },
    { fieldId: 'email', message: 'Enter an email address like name@example.com' },
  ];

  it('renders nothing when there are no errors', () => {
    expect(root.querySelector('.ui-error-summary')).toBeNull();
  });

  it('lists each error as a link to its field under a heading', () => {
    showErrors(twoErrors);

    const summary = root.querySelector('.ui-error-summary')!;
    expect(summary.querySelector('h2')?.textContent?.trim()).toBe('There is a problem');
    const links = [...summary.querySelectorAll('a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      'Enter your name',
      'Enter an email address like name@example.com',
    ]);
    expect(links[0].getAttribute('href')).toBe('#name');
  });

  it('takes focus when errors appear, and again on the next submit', () => {
    showErrors(twoErrors);
    const summary = root.querySelector<HTMLElement>('.ui-error-summary')!;
    expect(document.activeElement).toBe(summary);

    (root.querySelector('#name') as HTMLInputElement).focus();
    showErrors([twoErrors[1]]);
    expect(document.activeElement).toBe(root.querySelector('.ui-error-summary'));
  });

  it('moves focus to the field when a link is followed, without navigating', () => {
    showErrors(twoErrors);
    const link = root.querySelectorAll('a')[1];

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('#email'));
  });

  it('has no axe violations', async () => {
    showErrors(twoErrors);

    expect(await axe(root)).toHaveNoViolations();
  });
});
