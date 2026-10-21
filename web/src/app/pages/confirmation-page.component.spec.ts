import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { axe } from 'jest-axe';
import { Order } from '../api/api.models';
import { ConfirmationPageComponent } from './confirmation-page.component';

const order: Order = {
  id: 42,
  delivery_date: '2026-11-12',
  status: 'confirmed',
  customer_name: 'Ada Lovelace',
  email: 'ada@example.com',
  address: '1 Test Street\nLondon N1 1AA',
  created_at: '2026-11-10T10:00:00Z',
  product: { slug: 'classic-red-roses', name: 'Classic Red Roses', price_pence: 3500 },
};

@Component({ standalone: true, template: '' })
class StartComponent {}

describe('ConfirmationPageComponent', () => {
  async function visit(state?: { order: Order }) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'start', component: StartComponent },
          { path: 'orders/confirmation', component: ConfirmationPageComponent },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/start');
    await harness.fixture.ngZone!.run(() => TestBed.inject(Router).navigate(['/orders/confirmation'], { state }));
    harness.detectChanges();
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness.routeNativeElement!;
  }

  it('confirms the order with its details', async () => {
    const root = await visit({ order });

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Order placed');
    const pairs = [...root.querySelectorAll('dl > div')].map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(pairs).toEqual([
      ['Order number', '42'],
      ['Gift', 'Classic Red Roses'],
      ['Price', '£35.00'],
      ['Delivery date', 'Thursday 12 November'],
      ['Name', 'Ada Lovelace'],
      ['Email', 'ada@example.com'],
      ['Address', '1 Test Street\nLondon N1 1AA'],
    ]);
    expect(root.querySelector('a[href="/"]')?.textContent?.trim()).toBe('Browse more gifts');
  });

  it('has no axe violations', async () => {
    expect(await axe(await visit({ order }))).toHaveNoViolations();
  });

  it('shows a general message when visited directly, without an order', async () => {
    const root = await visit();

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Order placed');
    expect(root.textContent).toContain("We can't show the details again on this page.");
    expect(root.querySelector('dl')).toBeNull();
  });
});
