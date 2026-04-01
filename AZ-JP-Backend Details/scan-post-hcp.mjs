/**
 * Playwright: open each URL, click HCP "はい" when present, wait for tags,
 * record third-party network hosts + HTML extraction. Writes post-HCP reports
 * and third-party-integrations-reference.md
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

import {
  extractFromHtml,
  hostOf,
  integrationLabel,
  isThirdPartyHost,
  loadUrlsFromJson,
  HOST,
} from './backend-scan-lib.mjs';
import { INTEGRATION_REFERENCE, matchReferenceEntry } from './integration-reference-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GOTO_TIMEOUT = Number(process.env.SCAN_GOTO_MS || 55000);
/** Allow time for utag / Evergage / RUM after HCP dismiss */
const POST_CLICK_MS = Number(process.env.SCAN_POST_CLICK_MS || 2800);
const PRE_CLICK_MS = Number(process.env.SCAN_PRE_CLICK_MS || 1200);
const SCAN_LIMIT = process.env.SCAN_LIMIT ? Number(process.env.SCAN_LIMIT) : 0;

/**
 * @param {import('playwright').Page} page
 */
async function dismissHcpGate(page) {
  const candidates = [
    () => page.getByRole('link', { name: 'はい', exact: true }).first(),
    () => page.getByRole('button', { name: 'はい', exact: true }).first(),
    () => page.locator('a:visible').filter({ hasText: /^はい$/ }).first(),
    () => page.getByText('はい', { exact: true }).first(),
  ];
  for (const getLoc of candidates) {
    try {
      const loc = getLoc();
      await loc.click({ timeout: 5000 });
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

/**
 * @param {import('playwright').Page} page
 * @returns {Map<string, Set<string>>}
 */
/**
 * @param {Map<string, Set<string>>} hostSeenOnPages
 * @param {string} generated ISO timestamp
 */
function buildThirdPartyReferenceMd(hostSeenOnPages, generated) {
  let ref = `# Third-party integrations — reference (MediChannel JP)\n\n`;
  ref += `Generated: ${generated}\n\n`;
  ref += `This document explains **what each class of integration is**, how it is **configured** on MediChannel (where known from HTML/network scans), and **why it counts as third party** (or first party) from a browser and privacy perspective.\n\n`;
  ref += `**MediChannel first-party origin:** \`https://${HOST}/\` — anything on **another hostname** is at least a **separate site** for cookies, storage, and CORS (even if the same legal entity).\n\n`;
  ref += `**Scan method:** Post–HCP Playwright crawl documented in \`backend-linkages-post-hcp-report.json\`.\n\n`;
  ref += `Regenerate this file after catalog edits: \`node scan-post-hcp.mjs --reference-only\` (reads last JSON).\n\n`;
  ref += `---\n\n`;

  for (const entry of INTEGRATION_REFERENCE) {
    ref += `## ${entry.title}\n\n`;
    ref += `- **Vendor:** ${entry.vendor}\n`;
    ref += `- **Category:** ${entry.category}\n\n`;
    ref += `### Configuration (on MediChannel)\n\n`;
    for (const line of entry.configuration) {
      ref += `- ${line}\n`;
    }
    ref += `\n### Why this is third party (or not)\n\n${entry.whyThirdParty}\n\n`;
    ref += `### Typical data flows\n\n${entry.dataFlows}\n\n`;

    const matchedHosts = [...hostSeenOnPages.keys()].filter((h) => {
      try {
        return entry.matchHost(h);
      } catch {
        return false;
      }
    });
    ref += `### Observed after HCP confirmation (this crawl)\n\n`;
    if (entry.id === 'az-digital-governance') {
      ref += `**First-party** AEM scripts under \`/etc/designs/.../digitalgovernance/\`; not expected as a separate third-party **network host**. Presence is inferred from HTML in the post-HCP page dump.\n\n`;
    } else if (matchedHosts.length) {
      const pageSets = matchedHosts.map((h) => hostSeenOnPages.get(h)?.size || 0);
      const maxPages = Math.max(...pageSets);
      ref += `Matched hosts: \`${matchedHosts.sort().join('`, `')}\`. Seen on **up to ${maxPages}** page loads (per-host counts: \`hostsAggregated\` in JSON).\n\n`;
    } else {
      ref += `No matching host in the aggregated **network** log for this catalog entry. It may still appear as **HTML-only** links, or load only on specific pages.\n\n`;
    }
    ref += `---\n\n`;
  }

  ref += `## Additional hosts seen on the network (unmatched catalog entries)\n\n`;
  ref += `These hostnames appeared in the post-HCP network capture but did not match a catalog \`matchHost\` rule above. They should be classified manually or by extending \`integration-reference-catalog.mjs\`.\n\n`;

  const unmatched = [...hostSeenOnPages.keys()].filter((h) => !matchReferenceEntry(h)).sort();
  if (unmatched.length === 0) {
    ref += `*(All observed network hosts matched a catalog entry.)*\n`;
  } else {
    for (const h of unmatched) {
      const paths = [...(hostSeenOnPages.get(h) || [])];
      ref += `### \`${h}\`\n`;
      ref += `- **Page loads (count):** ${paths.length}\n`;
      ref += `- **Sample page paths:** ${paths.slice(0, 5).join(', ') || '—'}${paths.length > 5 ? ' …' : ''}\n\n`;
    }
  }

  return ref;
}

function referenceOnlyFromJson() {
  const report = JSON.parse(readFileSync(join(__dirname, 'backend-linkages-post-hcp-report.json'), 'utf8'));
  const hostSeenOnPages = new Map();
  for (const row of report.hostsAggregated || []) {
    hostSeenOnPages.set(row.host, new Set(row.pages));
  }
  const ref = buildThirdPartyReferenceMd(hostSeenOnPages, report.generated);
  writeFileSync(join(__dirname, 'third-party-integrations-reference.md'), ref, 'utf8');
  console.log('Regenerated third-party-integrations-reference.md from backend-linkages-post-hcp-report.json');
}

function attachNetworkCollector(page) {
  /** hostname -> sample path+query snippets */
  const byHost = new Map();
  const onReq = (req) => {
    try {
      const u = new URL(req.url());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      if (!isThirdPartyHost(u.hostname)) return;
      const h = u.hostname.toLowerCase();
      if (!byHost.has(h)) byHost.set(h, new Set());
      const set = byHost.get(h);
      if (set.size >= 20) return;
      const short = `${u.pathname.slice(0, 100)}${u.search ? '?…' : ''}`;
      set.add(short || '/');
    } catch {
      /* ignore */
    }
  };
  page.on('request', onReq);
  return byHost;
}

function mergeHtmlAndNetwork(htmlThirdPartyUrls, networkByHost) {
  const allHosts = new Set();
  for (const u of htmlThirdPartyUrls) {
    const h = hostOf(u);
    if (h) allHosts.add(h);
  }
  for (const h of networkByHost.keys()) {
    allHosts.add(h);
  }
  return [...allHosts].sort();
}

async function main() {
  const jsonPath = join(__dirname, 'urls-all.json');
  let urls = loadUrlsFromJson(jsonPath);
  if (SCAN_LIMIT > 0) urls = urls.slice(0, SCAN_LIMIT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'ja-JP',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: false,
  });

  const byPage = [];
  /** integration key -> Set path */
  const integrationPages = new Map();

  function addIntegration(key, pagePath) {
    if (!integrationPages.has(key)) integrationPages.set(key, new Set());
    integrationPages.get(key).add(pagePath);
  }

  /** hostname -> Set path (for reference doc) */
  const hostSeenOnPages = new Map();

  function recordHost(host, pagePath) {
    if (!host || host === HOST) return;
    if (!hostSeenOnPages.has(host)) hostSeenOnPages.set(host, new Set());
    hostSeenOnPages.get(host).add(pagePath);
  }

  const total = urls.length;
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const path = new URL(url).pathname + new URL(url).search;
    console.log(`[${i + 1}/${total}] ${path}`);
    if (/\.pdf$/i.test(url)) {
      byPage.push({
        url,
        path,
        skipped: 'PDF — not scanned',
      });
      continue;
    }

    const page = await context.newPage();
    const networkByHost = attachNetworkCollector(page);
    let hcpClicked = false;
    let error = null;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
      await page.waitForTimeout(PRE_CLICK_MS);
      hcpClicked = await dismissHcpGate(page);
      await page.waitForTimeout(POST_CLICK_MS);

      const html = await page.content();
      const { thirdParty, patterns, binPaths } = extractFromHtml(html);
      const tpArr = [...thirdParty].sort();
      const patArr = [...patterns].sort();
      const binArr = [...binPaths].sort();

      const mergedHosts = mergeHtmlAndNetwork(tpArr, networkByHost);

      for (const u of tpArr) {
        const h = hostOf(u);
        if (h) recordHost(h, path);
        addIntegration(`Third-party URL (HTML): ${u}`, path);
      }
      for (const h of networkByHost.keys()) {
        recordHost(h, path);
        addIntegration(`Network host: ${h}`, path);
      }
      patArr.forEach((p) => addIntegration(p, path));
      binArr.forEach((b) => addIntegration(integrationLabel(b), path));

      const networkSamples = Object.fromEntries(
        [...networkByHost.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([h, paths]) => [h, [...paths].sort()])
      );

      byPage.push({
        url,
        path,
        hcpGateClicked: hcpClicked,
        mergedThirdPartyHosts: mergedHosts,
        networkHosts: [...networkByHost.keys()].sort(),
        networkSamplePaths: networkSamples,
        htmlThirdPartyUrls: tpArr,
        patterns: patArr,
        binPaths: binArr,
      });
    } catch (e) {
      error = String(e.message || e);
      byPage.push({
        url,
        path,
        error,
        hcpGateClicked: hcpClicked,
        networkHosts: [...networkByHost.keys()].sort(),
        networkSamplePaths: Object.fromEntries(
          [...networkByHost.entries()].map(([h, s]) => [h, [...s]])
        ),
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const uniqueIntegrations = [...integrationPages.entries()]
    .map(([integration, pages]) => ({
      integration,
      pageCount: pages.size,
      pages: [...pages].sort(),
    }))
    .sort((a, b) => b.pageCount - a.pageCount || a.integration.localeCompare(b.integration));

  const generated = new Date().toISOString();
  const out = {
    generated,
    sourceFile: 'urls-all.json',
    method: 'Playwright Chromium: DOMContentLoaded → wait → click はい if found → wait → HTML + network log',
    note: 'Network list includes all third-party hosts that issued requests during the session. Some tags may still load later; Tealium sub-tags depend on iQ profile.',
    totalUrlsStatus200: urls.length,
    byPage,
    uniqueIntegrations,
    hostsAggregated: [...hostSeenOnPages.entries()]
      .map(([host, pages]) => ({
        host,
        pageCount: pages.size,
        pages: [...pages].sort(),
      }))
      .sort((a, b) => b.pageCount - a.pageCount || a.host.localeCompare(b.host)),
  };

  writeFileSync(join(__dirname, 'backend-linkages-post-hcp-report.json'), JSON.stringify(out, null, 2), 'utf8');

  let md = `# MediChannel JP — backend linkages (post–HCP confirmation)\n\n`;
  md += `Generated: ${generated}\n\n`;
  md += `Each page was opened in **headless Chromium**, the **「はい」** control was clicked when found (HCP gate), then the browser waited **${POST_CLICK_MS}ms** for network activity. Third-party **network hosts** and **HTML** references were merged.\n\n`;
  md += `See also: **third-party-integrations-reference.md** for vendor detail and “why third party.”\n\n`;
  md += `## Unique integration keys\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of uniqueIntegrations) {
    const paths =
      row.pages.length > 8
        ? `${row.pages.slice(0, 6).join(', ')} … +${row.pages.length - 6} more`
        : row.pages.join(', ');
    md += `| ${row.integration.replace(/\|/g, '\\|')} | ${row.pageCount} | ${paths.replace(/\|/g, '\\|')} |\n`;
  }

  md += `\n## Per-page (post-HCP)\n\n`;
  for (const p of byPage) {
    md += `### \`${p.path}\`\n`;
    md += `- **URL:** ${p.url}\n`;
    if (p.skipped) {
      md += `- ${p.skipped}\n\n`;
      continue;
    }
    if (p.error) md += `- **Error:** ${p.error}\n`;
    md += `- **HCP 「はい」 clicked:** ${p.hcpGateClicked ? 'yes' : 'no'}\n`;
    if (p.mergedThirdPartyHosts?.length) {
      md += `- **Merged third-party hosts (HTML + network):** ${p.mergedThirdPartyHosts.join(', ')}\n`;
    }
    if (p.networkHosts?.length && p.htmlThirdPartyUrls) {
      const htmlHosts = new Set(p.htmlThirdPartyUrls.map((u) => hostOf(u)).filter(Boolean));
      const onlyNet = p.networkHosts.filter((h) => !htmlHosts.has(h));
      md += `- **Network-only hosts:** ${onlyNet.length ? onlyNet.join(', ') : '—'}\n`;
    }
    if (p.patterns?.length) md += `- **Patterns:** ${p.patterns.join('; ')}\n`;
    if (p.binPaths?.length) md += `- **AEM /bin (HTML):** ${p.binPaths.join(', ')}\n`;
    md += '\n';
  }

  writeFileSync(join(__dirname, 'backend-linkages-post-hcp-report.md'), md, 'utf8');

  writeFileSync(
    join(__dirname, 'third-party-integrations-reference.md'),
    buildThirdPartyReferenceMd(hostSeenOnPages, generated),
    'utf8'
  );

  console.log('Wrote backend-linkages-post-hcp-report.json/.md and third-party-integrations-reference.md');
  console.log('Pages:', byPage.length, 'Unique integration keys:', uniqueIntegrations.length);
}

if (process.argv.includes('--reference-only')) {
  referenceOnlyFromJson();
} else {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
