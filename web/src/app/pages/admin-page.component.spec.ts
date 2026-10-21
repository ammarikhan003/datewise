import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { AdminDay } from '../api/api.models';
import { AdminPageComponent } from './admin-page.component';

const DAYS_URL = 'http://localhost:3000/api/admin/days';
const TOKEN_KEY = 'datewise.adminToken';

const days: AdminDay[] = [
  { date: '2026-11-12', capacity: 20, booked: 3, closed: false, closed_reason: null, bank_holiday: null },
  { date: '2026-11-13', capacity: 50, booked: 0, closed: true, closed_reason: 'Van service', bank_holiday: null },
  { date: '2026-11-14', capacity: 50, booked: 0, closed: false, closed_reason: null, bank_holiday: 'Test holiday' },
  { date: '2026-11-15', capacity: 50, booked: 0, closed: false, closed_reason: null, bank_holiday: null },
  { date: '2026-11-16', capacity: 2, booked: 2, closed: false, closed_reason: null, bank_holiday: null },
];

describe('AdminPageComponent', () => {
  let fixture: ComponentFixture<AdminPageComponent>;
  let http: HttpTestingController;
  let root: HTMLElement;

  function create() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminPageComponent);
    root = fixture.nativeElement;
    document.body.appendChild(root);
    fixture.detectChanges();
  }

  async function settle() {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    fixture.detectChanges();
  }

  function type(selector: string, value: string) {
    const input = root.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickButton(text: string, within: ParentNode = root) {
    const button = [...within.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(text))!;
    button.click();
    fixture.detectChanges();
    return button;
  }

  function signIn(token = 's3cret') {
    type('input[type="password"]', token);
    clickButton('Sign in');
  }

  async function signedInWithDays() {
    sessionStorage.setItem(TOKEN_KEY, 's3cret');
    create();
    http.expectOne(DAYS_URL).flush(days);
    await settle();
  }

  const rows = () => [...root.querySelectorAll('tbody tr')];
  const rowFor = (label: string) => rows().find((row) => row.querySelector('th')?.textContent?.includes(label))!;

  beforeEach(() => sessionStorage.clear());

  afterEach(() => {
    http.verify();
    document.body.replaceChildren();
  });

  describe('signing in', () => {
    it('asks for the admin token, loading nothing yet', () => {
      create();

      expect(root.querySelector('h1')?.textContent?.trim()).toBe('Delivery days');
      expect(root.querySelector('label')?.textContent?.trim()).toBe('Admin token');
      http.expectNone(DAYS_URL);
    });

    it('says when the token is left empty', () => {
      create();

      clickButton('Sign in');

      expect(root.querySelector('.ui-error-summary')?.textContent).toContain('Enter the admin token');
      http.expectNone(DAYS_URL);
    });

    it('loads the days with the token and keeps it for this browser tab', async () => {
      create();
      signIn();

      const request = http.expectOne(DAYS_URL);
      expect(request.request.headers.get('Authorization')).toBe('Bearer s3cret');
      expect(sessionStorage.getItem(TOKEN_KEY)).toBe('s3cret');
      expect(root.querySelector('ui-skeleton')).not.toBeNull();
      request.flush(days);
      await settle();

      expect(rows().length).toBe(5);
    });

    it('uses a token already kept for this tab', () => {
      sessionStorage.setItem(TOKEN_KEY, 's3cret');
      create();

      http.expectOne(DAYS_URL).flush(days);
    });

    it('asks again, and forgets the token, when the API rejects it', async () => {
      create();
      signIn('wrong');
      http.expectOne(DAYS_URL).flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      await settle();

      expect(root.querySelector('input[type="password"]')).not.toBeNull();
      expect(root.querySelector('.ui-error-summary')?.textContent).toContain(
        "That token wasn't accepted. Check it and try again.",
      );
      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('signs out', async () => {
      await signedInWithDays();

      clickButton('Sign out');

      expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(root.querySelector('input[type="password"]')).not.toBeNull();
    });
  });

  it('shows an error with a retry button when the days fail to load', async () => {
    sessionStorage.setItem(TOKEN_KEY, 's3cret');
    create();
    http.expectOne(DAYS_URL).flush('down', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(root.querySelector('ui-alert')?.textContent).toContain("We couldn't load the delivery days.");
    clickButton('Try again');
    http.expectOne(DAYS_URL).flush(days);
  });

  describe('the days table', () => {
    beforeEach(signedInWithDays);

    it('is a captioned table in a labelled region that can scroll on small screens', () => {
      const region = root.querySelector('[role="region"]')!;
      const caption = root.querySelector('caption')!;

      expect(region.getAttribute('tabindex')).toBe('0');
      expect(region.getAttribute('aria-labelledby')).toBe(caption.id);
      expect(caption.textContent?.trim()).toBe('Orders booked against capacity, today and the next 30 days');
      expect([...root.querySelectorAll('thead th')].map((th) => th.textContent?.trim())).toEqual([
        'Date',
        'Booked',
        'Status',
        'Actions',
      ]);
    });

    it('labels each row by its date and shows bookings as text', () => {
      const first = rows()[0];

      expect(first.querySelector('th[scope="row"]')?.textContent?.trim()).toBe('Thursday 12 November');
      expect(first.querySelectorAll('td')[0].textContent?.trim()).toBe('3 of 20 booked');
    });

    it('describes each status in words', () => {
      expect(rows().map((row) => row.querySelectorAll('td')[1].textContent?.trim())).toEqual([
        'Open',
        'Closed: Van service',
        'Bank holiday: Test holiday',
        'No deliveries on Sundays',
        'Full',
      ]);
    });

    it('names each Edit button with its date', () => {
      expect(rows()[0].querySelector('button')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Edit Thursday 12 November',
      );
    });

    it('has no axe violations', async () => {
      expect(await axe(root)).toHaveNoViolations();
    });
  });

  describe('editing a day', () => {
    let editButton: HTMLButtonElement;

    beforeEach(async () => {
      await signedInWithDays();
      editButton = clickButton('Edit', rowFor('Thursday 12 November'));
    });

    it('opens a form for that day, focused on its heading, with current values', () => {
      const heading = root.querySelector('#edit-day-heading');

      expect(heading?.textContent?.trim()).toBe('Edit Thursday 12 November');
      expect(document.activeElement).toBe(heading);
      expect(root.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(false);
      expect(root.querySelector<HTMLInputElement>('input[type="number"]')?.value).toBe('20');
    });

    it('saves, updates the row, confirms it and returns focus to the Edit button', async () => {
      root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
      type('input[name="closed_reason"]', 'Van service');
      clickButton('Save');

      const request = http.expectOne(`${DAYS_URL}/2026-11-12`);
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ day: { closed: true, closed_reason: 'Van service', capacity: 20 } });
      request.flush({ ...days[0], closed: true, closed_reason: 'Van service' });
      await settle();

      expect(rowFor('Thursday 12 November').querySelectorAll('td')[1].textContent?.trim()).toBe('Closed: Van service');
      expect(root.querySelector('#edit-day-heading')).toBeNull();
      expect(root.querySelector('ui-alert')?.textContent).toContain('Saved Thursday 12 November.');
      expect(document.activeElement).toBe(rowFor('Thursday 12 November').querySelector('button'));
    });

    it('sends no reason for an open day', () => {
      type('input[name="closed_reason"]', 'Leftover text');
      clickButton('Save');

      const request = http.expectOne(`${DAYS_URL}/2026-11-12`);
      expect(request.request.body).toEqual({ day: { closed: false, closed_reason: null, capacity: 20 } });
      request.flush(days[0]);
    });

    it('cancels, returning focus to the Edit button', () => {
      clickButton('Cancel');

      expect(root.querySelector('#edit-day-heading')).toBeNull();
      expect(document.activeElement).toBe(editButton);
    });

    it('rejects a capacity that is not a whole number of zero or more', () => {
      type('input[type="number"]', '-1');
      clickButton('Save');

      expect(root.querySelector('.ui-error-summary')?.textContent).toContain(
        'Enter a capacity of 0 or more, in whole orders',
      );
      http.expectNone(`${DAYS_URL}/2026-11-12`);
    });

    it('shows a save failure without closing the form', async () => {
      clickButton('Save');
      http.expectOne(`${DAYS_URL}/2026-11-12`).flush('down', { status: 500, statusText: 'Server Error' });
      await settle();

      expect(root.querySelector('#edit-day-heading')).not.toBeNull();
      expect(root.querySelector('ui-alert')?.textContent).toContain("We couldn't save that day. Try again.");
    });

    it('has no axe violations', async () => {
      expect(await axe(root)).toHaveNoViolations();
    });
  });
});
