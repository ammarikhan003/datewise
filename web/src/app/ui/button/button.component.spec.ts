import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <form (submit)="submitted = submitted + 1; $event.preventDefault()">
      <button uiButton [variant]="variant" [loading]="loading" (click)="clicks = clicks + 1">Place order</button>
    </form>
    <a uiButton variant="secondary" href="/gifts">Browse gifts</a>
    <button uiButton type="button" disabled>Unavailable</button>
  `,
})
class HostComponent {
  variant: 'primary' | 'secondary' = 'primary';
  loading = false;
  clicks = 0;
  submitted = 0;
}

describe('ButtonComponent (uiButton)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let button: HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('form button');
  });

  function setLoading(loading: boolean) {
    host.loading = loading;
    fixture.detectChanges();
  }

  it('keeps the native button, styled as primary by default', () => {
    expect(button.tagName).toBe('BUTTON');
    expect(button.classList).toContain('ui-button');
    expect(button.classList).toContain('ui-button--primary');
    expect(button.textContent?.trim()).toBe('Place order');
  });

  it('can be secondary', () => {
    host.variant = 'secondary';
    fixture.detectChanges();

    expect(button.classList).toContain('ui-button--secondary');
    expect(button.classList).not.toContain('ui-button--primary');
  });

  it('styles links too, keeping them links', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.classList).toContain('ui-button--secondary');
    expect(link.getAttribute('href')).toBe('/gifts');
  });

  it('clicks normally when not loading', () => {
    button.click();

    expect(host.clicks).toBe(1);
    expect(host.submitted).toBe(1);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  describe('while loading', () => {
    beforeEach(() => setLoading(true));

    it('is announced as busy and unavailable but stays focusable', () => {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.disabled).toBe(false);

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('adds hidden "Loading" text so the change is read out with the label', () => {
      const hidden = button.querySelector('.visually-hidden');

      expect(hidden?.textContent?.trim()).toBe('Loading,');
      expect(button.textContent?.replace(/\s+/g, ' ').trim()).toBe('Loading, Place order');
    });

    it('ignores clicks and does not submit the form', () => {
      button.click();

      expect(host.clicks).toBe(0);
      expect(host.submitted).toBe(0);
    });

    it('works again once loading ends', () => {
      setLoading(false);
      button.click();

      expect(host.clicks).toBe(1);
      expect(button.querySelector('.visually-hidden')).toBeNull();
    });
  });

  it('uses the native disabled attribute for a disabled button', () => {
    const disabled = fixture.nativeElement.querySelector('button[disabled]') as HTMLButtonElement;

    expect(disabled.disabled).toBe(true);
    expect(disabled.classList).toContain('ui-button');
  });

  it('has no axe violations, loading or not', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();

    setLoading(true);
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
