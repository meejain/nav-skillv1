/**
 * HTML extraction (same dimensions as site-folder backend-scan-lib).
 * @param {import('./context.mjs').createScanContext extends Function ? never : any} ctx
 */

export function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let u = raw.trim();
  if (u.startsWith('//')) u = `https:${u}`;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return null;
}

export function hostOf(absUrl) {
  try {
    return new URL(absUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * @param {string} html
 * @param {{ HOST: string, isOrgRoutingHost: (h: string) => boolean }} ctx
 */
export function extractFromHtml(html, ctx) {
  const { HOST, isOrgRoutingHost } = ctx;
  const thirdParty = new Set();
  const patterns = new Set();
  const binPaths = new Set();

  const absUrlRegex = /(?:src|href|data-src|poster|action)\s*=\s*["']((?:https?:)?\/\/[^"'>\s]+)/gi;
  let m;
  while ((m = absUrlRegex.exec(html)) !== null) {
    const n = normalizeUrl(m[1]);
    if (!n) continue;
    const h = hostOf(n);
    if (!h || h === HOST) continue;
    if (h === 'www.w3.org') continue;
    if (isOrgRoutingHost(h)) continue;
    thirdParty.add(n.split('#')[0].split('?')[0]);
  }

  const stringUrl =
    /["'](https?:\/\/[^"'\s]+)["']|url:\s*["'](\/bin\/[^"']+)["']|["'](\/\/[a-zA-Z0-9][a-zA-Z0-9.-]*[^"'\s]*)["']/gi;
  while ((m = stringUrl.exec(html)) !== null) {
    const a = m[1] || m[2] || m[3];
    if (!a) continue;
    const absolute = a.startsWith('//')
      ? `https:${a}`
      : (a.startsWith('/') ? `https://${HOST}${a}` : a);
    const n = normalizeUrl(absolute);
    if (!n) continue;
    const h = hostOf(n);
    if (h && h !== HOST && h !== 'www.w3.org' && !isOrgRoutingHost(h)) {
      thirdParty.add(n.split('#')[0].split('?')[0]);
    }
    if (a.startsWith('/bin/')) binPaths.add(a.split('?')[0]);
  }

  /**
   * Pattern lines are derived only from extracted third-party URLs (no vendor regex list).
   * Anything visible as a URL in markup is already in `thirdParty`; this adds one label per distinct host.
   */
  thirdParty.forEach((url) => {
    const h = hostOf(url);
    if (h && h !== HOST && !isOrgRoutingHost(h)) {
      patterns.add(`Third-party origin in extracted markup: ${h}`);
    }
  });

  const binInHtml = html.matchAll(/["'](\/bin\/[a-zA-Z0-9_/.-]+)/g);
  for (const x of binInHtml) {
    if (!x[1].includes('..')) binPaths.add(x[1].split('?')[0]);
  }

  return { thirdParty, patterns, binPaths };
}

/**
 * @param {string} urlOrPath
 * @param {{ HOST: string }} ctx
 */
export function integrationLabel(urlOrPath, ctx) {
  const { HOST } = ctx;
  const u = normalizeUrl(urlOrPath) || urlOrPath;
  try {
    const { hostname, pathname } = new URL(u.startsWith('http') ? u : `https://${HOST}${u}`);
    if (hostname === HOST && pathname.startsWith('/bin/')) {
      return `AEM servlet: ${pathname}`;
    }
    return `Third-party: ${hostname}${pathname.slice(0, 72)}`;
  } catch {
    return u;
  }
}
