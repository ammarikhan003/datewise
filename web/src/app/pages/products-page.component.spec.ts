import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { axe } from 'jest-axe';
import { Product } from '../api/api.models';
import { ProductsPageComponent } from './products-page.component';

const PRODUCTS_URL = 'http://localhost:3000/api/products';

const products: Product[] = [
  { slug: 'classic-red-roses', name: 'Classic Red Roses', price_pence: 3500, lead_time_days: 0, in_stock: true, image_url: null },
  { slug: 'personalised-mug', name: 'Personalised Mug', price_pence: 1800, lead_time_days: 2, in_stock: true, image_url: null },
  { slug: 'scented-candle-gift-set', name: 'Scented Candle Gift Set', price_pence: 2900, lead_time_days: 0, in_stock: false, image_url: null },
];

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProductsPageComponent);
    root = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  // ui-alert adds its message just after rendering, so wait for it.
  async function settle() {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    fixture.detectChanges();
  }

  it('shows a skeleton while loading', () => {
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Gifts');
    expect(root.querySelector('ui-skeleton [role="status"]')?.textContent?.trim()).toBe('Loading gifts');
    http.expectOne(PRODUCTS_URL);
  });

  it('lists each product as a card linking to its page', async () => {
    http.expectOne(PRODUCTS_URL).flush(products);
    await settle();

    const cards = [...root.querySelectorAll('ui-card')];
    expect(cards.map((card) => card.querySelector('h2')?.textContent?.trim())).toEqual([
      'Classic Red Roses',
      'Personalised Mug',
      'Scented Candle Gift Set',
    ]);
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/products/classic-red-roses');
    expect(cards[0].textContent).toContain('£35.00');
    expect(cards[1].textContent).toContain('Made to order: 2 extra days');
    expect(cards[2].textContent).toContain('Out of stock');
    expect(root.querySelector('ui-skeleton')).toBeNull();
  });

  it('says so when there are no products', async () => {
    http.expectOne(PRODUCTS_URL).flush([]);
    await settle();

    expect(root.textContent).toContain('No gifts are available right now.');
    expect(root.querySelector('ui-card')).toBeNull();
  });

  it('shows an error with a retry button that loads again', async () => {
    http.expectOne(PRODUCTS_URL).flush('down', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(root.querySelector('ui-alert')?.textContent).toContain("We couldn't load the gifts.");
    const retry = [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Try again')!;

    retry.click();
    fixture.detectChanges();
    expect(root.querySelector('ui-skeleton')).not.toBeNull();

    http.expectOne(PRODUCTS_URL).flush(products);
    await settle();
    expect(root.querySelectorAll('ui-card').length).toBe(3);
  });

  it('has no axe violations when loaded or in error', async () => {
    http.expectOne(PRODUCTS_URL).flush(products);
    await settle();
    expect(await axe(root)).toHaveNoViolations();

    const retry = fixture.componentInstance as unknown as { products: { retry(): void } };
    retry.products.retry();
    http.expectOne(PRODUCTS_URL).flush('down', { status: 500, statusText: 'Server Error' });
    await settle();
    expect(await axe(root)).toHaveNoViolations();
  });
});
