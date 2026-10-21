import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Grey placeholder blocks while data loads. The blocks are hidden from
 * screen readers, which hear the label instead.
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="visually-hidden" role="status">{{ label }}</p>
    <div class="ui-skeleton__blocks" aria-hidden="true">
      @for (line of lineArray; track $index) {
        <div class="ui-skeleton__block"></div>
      }
    </div>
  `,
  styles: `
    .ui-skeleton__blocks {
      display: grid;
      gap: var(--space-4);
    }

    .ui-skeleton__block {
      height: 6rem;
      background: linear-gradient(90deg, var(--color-surface), var(--color-disabled-bg), var(--color-surface));
      background-size: 200% 100%;
      border-radius: var(--radius-md);
      animation: ui-skeleton-shimmer 1.5s ease-in-out infinite;
    }

    @keyframes ui-skeleton-shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
  `,
})
export class SkeletonComponent {
  @Input({ required: true }) label!: string;
  @Input() lines = 3;

  get lineArray(): null[] {
    return Array.from({ length: this.lines }, () => null);
  }
}
