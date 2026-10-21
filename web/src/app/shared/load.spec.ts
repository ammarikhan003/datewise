import { HttpErrorResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { load } from './load';

describe('load()', () => {
  function inContext<T>(fn: () => T): T {
    return runInInjectionContext(TestBed.inject(Injector), fn);
  }

  it('starts loading, then holds the data', () => {
    const response = new Subject<string[]>();
    const loader = inContext(() => load(() => response));

    expect(loader.state()).toEqual({ status: 'loading' });

    response.next(['roses']);
    expect(loader.state()).toEqual({ status: 'loaded', data: ['roses'] });
  });

  it('records an error, flagging a 404 as not found', () => {
    const notFound = inContext(() =>
      load(() => throwError(() => new HttpErrorResponse({ status: 404 }))),
    );
    const serverError = inContext(() =>
      load(() => throwError(() => new HttpErrorResponse({ status: 500 }))),
    );

    expect(notFound.state()).toEqual({ status: 'error', notFound: true });
    expect(serverError.state()).toEqual({ status: 'error', notFound: false });
  });

  it('retries by calling the source again and going back to loading', () => {
    let attempt = 0;
    const responses = [new Subject<string>(), new Subject<string>()];
    const loader = inContext(() => load(() => responses[attempt++]));

    responses[0].error(new HttpErrorResponse({ status: 500 }));
    loader.retry();

    expect(attempt).toBe(2);
    expect(loader.state()).toEqual({ status: 'loading' });
    responses[1].next('ok');
    expect(loader.state()).toEqual({ status: 'loaded', data: 'ok' });
  });
});
