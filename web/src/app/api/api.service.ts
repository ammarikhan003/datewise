import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AvailabilityResponse, Product } from './api.models';

/** Where the Rails API lives. The default suits `docker compose up`. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/api/products`);
  }

  product(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/api/products/${encodeURIComponent(slug)}`);
  }

  /** Tomorrow through the end of the 30-day booking window (the API's default). */
  availability(slug: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.baseUrl}/api/products/${encodeURIComponent(slug)}/availability`,
    );
  }
}
