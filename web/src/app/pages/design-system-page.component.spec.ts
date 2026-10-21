import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { axe } from 'jest-axe';
import { DesignSystemPageComponent } from './design-system-page.component';

describe('DesignSystemPageComponent', () => {
  let fixture: ComponentFixture<DesignSystemPageComponent>;
  let root: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DesignSystemPageComponent);
    root = fixture.nativeElement;
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    fixture.detectChanges();
  });

  it('has one h1 and a section for each component', () => {
    expect(root.querySelectorAll('h1').length).toBe(1);
    expect([...root.querySelectorAll('h2')].map((h) => h.textContent?.trim())).toEqual([
      'Buttons',
      'Cards',
      'Fields',
      'Alerts',
    ]);
  });

  it('shows every button state', () => {
    const buttons = [...root.querySelectorAll('.ui-button')];

    expect(buttons.some((b) => b.classList.contains('ui-button--secondary'))).toBe(true);
    expect(buttons.some((b) => b.tagName === 'A')).toBe(true);
    expect(buttons.some((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(buttons.some((b) => b.getAttribute('aria-busy') === 'true')).toBe(true);
  });

  it('shows a field with an error when asked', () => {
    const toggle = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Show error'))!;

    toggle.click();
    fixture.detectChanges();

    expect(root.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  it('has no axe violations', async () => {
    expect(await axe(root)).toHaveNoViolations();
  });
});
