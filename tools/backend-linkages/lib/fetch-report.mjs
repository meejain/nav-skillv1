import { extractFromHtml, hostOf, integrationLabel } from './extract.mjs';

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

/**
 * @param {string[]} urls
 * @param {ReturnType<import('./context.mjs').createScanContext>} ctx
 */
export async function runFetchScan(urls, ctx) {
  const { HOST, SITE_LABEL } = ctx;
  const byPage = [];
  const integrationPages = new Map();

  function addIntegration(key, pagePath) {
    if (!integrationPages.has(key)) integrationPages.set(key, new Set());
    integrationPages.get(key).add(pagePath);
  }

  for (const url of urls) {
    const path = new URL(url).pathname + new URL(url).search;
    if (/\.pdf$/i.test(url)) {
      byPage.push({ url, path, skipped: 'PDF — not scanned' });
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const r = await fetchHtml(url);
    const pathKey = path || '/';
    if (!r.ok || !r.text || !/html/i.test(r.contentType)) {
      byPage.push({
        url,
        path: pathKey,
        liveStatus: r.status || r.error,
        note: !/html/i.test(r.contentType) ? `content-type: ${r.contentType}` : null,
        thirdPartyUrls: [],
        patterns: [],
        binPaths: [],
        finalUrl: r.finalUrl,
      });
      continue;
    }
    const { thirdParty, patterns, binPaths } = extractFromHtml(r.text, ctx);
    const tpArr = [...thirdParty].sort();
    const patArr = [...patterns].sort();
    const binArr = [...binPaths].sort();
    tpArr.forEach((u) => addIntegration(`Third-party URL: ${u}`, pathKey));
    patArr.forEach((p) => addIntegration(p, pathKey));
    binArr.forEach((b) => addIntegration(integrationLabel(b, ctx), pathKey));
    byPage.push({
      url,
      path: pathKey,
      liveStatus: r.status,
      thirdPartyUrls: tpArr,
      patterns: patArr,
      binPaths: binArr,
      finalUrl: r.finalUrl,
    });
  }

  const uniqueIntegrations = [...integrationPages.entries()]
    .map(([integration, pages]) => ({
      integration,
      pageCount: pages.size,
      pages: [...pages].sort(),
    }))
    .sort((a, b) => b.pageCount - a.pageCount || a.integration.localeCompare(b.integration));

  const generated = new Date().toISOString();
  return {
    generated,
    sourceFile: 'urls-all.json',
    site: SITE_LABEL,
    note: 'Fetch-only; no cookie dismissal; runtime tags may be missing.',
    totalUrls: urls.length,
    uniqueIntegrations,
    byPage,
  };
}

export function renderFetchMarkdown(report, ctx) {
  const { SITE_LABEL } = ctx;
  let md = `# ${SITE_LABEL} — backend linkages (HTML fetch)\n\n`;
  md += `Generated: ${report.generated}\n\n`;
  md += `**Source:** \`${report.sourceFile}\` (flat).\n\n`;
  md += `| Integration | # pages | Appears on (path) |\n|-------------|---------|-------------------|\n`;
  for (const row of report.uniqueIntegrations) {
    const paths =
      row.pages.length > 12
        ? `${row.pages.slice(0, 10).join(', ')} … +${row.pages.length - 10} more`
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
    md += `- **Status:** ${p.liveStatus}${p.note ? ` (${p.note})` : ''}\n`;
    if (p.patterns?.length) md += `- **Patterns:** ${p.patterns.join('; ')}\n`;
    if (p.binPaths?.length) md += `- **AEM /bin:** ${p.binPaths.join(', ')}\n`;
    if (p.thirdPartyUrls?.length) md += `- **Third-party URLs:** ${p.thirdPartyUrls.join(', ')}\n`;
    md += '\n';
  }
  return md;
}
