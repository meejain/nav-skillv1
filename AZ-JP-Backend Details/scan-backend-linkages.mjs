/**
 * Scans urls-all.json for status===200, fetches HTML pages, extracts
 * third-party and notable same-origin backend references from markup/scripts.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  extractFromHtml,
  HOST,
  integrationLabel,
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

async function main() {
  const jsonPath = join(__dirname, 'urls-all.json');
  const urls = loadUrlsFromJson(jsonPath);

  const byPage = [];
  /** @type {Map<string, Set<string>>} integration -> pages */
  const integrationPages = new Map();

  function addIntegration(key, pagePath) {
    if (!integrationPages.has(key)) integrationPages.set(key, new Set());
    integrationPages.get(key).add(pagePath);
  }

  for (const url of urls) {
    const path = new URL(url).pathname + new URL(url).search;
    if (/\.pdf$/i.test(url)) {
      byPage.push({
        url,
        path,
        skipped: 'PDF — not scanned for HTML integrations',
        liveStatus: null,
      });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const r = await fetchHtml(url);
    const pagePath = path || '/';

    if (!r.ok || !r.text || !/html/i.test(r.contentType)) {
      byPage.push({
        url,
        path: pagePath,
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

    tpArr.forEach((u) => addIntegration(`Third-party URL: ${u}`, pagePath));
    patArr.forEach((p) => addIntegration(p, pagePath));
    binArr.forEach((b) => addIntegration(integrationLabel(b), pagePath));

    byPage.push({
      url,
      path: pagePath,
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
    sourceFile: 'urls-all.json',
    note: 'Live fetch with browser UA. Tag-manager-loaded tags after utag.js are not visible in HTML alone.',
    totalUrlsStatus200: urls.length,
    pagesScanned: byPage.filter((p) => !p.skipped && !p.error).length,
    uniqueIntegrations,
    byPage,
  };

  writeFileSync(join(__dirname, 'backend-linkages-report.json'), JSON.stringify(out, null, 2), 'utf8');

  let md = `# MediChannel JP — backend & third-party linkages\n\n`;
  md += `Generated: ${out.generated}\n\n`;
  md += `URLs with \`status: 200\` in \`urls-all.json\`: **${urls.length}** (PDFs listed but not HTML-scanned).\n\n`;
  md += `## Unique integrations (sorted by how many pages reference them)\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of uniqueIntegrations) {
    const paths =
      row.pages.length > 12
        ? `${row.pages.slice(0, 10).join(', ')} … +${row.pages.length - 10} more`
        : row.pages.join(', ');
    md += `| ${row.integration.replace(/\|/g, '\\|')} | ${row.pageCount} | ${paths.replace(/\|/g, '\\|')} |\n`;
  }
  md += `\n## Per-page detail\n\n`;
  for (const p of byPage) {
    md += `### \`${p.path}\`\n`;
    md += `- **URL:** ${p.url}\n`;
    if (p.skipped) {
      md += `- ${p.skipped}\n\n`;
      continue;
    }
    md += `- **Live fetch:** ${p.liveStatus}${p.note ? ` (${p.note})` : ''}\n`;
    if (p.patterns?.length) md += `- **Patterns:** ${p.patterns.join('; ')}\n`;
    if (p.binPaths?.length) md += `- **AEM /bin:** ${p.binPaths.join(', ')}\n`;
    if (p.thirdPartyUrls?.length) md += `- **Third-party URLs:** ${p.thirdPartyUrls.join(', ')}\n`;
    else if (!p.patterns?.length && !p.binPaths?.length) md += `- *(no external or /bin references detected in HTML)*\n`;
    md += '\n';
  }

  writeFileSync(join(__dirname, 'backend-linkages-report.md'), md, 'utf8');
  console.log('Wrote backend-linkages-report.json and backend-linkages-report.md');
  console.log('URLs:', urls.length, 'Unique integration keys:', uniqueIntegrations.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
