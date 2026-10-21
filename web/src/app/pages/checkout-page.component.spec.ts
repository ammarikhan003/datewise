import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { axe } from 'jest-axe';
import { Order, Product } from '../api/api.models';
import { CheckoutPageComponent } from './checkout-page.component';

const PRODUCT_URL = 'http://localhost:3000/api/products/classic-red-roses';
const ORDERS_URL = 'http://localhost:3000/api/orders';

const roses: Product = {
  slug: 'classic-red-roses',
  name: 'Classic Red Roses',
  price_pence: 3500,
  lead_time_days: 0,
  in_stock: true,
  image_url: null,
};

const placed: Order = {
  id: 42,
  delivery_date: '2026-11-12',
  status: 'confirmed',
  customer_name: 'Ada Lovelace',
  email: 'ada@example.com',
  address: '1 Test Street, London N1 1AA',
  created_at: '2026-11-10T10:00:00Z',
  product: { slug: 'classic-red-roses', name: 'Classic Red Roses', price_pence: 3500 },
};

@Component({ standalone: true, template: '<h1>Confirmation</h1>' })
class ConfirmationStubComponent {}

describe('CheckoutPageComponent', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;

  async function visit(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'products/:slug/checkout', component: CheckoutPageComponent },
          { path: 'orders/confirmation', component: ConfirmationStubComponent },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    root = harness.routeNativeElement!;
    document.body.appendChild(harness.fixture.nativeElement);
  }

  async function settle() {
    harness.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    harness.detectChanges();
  }

  async function loaded() {
    await visit('/products/classic-red-roses/checkout?date=2026-11-12');
    http.expectOne(PRODUCT_URL).flush(roses);
    await settle();
  }

  function fill(fields: { name?: string; email?: string; address?: string }) {
    const set = (selector: string, value: string) => {
      const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };
    if (fields.name !== undefined) set('input[autocomplete="name"]', fields.name);
    if (fields.email !== undefined) set('input[type="email"]', fields.email);
    if (fields.address !== undefined) set('textarea', fields.address);
    harness.detectChanges();
  }

  function submit() {
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    harness.detectChanges();
  }

  const fillValid = () =>
    fill({ name: 'Ada Lovelace', email: 'ada@example.com', address: '1 Test Street, London N1 1AA' });

  afterEach(() => {
    http.verify();
    document.body.replaceChildren();
  });

  it('asks for a date first when there is none, without loading anything', async () => {
    await visit('/products/classic-red-roses/checkout');

    expect(root.textContent).toContain('Choose a delivery date first.');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/products/classic-red-roses');
  });

  it('treats a malformed date as missing', async () => {
    await visit('/products/classic-red-roses/checkout?date=tomorrow');

    expect(root.textContent).toContain('Choose a delivery date first.');
  });

  it('shows a skeleton while the gift loads', async () => {
    await visit('/products/classic-red-roses/checkout?date=2026-11-12');

    expect(root.querySelector('ui-skeleton')).not.toBeNull();
    http.expectOne(PRODUCT_URL).flush(roses);
  });

  it('shows a not-found message for an unknown gift', async () => {
    await visit('/products/classic-red-roses/checkout?date=2026-11-12');
    http.expectOne(PRODUCT_URL).flush('missing', { status: 404, statusText: 'Not Found' });
    await settle();

    expect(root.textContent).toContain("We couldn't find that gift");
  });

  it('summarises the order with a way to change the date', async () => {
    await loaded();

    const pairs = [...root.querySelectorAll('dl > div')].map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(pairs[0]).toEqual(['Gift', 'Classic Red Roses']);
    expect(pairs[1]).toEqual(['Price', '£35.00']);
    expect(pairs[2][0]).toBe('Delivery date');
    expect(pairs[2][1]).toContain('Thursday 12 November');
    const change = [...root.querySelectorAll('a')].find((a) => a.textContent?.includes('Change date'));
    expect(change?.getAttribute('href')).toBe('/products/classic-red-roses');
  });

  it('labels each field, with autocomplete hints', async () => {
    await loaded();

    const labels = [...root.querySelectorAll('label')].map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Full name', 'Email address', 'Delivery address']);
    expect(root.querySelector('textarea')?.getAttribute('autocomplete')).toBe('street-address');
  });

  describe('client-side validation', () => {
    it('shows no errors before the first submit', async () => {
      await loaded();

      expect(root.querySelector('.ui-error-summary')).toBeNull();
      expect(root.querySelector('[aria-invalid="true"]')).toBeNull();
    });

    it('summarises every missing field on submit, focuses the summary and sends nothing', async () => {
      await loaded();

      submit();

      const summary = root.querySelector('.ui-error-summary')!;
      expect([...summary.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual([
        'Enter your full name',
        'Enter your email address',
        'Enter the delivery address',
      ]);
      expect(document.activeElement).toBe(summary);
      expect(root.querySelectorAll('[aria-invalid="true"]').length).toBe(3);
      http.expectNone(ORDERS_URL);
    });

    it('explains an email in the wrong format', async () => {
      await loaded();
      fill({ name: 'Ada', email: 'ada.example.com', address: '1 Test Street' });

      submit();

      expect(root.querySelector('.ui-error-summary')?.textContent).toContain(
        'Enter an email address in the correct format, like name@example.com',
      );
    });

    it('has no axe violations with errors showing', async () => {
      await loaded();
      submit();

      expect(await axe(root)).toHaveNoViolations();
    });
  });

  describe('placing the order', () => {
    it('sends the order and goes to the confirmation page with it', async () => {
      await loaded();
      fillValid();

      submit();
      const request = http.expectOne(ORDERS_URL);
      expect(request.request.body).toEqual({
        order: {
          product_slug: 'classic-red-roses',
          delivery_date: '2026-11-12',
          customer_name: 'Ada Lovelace',
          email: 'ada@example.com',
          address: '1 Test Street, London N1 1AA',
        },
      });
      request.flush(placed, { status: 201, statusText: 'Created' });
      await harness.fixture.whenStable();

      const router = TestBed.inject(Router);
      expect(router.url).toBe('/orders/confirmation');
      expect(router.lastSuccessfulNavigation?.extras.state).toEqual({ order: placed });
    });

    it('shows the button as loading and ignores a second submit', async () => {
      await loaded();
      fillValid();

      submit();
      expect(root.querySelector('button[type="submit"]')?.getAttribute('aria-busy')).toBe('true');
      // The loading button swallows clicks; submit the form directly too.
      submit();
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      harness.detectChanges();

      http.expectOne(ORDERS_URL).flush(placed, { status: 201, statusText: 'Created' });
    });

    it('explains when the date has just gone, offering another date and keeping the form', async () => {
      await loaded();
      fillValid();

      submit();
      http
        .expectOne(ORDERS_URL)
        .flush({ error: 'unavailable', reason: 'fully_booked' }, { status: 422, statusText: 'Unprocessable Entity' });
      await settle();

      const alert = root.querySelector('ui-alert')!;
      expect(alert.textContent).toContain('Sorry, that date has just gone: fully booked.');
      expect(alert.querySelector('a')?.getAttribute('href')).toBe('/products/classic-red-roses');
      expect(root.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe('ada@example.com');
      expect(root.querySelector('button[type="submit"]')?.hasAttribute('aria-busy')).toBe(false);
    });

    it("shows the server's field errors in the summary", async () => {
      await loaded();
      fillValid();

      submit();
      http
        .expectOne(ORDERS_URL)
        .flush(
          { error: 'invalid', details: { email: ['is invalid'] } },
          { status: 422, statusText: 'Unprocessable Entity' },
        );
      harness.detectChanges();

      expect(root.querySelector('.ui-error-summary')?.textContent).toContain(
        'Enter an email address in the correct format, like name@example.com',
      );
      expect(root.querySelector('input[type="email"]')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('asks the customer to wait when rate limited', async () => {
      await loaded();
      fillValid();

      submit();
      http.expectOne(ORDERS_URL).flush({ error: 'rate_limited' }, { status: 429, statusText: 'Too Many Requests' });
      await settle();

      expect(root.querySelector('ui-alert')?.textContent).toContain('Too many attempts. Wait a minute and try again.');
    });

    it('offers to try again after any other failure', async () => {
      await loaded();
      fillValid();

      submit();
      http.expectOne(ORDERS_URL).flush('down', { status: 500, statusText: 'Server Error' });
      await settle();

      expect(root.querySelector('ui-alert')?.textContent).toContain("We couldn't place your order. Try again.");
    });
  });
});
