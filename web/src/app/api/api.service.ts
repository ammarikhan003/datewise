import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDay, AvailabilityResponse, DayChanges, Order, OrderRequest, Product } from './api.models';

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

  /** The API re-checks the date under a lock; a 422 body is an OrderError. */
  placeOrder(order: OrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/api/orders`, { order });
  }

  /** Today through 30 days ahead (the API's default). */
  adminDays(token: string): Observable<AdminDay[]> {
    return this.http.get<AdminDay[]>(`${this.baseUrl}/api/admin/days`, { headers: this.auth(token) });
  }

  updateDay(token: string, date: string, changes: DayChanges): Observable<AdminDay> {
    return this.http.patch<AdminDay>(
      `${this.baseUrl}/api/admin/days/${date}`,
      { day: changes },
      { headers: this.auth(token) },
    );
  }

  private auth(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
