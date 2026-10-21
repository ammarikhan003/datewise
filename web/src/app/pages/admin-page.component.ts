import { ChangeDetectionStrategy, Component } from '@angular/core';

// Placeholder until milestone 7 adds the admin days view.
@Component({
  selector: 'app-admin-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Delivery days</h1>
    <p>Orders booked against capacity for each day.</p>
  `,
})
export class AdminPageComponent {}
