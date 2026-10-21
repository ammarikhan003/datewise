import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL, ApiService } from './api.service';
import { AvailabilityResponse, Product } from './api.models';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: 'http://api.test' }],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const roses: Product = {
    slug: 'classic-red-roses',
    name: 'Classic Red Roses',
    price_pence: 3500,
    lead_time_days: 0,
    in_stock: true,
    image_url: null,
  };

  it('lists products', () => {
    let result: Product[] | undefined;
    api.products().subscribe((products) => (result = products));

    http.expectOne('http://api.test/api/products').flush([roses]);

    expect(result).toEqual([roses]);
  });

  it('fetches one product, escaping the slug', () => {
    api.product('red roses').subscribe();

    http.expectOne('http://api.test/api/products/red%20roses').flush(roses);
  });

  it('fetches the default availability window for a product', () => {
    const body: AvailabilityResponse = {
      product: 'classic-red-roses',
      from: '2026-11-11',
      to: '2026-12-10',
      dates: [{ date: '2026-11-11', available: true, reason: null }],
    };
    let result: AvailabilityResponse | undefined;
    api.availability('classic-red-roses').subscribe((response) => (result = response));

    http.expectOne('http://api.test/api/products/classic-red-roses/availability').flush(body);

    expect(result).toEqual(body);
  });
});
