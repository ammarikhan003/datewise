import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

/** The states every data view shows (empty is "loaded" with nothing in it). */
export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; notFound: boolean };

export interface Loader<T> {
  state: Signal<Loadable<T>>;
  retry(): void;
}

/**
 * Subscribes to `source()` straight away and keeps its result in a signal.
 * `retry()` calls the source again. Must be called in an injection context
 * (a constructor or field initialiser); it unsubscribes on destroy.
 */
export function load<T>(source: () => Observable<T>): Loader<T> {
  const state = signal<Loadable<T>>({ status: 'loading' });
  let subscription: Subscription | undefined;

  function start(): void {
    subscription?.unsubscribe();
    state.set({ status: 'loading' });
    subscription = source().subscribe({
      next: (data) => state.set({ status: 'loaded', data }),
      error: (error: unknown) =>
        state.set({ status: 'error', notFound: error instanceof HttpErrorResponse && error.status === 404 }),
    });
  }

  inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());
  start();

  return { state: state.asReadonly(), retry: start };
}
