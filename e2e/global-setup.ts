import { FullConfig } from '@playwright/test';

/**
 * Waits until the app and the API behind its proxy both answer. On a cold
 * start Rails migrates and seeds, and Angular compiles, which can take
 * minutes.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:4200';
  const deadline = Date.now() + 5 * 60_000;

  for (const url of [baseURL, `${baseURL}/api/products`]) {
    for (;;) {
      try {
        if ((await fetch(url)).ok) break;
      } catch {
        // Not up yet.
      }
      if (Date.now() > deadline) throw new Error(`${url} did not respond within 5 minutes`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
