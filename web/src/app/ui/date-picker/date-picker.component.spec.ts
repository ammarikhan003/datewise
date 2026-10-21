import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { AvailabilityDate, UnavailableReason } from '../../api/api.models';
import { addDays } from './calendar';
import { DatePickerComponent } from './date-picker.component';

// The window the API returns when "today" is Tuesday 10 November 2026,
// after the cutoff: tomorrow is too late, Saturday 14th is full, Sundays
// are closed, everything else is available.
const FROM = '2026-11-11';
const TO = '2026-12-10';

function buildAvailability(): AvailabilityDate[] {
  const dates: AvailabilityDate[] = [];
  for (let date = FROM; date <= TO; date = addDays(date, 1)) {
    let reason: UnavailableReason | null = null;
    if (date === '2026-11-11') reason = 'after_cutoff';
    else if (date === '2026-11-14') reason = 'fully_booked';
    else if (new Date(`${date}T00:00:00Z`).getUTCDay() === 0) reason = 'closed';
    dates.push({ date, available: reason === null, reason });
  }
  return dates;
}

@Component({
  standalone: true,
  imports: [DatePickerComponent],
  template: `
    <ui-date-picker
      [availability]="availability"
      [from]="from"
      [to]="to"
      [value]="value"
      (valueChange)="value = $event; changes.push($event)"
    />
  `,
})
class HostComponent {
  availability = buildAvailability();
  from = FROM;
  to = TO;
  value: string | null = null;
  changes: string[] = [];
}

describe('DatePickerComponent (ui-date-picker)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  });

  afterEach(() => document.body.replaceChildren());

  const trigger = () => root.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
  const dialog = () => root.querySelector('dialog')!;
  const cell = (date: string) => root.querySelector<HTMLElement>(`td[data-date="${date}"]`);
  const focusedDate = () => (document.activeElement as HTMLElement).dataset['date'];
  const monthHeading = () => dialog().querySelector('[id$="-month"]')?.textContent?.trim();

  function open() {
    trigger().click();
    fixture.detectChanges();
  }

  function press(key: string) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    document.activeElement!.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  describe('closed', () => {
    it('shows no date chosen and a trigger that opens a dialog', () => {
      expect(root.textContent).toContain('Delivery date: not chosen yet');
      expect(trigger().textContent?.trim()).toBe('Choose a delivery date');
      expect(dialog().open).toBe(false);
    });

    it('has no axe violations', async () => {
      expect(await axe(root)).toHaveNoViolations();
    });
  });

  describe('when opened', () => {
    beforeEach(open);

    it('opens the dialog on the month of the first available date, focused on that date', () => {
      expect(dialog().open).toBe(true);
      expect(monthHeading()).toBe('November 2026');
      expect(focusedDate()).toBe('2026-11-12');
    });

    it('labels the dialog and the grid', () => {
      const titleId = dialog().getAttribute('aria-labelledby')!;
      expect(root.querySelector(`#${titleId}`)?.textContent?.trim()).toBe('Choose a delivery date');

      const grid = dialog().querySelector('table')!;
      expect(grid.getAttribute('role')).toBe('grid');
      expect(root.querySelector(`#${grid.getAttribute('aria-labelledby')}`)?.textContent?.trim()).toBe('November 2026');
    });

    it('announces month changes', () => {
      expect(dialog().querySelector('[id$="-month"]')?.getAttribute('aria-live')).toBe('polite');
    });

    it('starts weeks on Monday, with full day names for screen readers', () => {
      const headers = [...dialog().querySelectorAll('th')];

      expect(headers.map((th) => th.textContent?.trim())).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      expect(headers[0].getAttribute('abbr')).toBe('Monday');
    });

    it('names each date, with the reason when it is unavailable', () => {
      expect(cell('2026-11-12')?.textContent?.trim()).toContain('Thursday 12 November');
      expect(cell('2026-11-12')?.hasAttribute('aria-disabled')).toBe(false);

      const full = cell('2026-11-14')!;
      expect(full.getAttribute('aria-disabled')).toBe('true');
      expect(full.querySelector('.visually-hidden')?.textContent?.trim()).toBe('Saturday 14 November, fully booked');

      expect(cell('2026-11-03')?.textContent).toContain('Tuesday 3 November, in the past');
      expect(cell('2026-11-15')?.textContent).toContain("Sunday 15 November, we don't deliver that day");
    });

    it('marks today', () => {
      expect(cell('2026-11-10')?.getAttribute('aria-current')).toBe('date');
    });

    it('makes only the focused date tabbable', () => {
      const tabbable = dialog().querySelectorAll('td[tabindex="0"]');

      expect(tabbable.length).toBe(1);
      expect((tabbable[0] as HTMLElement).dataset['date']).toBe('2026-11-12');
    });

    it('shows the focused date and why it is unavailable, for sighted users', () => {
      press('ArrowRight');
      press('ArrowRight');

      expect(root.querySelector('.ui-date-picker__status')?.textContent?.trim()).toBe(
        'Saturday 14 November: fully booked',
      );
    });

    describe('keyboard', () => {
      it.each([
        ['ArrowRight', '2026-11-13'],
        ['ArrowLeft', '2026-11-11'],
        ['ArrowDown', '2026-11-19'],
        ['ArrowUp', '2026-11-05'],
        ['Home', '2026-11-09'],
        ['End', '2026-11-15'],
      ])('%s moves focus to %s', (key, expected) => {
        const event = press(key);

        expect(focusedDate()).toBe(expected);
        expect(event.defaultPrevented).toBe(true);
      });

      it('Page Down moves to the same day next month and shows that month', () => {
        press('PageDown');

        expect(focusedDate()).toBe('2026-12-12');
        expect(monthHeading()).toBe('December 2026');
      });

      it('stops at the last month of the booking window', () => {
        press('PageDown');
        press('PageDown');

        expect(focusedDate()).toBe('2026-12-31');
        expect(monthHeading()).toBe('December 2026');
      });

      it('stops at the start of the first month', () => {
        press('PageUp');

        expect(focusedDate()).toBe('2026-11-01');
        press('ArrowLeft');
        expect(focusedDate()).toBe('2026-11-01');
      });

      it('moves into the next month with the arrow keys', () => {
        press('ArrowDown');
        press('ArrowDown');
        press('ArrowDown');

        expect(focusedDate()).toBe('2026-12-03');
        expect(monthHeading()).toBe('December 2026');
      });

      it('Enter does nothing on an unavailable date', () => {
        press('ArrowRight');
        press('ArrowRight');
        press('Enter');

        expect(dialog().open).toBe(true);
        expect(host.changes).toEqual([]);
      });

      it('Enter selects an available date, closes and returns focus to the trigger', () => {
        press('ArrowRight');
        press('Enter');

        expect(host.changes).toEqual(['2026-11-13']);
        expect(dialog().open).toBe(false);
        expect(document.activeElement).toBe(trigger());
        expect(root.textContent).toContain('Delivery date: Friday 13 November');
        expect(trigger().textContent?.trim()).toBe('Change date');
      });

      it('Space selects too', () => {
        press(' ');

        expect(host.changes).toEqual(['2026-11-12']);
      });

      it('Escape closes without choosing and returns focus to the trigger', () => {
        press('ArrowRight');
        press('Escape');

        expect(dialog().open).toBe(false);
        expect(host.changes).toEqual([]);
        expect(document.activeElement).toBe(trigger());
      });
    });

    it('selects a date when clicked, but not an unavailable one', () => {
      cell('2026-11-14')!.click();
      fixture.detectChanges();
      expect(host.changes).toEqual([]);

      cell('2026-11-20')!.click();
      fixture.detectChanges();
      expect(host.changes).toEqual(['2026-11-20']);
      expect(dialog().open).toBe(false);
    });

    describe('month buttons', () => {
      const prev = () => dialog().querySelector<HTMLButtonElement>('.ui-date-picker__prev')!;
      const next = () => dialog().querySelector<HTMLButtonElement>('.ui-date-picker__next')!;

      it('name the month they go to, and are unavailable at the ends of the window', () => {
        expect(next().getAttribute('aria-label')).toBe('Next month, December 2026');
        expect(prev().getAttribute('aria-disabled')).toBe('true');
        expect(next().hasAttribute('aria-disabled')).toBe(false);
      });

      it('change the month, keeping focus on the button', () => {
        next().focus();
        next().click();
        fixture.detectChanges();

        expect(monthHeading()).toBe('December 2026');
        expect(document.activeElement).toBe(next());
        expect(next().getAttribute('aria-disabled')).toBe('true');
        expect(dialog().querySelector('td[tabindex="0"]')?.getAttribute('data-date')).toBe('2026-12-12');
      });

      it('ignore clicks when unavailable', () => {
        prev().click();
        fixture.detectChanges();

        expect(monthHeading()).toBe('November 2026');
      });
    });

    it('has no axe violations', async () => {
      expect(await axe(root)).toHaveNoViolations();
    });
  });

  it('reopens on the selected date, marked as selected', () => {
    host.value = '2026-11-20';
    fixture.detectChanges();

    open();

    expect(focusedDate()).toBe('2026-11-20');
    expect(cell('2026-11-20')?.getAttribute('aria-selected')).toBe('true');
    expect(cell('2026-11-19')?.getAttribute('aria-selected')).toBe('false');
  });
});
