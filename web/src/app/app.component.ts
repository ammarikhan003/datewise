import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  constructor() {
    // A route change in a single-page app is silent to screen readers, so
    // after each navigation (not the first page load) move focus to the new
    // page's heading. The heading is then read out and Tab continues from there.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => afterNextRender(() => this.focusPageHeading(), { injector: this.injector }));
  }

  /**
   * With <base href="/">, the browser resolves "#main-content" against the
   * site root, so following the link would load the home page. Focus main
   * directly instead; the href stays so it is still a real link.
   */
  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }

  private focusPageHeading(): void {
    const heading = this.host.nativeElement.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }
}
