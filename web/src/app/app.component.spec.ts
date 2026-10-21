import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { axe } from 'jest-axe';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideAppTitleStrategy } from './app-title.strategy';

describe('AppComponent (the app shell)', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes), provideAppTitleStrategy()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);

    async function navigate(url: string) {
      await fixture.ngZone!.run(() => router.navigateByUrl(url));
      fixture.detectChanges();
      await fixture.whenStable();
    }

    fixture.detectChanges();
    await navigate('/');
    return { fixture, root, navigate };
  }

  afterEach(() => document.body.replaceChildren());

  it('starts with a skip link to the main content', async () => {
    const { root } = await setup();

    const firstLink = root.querySelector('a');
    expect(firstLink?.textContent?.trim()).toBe('Skip to main content');
    expect(firstLink?.getAttribute('href')).toBe('#main-content');
    expect(root.querySelector('main#main-content')).not.toBeNull();
  });

  it('moves focus to main when the skip link is used, without leaving the page', async () => {
    const { root, navigate } = await setup();
    await navigate('/admin');
    const router = TestBed.inject(Router);
    const skipLink = root.querySelector<HTMLAnchorElement>('.skip-link')!;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    skipLink.dispatchEvent(event);

    // With <base href="/">, following "#main-content" would load "/" instead.
    expect(event.defaultPrevented).toBe(true);
    expect(router.url).toBe('/admin');
    expect(document.activeElement).toBe(root.querySelector('main'));
  });

  it('has header, labelled nav, main and footer landmarks', async () => {
    const { root } = await setup();

    expect(root.querySelector('header')).not.toBeNull();
    const nav = root.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).toBe('Main');
    expect([...nav!.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual(['Gifts', 'Admin']);
    expect(root.querySelector('footer')).not.toBeNull();
  });

  it('marks the current page in the nav', async () => {
    const { root, navigate } = await setup();

    await navigate('/admin');

    const current = root.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent?.trim()).toBe('Admin');
  });

  it('gives each page its own title', async () => {
    const { navigate } = await setup();
    const title = TestBed.inject(Title);

    expect(title.getTitle()).toBe('Gifts | Datewise');
    await navigate('/admin');
    expect(title.getTitle()).toBe('Delivery days | Datewise');
    await navigate('/no-such-page');
    expect(title.getTitle()).toBe('Page not found | Datewise');
  });

  it('moves focus to the new page heading after navigating', async () => {
    const { root, navigate } = await setup();

    await navigate('/admin');

    const heading = root.querySelector('main h1');
    expect(heading?.textContent?.trim()).toBe('Delivery days');
    expect(document.activeElement).toBe(heading);
  });

  it('does not steal focus on the first page load', async () => {
    await setup();

    expect(document.activeElement).toBe(document.body);
  });

  it('has no axe violations', async () => {
    const { root } = await setup();

    expect(await axe(root)).toHaveNoViolations();
  });
});
