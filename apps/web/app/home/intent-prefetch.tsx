'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Prefetch-on-intent.
 *
 * Every marketing link sets `prefetch={false}`, which stops Next issuing its
 * two load-time RSC prefetch passes (a viewport batch plus a per-Link pass).
 * Measured on `/products` those two passes were 10 requests and 18.9 KB that
 * did not block first paint but held the `load` event out past 600ms.
 *
 * This component replaces that eager work with the same work triggered by
 * actual intent: a pointer entering a link, or focus reaching one via the
 * keyboard. One delegated listener pair on the document covers the header,
 * footer, in-content calls to action and the page navigator's chapter links,
 * so no link has to know this exists.
 *
 * Each destination is prefetched at most once per page view, tracked in a Set
 * so that re-entering a link does not re-request. External links, the current
 * route, and in-page anchors are ignored: the first two are not this
 * component's business, and the third carries no payload to fetch.
 */
export function IntentPrefetch() {
  const router = useRouter();
  useEffect(() => {
    const done = new Set<string>();
    const warm = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      // Leave same-page links alone; there is no payload to fetch.
      const path = href.split('#')[0];
      if (!path || path === location.pathname) return;
      let url: URL;
      try {
        url = new URL(path, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      const key = url.pathname;
      if (done.has(key)) return;
      done.add(key);
      router.prefetch(key);
    };
    const opts = { capture: true, passive: true } as const;
    document.addEventListener('pointerenter', warm, opts);
    document.addEventListener('focusin', warm, opts);
    return () => {
      document.removeEventListener('pointerenter', warm, opts);
      document.removeEventListener('focusin', warm, opts);
    };
  }, [router]);
  return null;
}
