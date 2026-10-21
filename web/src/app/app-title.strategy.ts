import { Injectable, Provider, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Sets the document title to "<route title> | Datewise" on every navigation. */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} | Datewise` : 'Datewise');
  }
}

export function provideAppTitleStrategy(): Provider {
  return { provide: TitleStrategy, useClass: AppTitleStrategy };
}
