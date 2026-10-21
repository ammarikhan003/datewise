import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { axe } from 'jest-axe';
import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `
    <ui-card
      heading="Classic Red Roses"
      [link]="['/products', 'classic-red-roses']"
      [headingLevel]="headingLevel"
      [imageUrl]="imageUrl"
      imageAlt="A bunch of red roses"
    >
      <p class="price">£35.00</p>
    </ui-card>
  `,
})
class HostComponent {
  headingLevel: 2 | 3 | 4 = 2;
  imageUrl: string | null = '/roses.jpg';
}

describe('CardComponent (ui-card)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  it('is an article whose heading links to the product', () => {
    const heading = root.querySelector('article h2');
    const link = heading?.querySelector('a');

    expect(heading?.textContent?.trim()).toBe('Classic Red Roses');
    expect(link?.getAttribute('href')).toBe('/products/classic-red-roses');
  });

  it('has exactly one link, so it is one tab stop', () => {
    expect(root.querySelectorAll('a').length).toBe(1);
  });

  it('uses the heading level it is given', () => {
    fixture.componentInstance.headingLevel = 3;
    fixture.detectChanges();

    expect(root.querySelector('article h2')).toBeNull();
    expect(root.querySelector('article h3')?.textContent?.trim()).toBe('Classic Red Roses');
  });

  it('puts the heading before the image in the page source', () => {
    const heading = root.querySelector('h2')!;
    const image = root.querySelector('img')!;

    expect(heading.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(image.getAttribute('alt')).toBe('A bunch of red roses');
  });

  it('leaves the image out when there is none', () => {
    fixture.componentInstance.imageUrl = null;
    fixture.detectChanges();

    expect(root.querySelector('img')).toBeNull();
  });

  it('shows projected content', () => {
    expect(root.querySelector('article .price')?.textContent).toBe('£35.00');
  });

  it('has no axe violations', async () => {
    expect(await axe(root)).toHaveNoViolations();
  });
});
