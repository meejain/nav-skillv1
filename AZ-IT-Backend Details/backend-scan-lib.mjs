/**
 * URL collection + HTML extraction for www.astrazeneca.it
 */
import { readFileSync } from 'fs';

import { HOST, isAstraZenecaOrgRoutingHost } from './site-config.mjs';

export { HOST, isAstraZenecaOrgRoutingHost };

/** @type {Set<string>} */
export function collectUrls(obj, out = new Set()) {
  if (obj == null) return out;
  if (Array.isArray(obj)) {
    obj.forEach((x) => collectUrls(x, out));
    return out;
  }
  if (typeof obj === 'object') {
    if (typeof obj.url === 'string') {
      if (obj.status === undefined || obj.status === 200) out.add(obj.url);
    }
    Object.values(obj).forEach((v) => collectUrls(v, out));
  }
  return out;
}

export function loadUrlsFromJson(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const root = raw['analysis-urls-all'] || raw;
  if (Array.isArray(root.urls)) {
    const list = root.urls.map((o) => o.url).filter(Boolean);
    return [...new Set(list)].sort();
  }
  return [...collectUrls(root)].sort();
}

/**
 * Flatten `analysis-urls-grouped.groups` into scan targets (dedupe by URL; first group wins).
 * @param {string} jsonPath
 * @returns {{ url: string, urlGroup: string, groupConfidence: string }[]}
 */
export function loadGroupedUrlEntries(jsonPath) {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const root = raw['analysis-urls-grouped'] || raw;
  const groups = root.groups;
  if (!groups || typeof groups !== 'object') {
    throw new Error(`No "groups" object in grouped URL file: ${jsonPath}`);
  }
  /** @type {{ url: string, urlGroup: string, groupConfidence: string }[]} */
  const entries = [];
  const seen = new Set();
  const groupKeys = Object.keys(groups);
  for (const groupKey of groupKeys) {
    const block = groups[groupKey];
    const confidence = (block && block.confidence) || '';
    const urls = (block && block.urls) || [];
    for (const item of urls) {
      const u = item && item.url;
      if (!u || seen.has(u)) continue;
      seen.add(u);
      entries.push({
        url: u,
        urlGroup: groupKey,
        groupConfidence: confidence,
      });
    }
  }
  return entries;
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
    patterns.add('medsearch.astrazeneca.co.jp (search target — org routing for IT reports)');
  }
  if (/syncsearch\.jp|pro\.syncsearch\.jp|ssl\.syncsearch\.jp/i.test(html)) {
    patterns.add('SyncSearch (pro.syncsearch.jp / ssl.syncsearch.jp)');
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
    if (hostname.includes('astrazeneca.it') && hostname !== HOST) return `Other AZ IT property: ${hostname}`;
    if (hostname.includes('astrazeneca.co.jp')) return `AZ JP property: ${hostname}`;
    if (hostname.includes('google') || hostname.includes('gstatic')) return `Google: ${hostname}`;
    if (hostname.includes('youtube.com') || hostname.includes('ytimg.com')) return `YouTube: ${hostname}`;
    return `${hostname}${pathname.slice(0, 60)}`;
  } catch {
    return u;
  }
}

export function isThirdPartyHost(hostname) {
  if (!hostname) return false;
  return hostname.toLowerCase() !== HOST;
}
