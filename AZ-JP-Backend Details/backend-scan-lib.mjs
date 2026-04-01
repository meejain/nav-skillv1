/**
 * Shared URL collection and HTML extraction for MediChannel JP backend scans.
 */
import { readFileSync } from 'fs';

export const HOST = 'med.astrazeneca.co.jp';

/** @type {Set<string>} */
export function collectUrls(obj, out = new Set()) {
  if (obj == null) return out;
  if (Array.isArray(obj)) {
    obj.forEach((x) => collectUrls(x, out));
    return out;
  }
  if (typeof obj === 'object') {
    if (typeof obj.url === 'string' && obj.status === 200) out.add(obj.url);
    Object.values(obj).forEach((v) => collectUrls(v, out));
  }
  return out;
}

export function loadUrlsFromJson(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const root = raw['analysis-urls-all'] || raw;
  return [...collectUrls(root)].sort();
}

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

/** Other AstraZeneca domains (med2, www, medsearch, …) — content routing, not vendor integrations in our reports. */
export function isAstraZenecaOrgRoutingHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return h.endsWith('.astrazeneca.co.jp') || h.endsWith('.astrazeneca.com');
}

/**
 * @param {string} html
 * @returns {{ thirdParty: Set<string>, patterns: Set<string>, binPaths: Set<string> }}
 */
export function extractFromHtml(html) {
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
    if (isAstraZenecaOrgRoutingHost(h)) continue;
    thirdParty.add(n.split('#')[0].split('?')[0]);
  }

  const stringUrl =
    /["'](https?:\/\/[^"'\s]+)["']|url:\s*["'](\/bin\/[^"']+)["']|["'](\/\/tags\.tiqcdn\.com[^"']+)["']/gi;
  while ((m = stringUrl.exec(html)) !== null) {
    const a = m[1] || m[2] || m[3];
    if (!a) continue;
    const n = normalizeUrl(a.startsWith('/') ? `https://${HOST}${a}` : a);
    if (!n) continue;
    const h = hostOf(n);
    if (h && h !== HOST && h !== 'www.w3.org' && !isAstraZenecaOrgRoutingHost(h)) {
      thirdParty.add(n.split('#')[0].split('?')[0]);
    }
    if (a.startsWith('/bin/')) binPaths.add(a.split('?')[0]);
  }

  if (/medsearch\.astrazeneca\.co\.jp/i.test(html)) {
    patterns.add('medsearch.astrazeneca.co.jp (search results / form target)');
  }
  if (/syncsearch\.jp|pro\.syncsearch\.jp|ssl\.syncsearch\.jp/i.test(html)) {
    patterns.add('SyncSearch (pro.syncsearch.jp / ssl.syncsearch.jp — suggest UI)');
  }
  if (/tags\.tiqcdn\.com/i.test(html)) {
    patterns.add('Tealium iQ (tags.tiqcdn.com)');
  }
  if (/cdn\.evgnet\.com|evergage/i.test(html)) {
    patterns.add('Evergage / Salesforce Interaction Studio (cdn.evgnet.com)');
  }
  if (/rum\.hlx\.page/i.test(html)) {
    patterns.add('Adobe Helix RUM (rum.hlx.page)');
  }
  if (/digitalstatements|digitalgovernance/i.test(html)) {
    patterns.add('AZ digital governance / statements (digitalstatements.min.js)');
  }
  if (/\/physician-services\/japan\/js\/search\.js/i.test(html)) {
    patterns.add(
      'Site search: medsearch.astrazeneca.co.jp + SyncSearch suggest (loaded from search.js, not inline in HTML)'
    );
  }
  if (/\/bin\/personalization\/trackinpages/i.test(html)) {
    binPaths.add('/bin/personalization/trackinpages');
  }
  if (/\/bin\/globalActivityServlet/i.test(html)) {
    binPaths.add('/bin/globalActivityServlet');
  }
  if (/\/bin\/medpassopenidconnect/i.test(html)) {
    binPaths.add('/bin/medpassopenidconnect');
  }

  const binInHtml = html.matchAll(/["'](\/bin\/[a-zA-Z0-9_/.-]+)/g);
  for (const x of binInHtml) {
    if (!x[1].includes('..')) binPaths.add(x[1].split('?')[0]);
  }

  return { thirdParty, patterns, binPaths };
}

export function integrationLabel(urlOrPath) {
  const u = normalizeUrl(urlOrPath) || urlOrPath;
  try {
    const { hostname, pathname } = new URL(u.startsWith('http') ? u : `https://${HOST}${u}`);
    if (hostname === HOST && pathname.startsWith('/bin/')) {
      return `AEM servlet: ${pathname}`;
    }
    if (hostname.includes('tiqcdn.com')) return 'Tealium iQ tag delivery';
    if (hostname.includes('evgnet.com')) return 'Evergage (Salesforce IS) beacon';
    if (hostname.includes('hlx.page')) return 'Adobe Helix RUM';
    if (hostname.includes('syncsearch')) return 'SyncSearch';
    if (hostname.includes('medsearch.astrazeneca')) return 'AZ JP site search (hosted)';
    if (hostname.includes('astrazeneca.co.jp') && hostname !== HOST) return `Other AZ JP property: ${hostname}`;
    if (hostname.includes('google') || hostname.includes('gstatic')) return `Google: ${hostname}`;
    if (hostname.includes('youtube.com') || hostname.includes('ytimg.com')) return `YouTube: ${hostname}`;
    return `${hostname}${pathname.slice(0, 60)}`;
  } catch {
    return u;
  }
}

/** Third-party if not med.astrazeneca.co.jp (browser same-origin). */
export function isThirdPartyHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return h !== HOST;
}
