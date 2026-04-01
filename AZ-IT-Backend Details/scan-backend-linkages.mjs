/**
 * HTML-only fetch scan for www.astrazeneca.it (no Playwright).
 * Use `--grouped` to read urls-grouped.json (same order as groups).
 */
import { writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  extractFromHtml,
  integrationLabel,
  loadGroupedUrlEntries,
  loadUrlsFromJson,
} from './backend-scan-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchHtml(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    return { ok: res.ok, status: res.status, contentType: ct, text, finalUrl: res.url };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e), text: '', finalUrl: url };
  } finally {
    clearTimeout(t);
  }
}

function resolveScanTargets() {
  const grouped =
    process.argv.includes('--grouped') || process.env.SCAN_GROUPED === '1' || process.env.SCAN_GROUPED === 'true';
  const customJson = process.env.SCAN_URLS_JSON;
  if (grouped) {
    const jsonPath = join(__dirname, customJson || 'urls-grouped.json');
    return {
      targets: loadGroupedUrlEntries(jsonPath),
      sourceFile: basename(jsonPath),
      urlMode: 'grouped',
    };
  }
  const jsonPath = join(__dirname, customJson || 'urls-all.json');
  return {
    targets: loadUrlsFromJson(jsonPath).map((url) => ({
      url,
      urlGroup: null,
      groupConfidence: null,
    })),
    sourceFile: basename(jsonPath),
    urlMode: 'flat',
  };
}

async function main() {
  const { targets, sourceFile, urlMode } = resolveScanTargets();
  const byPage = [];
  const integrationPages = new Map();

  function addIntegration(key, pagePath) {
    if (!integrationPages.has(key)) integrationPages.set(key, new Set());
    integrationPages.get(key).add(pagePath);
  }

  for (const { url, urlGroup, groupConfidence } of targets) {
    const pagePath = new URL(url).pathname + new URL(url).search;
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
    // eslint-disable-next-line no-await-in-loop
    const r = await fetchHtml(url);
    const pathKey = pagePath || '/';
    if (!r.ok || !r.text || !/html/i.test(r.contentType)) {
      byPage.push({
        url,
        path: pathKey,
        urlGroup,
        groupConfidence,
        liveStatus: r.status || r.error,
        note: !/html/i.test(r.contentType) ? `content-type: ${r.contentType}` : null,
        thirdPartyUrls: [],
        patterns: [],
        binPaths: [],
      });
      continue;
    }
    const { thirdParty, patterns, binPaths } = extractFromHtml(r.text);
    const tpArr = [...thirdParty].sort();
    const patArr = [...patterns].sort();
    const binArr = [...binPaths].sort();
    tpArr.forEach((u) => addIntegration(`Third-party URL: ${u}`, pathKey));
    patArr.forEach((p) => addIntegration(p, pathKey));
    binArr.forEach((b) => addIntegration(integrationLabel(b), pathKey));
    byPage.push({
      url,
      path: pathKey,
      urlGroup,
      groupConfidence,
      liveStatus: r.status,
      thirdPartyUrls: tpArr,
      patterns: patArr,
      binPaths: binArr,
    });
  }

  const uniqueIntegrations = [...integrationPages.entries()]
    .map(([integration, pages]) => ({
      integration,
      pageCount: pages.size,
      pages: [...pages].sort(),
    }))
    .sort((a, b) => b.pageCount - a.pageCount || a.integration.localeCompare(b.integration));

  const out = {
    generated: new Date().toISOString(),
    sourceFile,
    urlMode,
    site: 'www.astrazeneca.it',
    note: 'Fetch-only; runtime tags after consent not visible.',
    totalUrls: targets.length,
    uniqueIntegrations,
    byPage,
  };

  writeFileSync(join(__dirname, 'backend-linkages-report.json'), JSON.stringify(out, null, 2), 'utf8');

  let md = `# AstraZeneca Italy — backend linkages (HTML fetch)\n\n`;
  md += `Generated: ${out.generated}\n\n`;
  md += `**Source:** \`${sourceFile}\` (**${urlMode}**).\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of uniqueIntegrations) {
    const paths =
      row.pages.length > 12
        ? `${row.pages.slice(0, 10).join(', ')} … +${row.pages.length - 10} more`
        : row.pages.join(', ');
    md += `| ${row.integration.replace(/\|/g, '\\|')} | ${row.pageCount} | ${paths.replace(/\|/g, '\\|')} |\n`;
  }
  md += `\n## Per-page\n\n`;
  for (const p of byPage) {
    md += `### \`${p.path}\`\n- **URL:** ${p.url}\n`;
    if (p.urlGroup != null) {
      md += `- **Group:** \`${p.urlGroup}\`${p.groupConfidence ? ` (${p.groupConfidence})` : ''}\n`;
    }
    if (p.skipped) {
      md += `- ${p.skipped}\n\n`;
      continue;
    }
    md += `- **Status:** ${p.liveStatus}${p.note ? ` (${p.note})` : ''}\n`;
    if (p.patterns?.length) md += `- **Patterns:** ${p.patterns.join('; ')}\n`;
    if (p.binPaths?.length) md += `- **AEM /bin:** ${p.binPaths.join(', ')}\n`;
    if (p.thirdPartyUrls?.length) md += `- **Third-party URLs:** ${p.thirdPartyUrls.join(', ')}\n`;
    md += '\n';
  }
  writeFileSync(join(__dirname, 'backend-linkages-report.md'), md, 'utf8');
  console.log('Wrote backend-linkages-report.json/.md', sourceFile, urlMode, 'targets:', targets.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
