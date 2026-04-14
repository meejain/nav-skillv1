import { chromium } from 'playwright';

import { extractFromHtml, hostOf, integrationLabel } from './extract.mjs';

const GOTO_TIMEOUT = Number(process.env.SCAN_GOTO_MS || 55000);
const POST_CLICK_MS = Number(process.env.SCAN_POST_CLICK_MS || 4000);
const PRE_CLICK_MS = Number(process.env.SCAN_PRE_CLICK_MS || 1400);

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
    () => page.getByRole('button', { name: /Accept all cookies|Accept All|Allow all|Accept All Cookies/i }).first(),
    () => page.getByRole('button', { name: /Agree|I agree|I Accept|Accept and proceed|Confirm choices/i }).first(),
    () => page.getByRole('button', { name: /^Accept$/i }).first(),
    () => page.getByRole('button', { name: /Got it|Dismiss|Close|Continue/i }).first(),
    () => page.getByRole('button', { name: /^OK$/i }).first(),
    () => page.getByRole('button', { name: /Tout accepter|Alle akzeptieren/i }).first(),
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

function attachNetworkCollector(page, isThirdPartyHost) {
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

/**
 * @param {string[]} urls
 * @param {ReturnType<import('./context.mjs').createScanContext>} ctx
 */
export async function runPlaywrightScan(urls, ctx) {
  const { HOST, isThirdPartyHost } = ctx;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en-US',
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
    if (!isThirdPartyHost(host)) return;
    if (!hostSeenOnPages.has(host)) hostSeenOnPages.set(host, new Set());
    hostSeenOnPages.get(host).add(pagePath);
  }

  const total = urls.length;
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const pagePath = new URL(url).pathname + new URL(url).search;

    if (/\.pdf$/i.test(url)) {
      byPage.push({ url, path: pagePath, skipped: 'PDF — not scanned' });
      continue;
    }

    const page = await context.newPage();
    const networkByHost = attachNetworkCollector(page, isThirdPartyHost);
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
      const { thirdParty, patterns, binPaths } = extractFromHtml(html, ctx);
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
      binArr.forEach((b) => addIntegration(integrationLabel(b, ctx), pagePath));

      const networkSamples = Object.fromEntries(
        [...networkByHost.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([h, paths]) => [h, [...paths].sort()])
      );

      byPage.push({
        url,
        path: pagePath,
        finalUrl: page.url(),
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
      let finalUrl = url;
      try {
        finalUrl = page.url();
      } catch {
        /* ignore */
      }
      byPage.push({
        url,
        path: pagePath,
        error,
        finalUrl,
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
  const out = {
    generated,
    sourceFile: 'urls-all.json',
    urlMode: 'flat',
    site: HOST,
    method:
      'Playwright Chromium (en-US): DOMContentLoaded → dismiss cookie/consent if found → wait → HTML + network',
    note: 'Consent: OneTrust / Cookiebot + US-style labels (extend scan in tools/backend-linkages if needed).',
    totalUrls: urls.length,
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

  return { report: out, hostSeenOnPages };
}

export function renderPlaywrightMarkdown(report, ctx) {
  const { POST_HCP_REPORT_TITLE, SITE_LABEL } = ctx;
  const POST_MS = POST_CLICK_MS;
  let md = `# ${POST_HCP_REPORT_TITLE}\n\n`;
  md += `Generated: ${report.generated}\n\n`;
  md += `${SITE_LABEL}. Each URL was opened in headless Chromium; **cookie/consent** controls were clicked when found, then **${POST_MS}ms** wait for tags.\n\n`;
  md += `**URL source:** \`${report.sourceFile}\` (**${report.urlMode}**).\n\n`;
  md += 'See **integrations-vendors-and-proof.md** and **third-party-integrations-reference.md**.\n\n';
  md += `## Unique integration keys\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of report.uniqueIntegrations) {
    const paths =
      row.pages.length > 8
        ? `${row.pages.slice(0, 6).join(', ')} … +${row.pages.length - 6} more`
        : row.pages.join(', ');
    md += `| ${row.integration.replace(/\|/g, '\\|')} | ${row.pageCount} | ${paths.replace(/\|/g, '\\|')} |\n`;
  }

  md += `\n## Per-page\n\n`;
  for (const p of report.byPage) {
    md += `### \`${p.path}\`\n- **URL:** ${p.url}\n`;
    if (p.finalUrl && p.finalUrl !== p.url) md += `- **Final URL:** ${p.finalUrl}\n`;
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
  return md;
}
