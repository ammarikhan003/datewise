import { Injectable, signal } from '@angular/core';

const KEY = 'datewise.adminToken';

/**
 * The admin token for this browser tab. sessionStorage keeps it across
 * reloads but forgets it when the tab closes. Storage can be unavailable
 * (private windows, blocked site data), so every access is guarded and the
 * token then lives only in memory.
 */
@Injectable({ providedIn: 'root' })
export class AdminTokenService {
  private readonly current = signal<string | null>(read());
  readonly token = this.current.asReadonly();

  set(token: string): void {
    this.current.set(token);
    try {
      sessionStorage.setItem(KEY, token);
    } catch {
      // Memory only.
    }
  }

  clear(): void {
    this.current.set(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Nothing stored.
    }
  }
}

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
