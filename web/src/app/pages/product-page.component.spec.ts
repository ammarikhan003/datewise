import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { axe } from 'jest-axe';
import { AvailabilityResponse, Product } from '../api/api.models';
import { ProductPageComponent } from './product-page.component';

const PRODUCT_URL = 'http://localhost:3000/api/products/classic-red-roses';
const AVAILABILITY_URL = `${PRODUCT_URL}/availability`;

const roses: Product = {
  slug: 'classic-red-roses',
  name: 'Classic Red Roses',
  price_pence: 3500,
  lead_time_days: 0,
  in_stock: true,
  image_url: null,
};

function availability(available: boolean): AvailabilityResponse {
  return {
    product: 'classic-red-roses',
    from: '2026-11-11',
    to: '2026-11-13',
    dates: [
      { date: '2026-11-11', available: false, reason: 'after_cutoff' },
      { date: '2026-11-12', available, reason: available ? null : 'fully_booked' },
      { date: '2026-11-13', available: false, reason: 'fully_booked' },
    ],
  };
}

describe('ProductPageComponent', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'products/:slug', component: ProductPageComponent }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/classic-red-roses');
    root = harness.routeNativeElement!;
    document.body.appendChild(harness.fixture.nativeElement);
  });

  afterEach(() => {
    http.verify();
    document.body.replaceChildren();
  });

  async function respond(product: Product | null, dates: AvailabilityResponse | null) {
    const productRequest = http.expectOne(PRODUCT_URL);
    const availabilityRequest = http.expectOne(AVAILABILITY_URL);
    if (product) productRequest.flush(product);
    else productRequest.flush('missing', { status: 404, statusText: 'Not Found' });
    if (dates) availabilityRequest.flush(dates);
    else if (!availabilityRequest.cancelled) availabilityRequest.flush('missing', { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    harness.detectChanges();
  }

  it('shows a skeleton while loading', () => {
    expect(root.querySelector('ui-skeleton [role="status"]')?.textContent?.trim()).toBe('Loading this gift');
    http.expectOne(PRODUCT_URL);
    http.expectOne(AVAILABILITY_URL);
  });

  it('shows the gift, sets the page title and offers the date picker', async () => {
    await respond(roses, availability(true));

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Classic Red Roses');
    expect(root.textContent).toContain('£35.00');
    expect(root.textContent).toContain('Next-day delivery');
    expect(TestBed.inject(Title).getTitle()).toBe('Classic Red Roses | Datewise');
    expect(root.querySelector('ui-date-picker')).not.toBeNull();
  });

  it('offers checkout only once a date is chosen, carrying the date', async () => {
    await respond(roses, availability(true));
    expect(root.querySelector('a[href*="checkout"]')).toBeNull();

    root.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!.click();
    harness.detectChanges();
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    harness.detectChanges();

    const checkout = root.querySelector('a[href*="checkout"]');
    expect(checkout?.textContent?.trim()).toBe('Continue to checkout');
    expect(checkout?.getAttribute('href')).toBe('/products/classic-red-roses/checkout?date=2026-11-12');
  });

  it('says when a gift is out of stock instead of showing dates', async () => {
    await respond({ ...roses, in_stock: false }, availability(false));

    expect(root.textContent).toContain('This gift is out of stock');
    expect(root.querySelector('ui-date-picker')).toBeNull();
  });

  it('says when there are no delivery dates left in the window', async () => {
    await respond(roses, availability(false));

    expect(root.textContent).toContain('No delivery dates are free in the next 30 days.');
    expect(root.querySelector('ui-date-picker')).toBeNull();
  });

  it('shows a not-found page for an unknown gift', async () => {
    await respond(null, null);

    expect(root.querySelector('h1')?.textContent?.trim()).toBe("We couldn't find that gift");
    expect(root.querySelector('a[href="/"]')?.textContent?.trim()).toBe('Browse all gifts');
  });

  it('shows an error with a retry button', async () => {
    http.expectOne(PRODUCT_URL).flush('down', { status: 500, statusText: 'Server Error' });
    const pending = http.expectOne(AVAILABILITY_URL);
    if (!pending.cancelled) pending.flush(availability(true));
    harness.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    harness.detectChanges();

    expect(root.querySelector('ui-alert')?.textContent).toContain("We couldn't load this gift.");
    [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Try again')!.click();
    harness.detectChanges();

    await respond(roses, availability(true));
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Classic Red Roses');
  });

  it('has no axe violations when loaded', async () => {
    await respond(roses, availability(true));

    expect(await axe(root)).toHaveNoViolations();
  });
});
