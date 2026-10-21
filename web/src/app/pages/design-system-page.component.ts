import { ChangeDetectionStrategy, Component } from '@angular/core';

// Filled in as the design-system components are added.
@Component({
  selector: 'app-design-system-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Design system</h1>`,
})
export class DesignSystemPageComponent {}
