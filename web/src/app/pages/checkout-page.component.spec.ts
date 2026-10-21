import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { axe } from 'jest-axe';
import { CheckoutPageComponent } from './checkout-page.component';

// Placeholder until milestone 7 adds the checkout form.
describe('CheckoutPageComponent (placeholder)', () => {
  it('confirms the chosen date and links back to the gift', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'products/:slug/checkout', component: CheckoutPageComponent }])],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/products/classic-red-roses/checkout?date=2026-11-12');
    const root = harness.routeNativeElement!;

    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Checkout');
    expect(root.textContent).toContain('Delivery on Thursday 12 November');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('/products/classic-red-roses');
    expect(await axe(root)).toHaveNoViolations();
  });
});
