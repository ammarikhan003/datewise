import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A product tile. The heading's link is stretched over the whole card, so
 * the card is clickable anywhere but is still one link and one tab stop.
 * The heading comes before the image in the source, so screen readers hear
 * the name first; CSS shows the image on top.
 *
 * Projected content sits under the stretched link: anything interactive in
 * it needs `position: relative; z-index: 1` to stay clickable.
 */
@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input({ required: true }) heading!: string;
  @Input({ required: true }) link!: string | readonly unknown[];
  @Input() headingLevel: 2 | 3 | 4 = 2;
  @Input() imageUrl: string | null = null;
  /** Empty by default: the heading already names the product. */
  @Input() imageAlt = '';
}
