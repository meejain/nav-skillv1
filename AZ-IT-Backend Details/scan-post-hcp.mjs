/**
 * Playwright: www.astrazeneca.it — dismiss cookie / consent / interstitial banners, then capture network + HTML.
 */
import { readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

import {
  extractFromHtml,
  hostOf,
  integrationLabel,
  isThirdPartyHost,
  loadGroupedUrlEntries,
  loadUrlsFromJson,
  HOST,
} from './backend-scan-lib.mjs';
import { INTEGRATION_REFERENCE, matchReferenceEntry } from './integration-reference-catalog.mjs';
import { POST_HCP_REPORT_TITLE, REFERENCE_DOC_TITLE, SITE_LABEL } from './site-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GOTO_TIMEOUT = Number(process.env.SCAN_GOTO_MS || 55000);
const POST_CLICK_MS = Number(process.env.SCAN_POST_CLICK_MS || 3200);
const PRE_CLICK_MS = Number(process.env.SCAN_PRE_CLICK_MS || 1400);
const SCAN_LIMIT = process.env.SCAN_LIMIT ? Number(process.env.SCAN_LIMIT) : 0;

/**
 * OneTrust, Cookiebot, Italian / English consent, HCP-style はい.
 * @param {import('playwright').Page} page
 */
async function dismissCookieOrConsentBanner(page) {
  const idSelectors = [
    '#onetrust-accept-btn-handler',
    '#accept-recommended-btn-handler',
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button[id*="accept" i][id*="cookie" i]',
  ];

  for (const sel of idSelectors) {
    try {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: 'visible', timeout: 2200 });
      await loc.click({ timeout: 3500 });
      await page.waitForTimeout(500);
      return true;
    } catch {
      /* try next */
    }
  }

  const roleAttempts = [
    () => page.getByRole('button', { name: /Accetta tutti/i }).first(),
    () => page.getByRole('button', { name: /Accetta e chiudi|Accetta e procedi|Accetta cookie/i }).first(),
    () => page.getByRole('button', { name: /^Accetta$/i }).first(),
    () => page.getByRole('button', { name: /^Accetto$/i }).first(),
    () => page.getByRole('button', { name: /^Sì$/i }).first(),
    () => page.getByRole('link', { name: /^Sì$/i }).first(),
    () => page.getByRole('button', { name: /Continua|Prosegui|Ho capito|Va bene/i }).first(),
    () => page.getByRole('button', { name: /Accept all cookies|Accept All|Allow all/i }).first(),
    () => page.getByRole('button', { name: /^Accept$/i }).first(),
    () => page.getByRole('button', { name: /I agree|Agree/i }).first(),
    () => page.getByRole('button', { name: /^OK$/i }).first(),
    () => page.getByRole('button', { name: /^はい$/ }).first(),
    () => page.getByRole('link', { name: /^はい$/ }).first(),
  ];

  for (const getLoc of roleAttempts) {
    try {
      await getLoc().click({ timeout: 4000 });
      await page.waitForTimeout(500);
      return true;
    } catch {
      /* next */
    }
  }

  return false;
}

/**
 * @param {Map<string, Set<string>>} hostSeenOnPages
 * @param {string} generated
 */
function buildThirdPartyReferenceMd(hostSeenOnPages, generated) {
  let ref = `# ${REFERENCE_DOC_TITLE}\n\n`;
  ref += `Generated: ${generated}\n\n`;
  ref += `**Site:** ${SITE_LABEL}\n\n`;
  ref += `**First-party origin:** \`https://${HOST}/\`\n\n`;
  ref += `**Scan:** Post–banner Playwright crawl — \`backend-linkages-post-hcp-report.json\`.\n\n`;
  ref += `Regenerate: \`node scan-post-hcp.mjs --reference-only\`.\n\n`;
  ref += `---\n\n`;

  for (const entry of INTEGRATION_REFERENCE) {
    ref += `## ${entry.title}\n\n`;
    ref += `- **Vendor:** ${entry.vendor}\n`;
    ref += `- **Category:** ${entry.category}\n\n`;
    ref += `### Configuration\n\n`;
    const configLines = Array.isArray(entry.configuration)
      ? entry.configuration
      : [entry.configuration];
    configLines.forEach((line) => {
      ref += `- ${line}\n`;
    });
    ref += `\n### Why third party (or not)\n\n${entry.whyThirdParty}\n\n`;
    ref += `### Typical data flows\n\n${entry.dataFlows}\n\n`;

    const matchedHosts = [...hostSeenOnPages.keys()].filter((h) => {
      try {
        return entry.matchHost(h);
      } catch {
        return false;
      }
    });
    ref += `### Observed (this crawl)\n\n`;
    if (entry.id === 'az-digital-governance') {
      ref += `First-party bundle; not a separate vendor network host.\n\n`;
    } else if (matchedHosts.length) {
      const pageSets = matchedHosts.map((h) => hostSeenOnPages.get(h)?.size || 0);
      const maxPages = Math.max(...pageSets);
      ref += `Hosts: \`${matchedHosts.sort().join('`, `')}\`. Up to **${maxPages}** page loads per host (see JSON \`hostsAggregated\`).\n\n`;
    } else {
      ref += `No matching host in network aggregate.\n\n`;
    }
    ref += `---\n\n`;
  }

  ref += `## Additional hosts (unmatched catalog)\n\n`;
  const unmatched = [...hostSeenOnPages.keys()].filter((h) => !matchReferenceEntry(h)).sort();
  if (unmatched.length === 0) {
    ref += `*(All hosts matched a catalog entry.)*\n`;
  } else {
    unmatched.forEach((h) => {
      const paths = [...(hostSeenOnPages.get(h) || [])];
      ref += `### \`${h}\`\n- **Loads:** ${paths.length}\n\n`;
    });
  }

  return ref;
}

function referenceOnlyFromJson() {
  const report = JSON.parse(readFileSync(join(__dirname, 'backend-linkages-post-hcp-report.json'), 'utf8'));
  const hostSeenOnPages = new Map();
  for (const row of report.hostsAggregated || []) {
    hostSeenOnPages.set(row.host, new Set(row.pages));
  }
  writeFileSync(
    join(__dirname, 'third-party-integrations-reference.md'),
    buildThirdPartyReferenceMd(hostSeenOnPages, report.generated),
    'utf8'
  );
  console.log('Regenerated third-party-integrations-reference.md');
}

function attachNetworkCollector(page) {
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
  htmlThirdPartyUrls.forEach((u) => {
    const h = hostOf(u);
    if (h) allHosts.add(h);
  });
  networkByHost.forEach((_, h) => allHosts.add(h));
  return [...allHosts].sort();
}

function resolveScanTargets() {
  const grouped =
    process.argv.includes('--grouped') || process.env.SCAN_GROUPED === '1' || process.env.SCAN_GROUPED === 'true';
  const customJson = process.env.SCAN_URLS_JSON;
  if (grouped) {
    const jsonPath = join(__dirname, customJson || 'urls-grouped.json');
    const entries = loadGroupedUrlEntries(jsonPath);
    return {
      targets: entries,
      sourceFile: basename(jsonPath),
      urlMode: 'grouped',
    };
  }
  const jsonPath = join(__dirname, customJson || 'urls-all.json');
  const urls = loadUrlsFromJson(jsonPath);
  return {
    targets: urls.map((url) => ({
      url,
      urlGroup: null,
      groupConfidence: null,
    })),
    sourceFile: basename(jsonPath),
    urlMode: 'flat',
  };
}

function buildGroupSummary(byPage) {
  /** @type {Map<string, { groupConfidence: string|null, paths: string[], hosts: Set<string> }>} */
  const m = new Map();
  for (const p of byPage) {
    const g = p.urlGroup != null ? p.urlGroup : '(no group)';
    if (!m.has(g)) {
      m.set(g, { groupConfidence: p.groupConfidence ?? null, paths: [], hosts: new Set() });
    }
    const row = m.get(g);
    if (p.groupConfidence && !row.groupConfidence) row.groupConfidence = p.groupConfidence;
    if (p.path && !p.skipped) row.paths.push(p.path);
    (p.mergedThirdPartyHosts || []).forEach((h) => row.hosts.add(h));
  }
  return [...m.entries()]
    .map(([urlGroup, data]) => ({
      urlGroup,
      groupConfidence: data.groupConfidence,
      pagesInReport: data.paths.length,
      distinctThirdPartyHosts: data.hosts.size,
    }))
    .sort((a, b) => a.urlGroup.localeCompare(b.urlGroup));
}

async function main() {
  const { targets: rawTargets, sourceFile, urlMode } = resolveScanTargets();
  let targets = rawTargets;
  if (SCAN_LIMIT > 0) targets = targets.slice(0, SCAN_LIMIT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'it-IT',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: false,
  });

  const byPage = [];
  const integrationPages = new Map();

  function addIntegration(key, pagePath) {
    if (!integrationPages.has(key)) integrationPages.set(key, new Set());
    integrationPages.get(key).add(pagePath);
  }

  const hostSeenOnPages = new Map();

  function recordHost(host, pagePath) {
    if (!host || host === HOST) return;
    if (!hostSeenOnPages.has(host)) hostSeenOnPages.set(host, new Set());
    hostSeenOnPages.get(host).add(pagePath);
  }

  const total = targets.length;
  for (let i = 0; i < targets.length; i += 1) {
    const { url, urlGroup, groupConfidence } = targets[i];
    const pagePath = new URL(url).pathname + new URL(url).search;
    const groupTag = urlGroup ? ` [${urlGroup}]` : '';
    console.log(`[${i + 1}/${total}] ${pagePath}${groupTag}`);

    if (/\.pdf$/i.test(url)) {
      byPage.push({
        url,
        path: pagePath,
        urlGroup,
        groupConfidence,
        skipped: 'PDF — not scanned',
      });
      continue;
    }

    const page = await context.newPage();
    const networkByHost = attachNetworkCollector(page);
    let bannerClicked = false;
    let error = null;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
      await page.waitForTimeout(PRE_CLICK_MS);
      bannerClicked = await dismissCookieOrConsentBanner(page);
      if (!bannerClicked) {
        await page.waitForTimeout(1000);
        bannerClicked = await dismissCookieOrConsentBanner(page);
      }
      await page.waitForTimeout(POST_CLICK_MS);

      const html = await page.content();
      const { thirdParty, patterns, binPaths } = extractFromHtml(html);
      const tpArr = [...thirdParty].sort();
      const patArr = [...patterns].sort();
      const binArr = [...binPaths].sort();
      const mergedHosts = mergeHtmlAndNetwork(tpArr, networkByHost);

      tpArr.forEach((u) => {
        const h = hostOf(u);
        if (h) recordHost(h, pagePath);
        addIntegration(`Third-party URL (HTML): ${u}`, pagePath);
      });
      networkByHost.forEach((_, h) => {
        recordHost(h, pagePath);
        addIntegration(`Network host: ${h}`, pagePath);
      });
      patArr.forEach((p) => addIntegration(p, pagePath));
      binArr.forEach((b) => addIntegration(integrationLabel(b), pagePath));

      const networkSamples = Object.fromEntries(
        [...networkByHost.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([h, paths]) => [h, [...paths].sort()])
      );

      byPage.push({
        url,
        path: pagePath,
        urlGroup,
        groupConfidence,
        bannerOrConsentClicked: bannerClicked,
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
        path: pagePath,
        urlGroup,
        groupConfidence,
        error,
        bannerOrConsentClicked: bannerClicked,
        networkHosts: [...networkByHost.keys()].sort(),
        networkSamplePaths: Object.fromEntries([...networkByHost.entries()].map(([h, s]) => [h, [...s]])),
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
  const groupSummary = buildGroupSummary(byPage);
  const out = {
    generated,
    sourceFile,
    urlMode,
    site: HOST,
    method:
      'Playwright Chromium (it-IT): DOMContentLoaded → dismiss cookie/consent/interstitial if found → wait → HTML + network',
    note: 'Banner dismissal tries OneTrust/Cookiebot + IT/EN consent labels + はい. Tealium sub-tags are profile-specific.',
    totalUrls: targets.length,
    groupSummary,
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

  let md = `# ${POST_HCP_REPORT_TITLE}\n\n`;
  md += `Generated: ${generated}\n\n`;
  md += `${SITE_LABEL}. Each URL was opened in headless Chromium; **cookie/consent/interstitial** controls were clicked when found, then **${POST_CLICK_MS}ms** wait for tags.\n\n`;
  md += `**URL source:** \`${sourceFile}\` (**${urlMode}**).\n\n`;
  md += `See **integrations-vendors-and-proof.md** (run \`npm run scan:az-it-integrations-md\`) and **third-party-integrations-reference.md**.\n\n`;
  if (groupSummary.length) {
    md += `## Coverage by URL group\n\n`;
    md += `| URL group | Confidence | Pages scanned | Distinct 3rd-party hosts (merged HTML+net) |\n|-----------|------------|---------------|------------------------------------------|\n`;
    for (const row of groupSummary) {
      md += `| \`${String(row.urlGroup).replace(/\|/g, '\\|')}\` | ${row.groupConfidence || '—'} | ${row.pagesInReport} | ${row.distinctThirdPartyHosts} |\n`;
    }
    md += '\n';
  }
  md += `## Unique integration keys\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of uniqueIntegrations) {
    const paths =
      row.pages.length > 8
        ? `${row.pages.slice(0, 6).join(', ')} … +${row.pages.length - 6} more`
        : row.pages.join(', ');
    md += `| ${row.integration.replace(/\|/g, '\\|')} | ${row.pageCount} | ${paths.replace(/\|/g, '\\|')} |\n`;
  }

  md += `\n## Per-page\n\n`;
  for (const p of byPage) {
    md += `### \`${p.path}\`\n- **URL:** ${p.url}\n`;
    if (p.urlGroup != null) {
      md += `- **Group:** \`${p.urlGroup}\`${p.groupConfidence ? ` (confidence ${p.groupConfidence})` : ''}\n`;
    }
    if (p.skipped) {
      md += `- ${p.skipped}\n\n`;
      continue;
    }
    if (p.error) md += `- **Error:** ${p.error}\n`;
    md += `- **Banner/consent clicked:** ${p.bannerOrConsentClicked ? 'yes' : 'no'}\n`;
    if (p.mergedThirdPartyHosts?.length) {
      md += `- **Hosts (HTML + network):** ${p.mergedThirdPartyHosts.join(', ')}\n`;
    }
    if (p.patterns?.length) md += `- **Patterns:** ${p.patterns.join('; ')}\n`;
    if (p.binPaths?.length) md += `- **AEM /bin:** ${p.binPaths.join(', ')}\n`;
    md += '\n';
  }

  writeFileSync(join(__dirname, 'backend-linkages-post-hcp-report.md'), md, 'utf8');
  writeFileSync(
    join(__dirname, 'third-party-integrations-reference.md'),
    buildThirdPartyReferenceMd(hostSeenOnPages, generated),
    'utf8'
  );

  console.log('Wrote backend-linkages-post-hcp-report.json/.md, third-party-integrations-reference.md');
  console.log('Source:', sourceFile, 'mode:', urlMode, 'targets:', byPage.length, 'unique keys:', uniqueIntegrations.length);
}

if (process.argv.includes('--reference-only')) {
  referenceOnlyFromJson();
} else {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
