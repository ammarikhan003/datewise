import { TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent (ui-skeleton)', () => {
  function render(lines: number) {
    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('label', 'Loading gifts');
    fixture.componentRef.setInput('lines', lines);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('tells screen readers what is loading, and hides the grey blocks from them', () => {
    const root = render(3);

    expect(root.querySelector('[role="status"]')?.textContent?.trim()).toBe('Loading gifts');
    const blocks = root.querySelector('.ui-skeleton__blocks');
    expect(blocks?.getAttribute('aria-hidden')).toBe('true');
    expect(blocks?.children.length).toBe(3);
  });

  it('has no axe violations', async () => {
    expect(await axe(render(2))).toHaveNoViolations();
  });
});
