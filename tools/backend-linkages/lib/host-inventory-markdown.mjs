/**
 * Complete third-party hostname inventory from Playwright JSON only.
 * No vendor catalog — every host in hostsAggregated + any extra from byPage HTML URLs.
 * @param {object} report
 * @param {ReturnType<import('./context.mjs').createScanContext>} ctx
 */
export function buildHostInventoryMarkdown(report, ctx) {
  const { SITE_LABEL, HOST } = ctx;
  const generated = report.generated || new Date().toISOString();

  /** @type {Map<string, Set<string>>} */
  const hostToPaths = new Map();
  /** @type {Map<string, string>} */
  const hostToExampleUrl = new Map();

  for (const p of report.byPage || []) {
    if (p.networkSamplePaths && typeof p.networkSamplePaths === 'object') {
      Object.entries(p.networkSamplePaths).forEach(([host, paths]) => {
        const list = Array.isArray(paths) ? paths : [];
        if (!hostToPaths.has(host)) hostToPaths.set(host, new Set());
        list.forEach((path) => hostToPaths.get(host).add(path));
      });
    }
    if (Array.isArray(p.htmlThirdPartyUrls)) {
      p.htmlThirdPartyUrls.forEach((url) => {
        try {
          const u = new URL(url);
          const h = u.hostname.toLowerCase();
          const base = url.split('#')[0].split('?')[0];
          if (!hostToExampleUrl.has(h)) hostToExampleUrl.set(h, base);
        } catch {
          /* ignore */
        }
      });
    }
  }

  const fromAgg = report.hostsAggregated || [];
  const allHosts = new Set(fromAgg.map((r) => r.host));
  hostToExampleUrl.forEach((_, h) => allHosts.add(h));

  const sorted = [...allHosts].sort((a, b) => a.localeCompare(b));

  let md = `# Third-party hosts — complete inventory (catalog-free)\n\n`;
  md += `**Scanned first-party:** \`${HOST}\`  \n`;
  md += `**Site label:** ${SITE_LABEL}  \n`;
  md += `**Generated:** ${generated}  \n`;
  md += `**Source:** \`backend-linkages-post-hcp-report.json\` (Playwright: HTML + network)\n\n`;
  md += `This document lists **every distinct third-party hostname** the tool recorded. It is **not** filtered or limited by the optional vendor catalog used in \`third-party-integrations-reference.md\`. Any host on the public internet can appear here.\n\n`;
  md += `---\n\n`;
  md += `## Summary\n\n`;
  md += `- **Distinct third-party hosts:** ${sorted.length}\n\n`;
  md += `## Hosts (alphabetical)\n\n`;
  md += `| Host | Example (HTML or network) | Paths observed (sample) |\n`;
  md += `|------|----------------------------|---------------------------|\n`;

  for (const host of sorted) {
    let example = hostToExampleUrl.get(host) || '—';
    const paths = hostToPaths.get(host);
    if (example === '—' && paths && paths.size) {
      const p = [...paths][0] || '/';
      example = `https://${host}${p.startsWith('/') ? '' : '/'}${p}`;
    }
    let pathSample = '—';
    if (paths && paths.size > 0) {
      const arr = [...paths].slice(0, 3).join(', ');
      pathSample = paths.size > 3 ? `${arr} …` : arr;
    }
    md += `| \`${host}\` | ${String(example).replace(/\|/g, '\\|')} | ${String(pathSample).replace(/\|/g, '\\|')} |\n`;
  }

  md += `\n## Per scanned path (from report)\n\n`;
  for (const p of report.byPage || []) {
    if (p.skipped) continue;
    md += `### \`${p.path}\`\n\n`;
    if (p.mergedThirdPartyHosts?.length) {
      md += `- **Merged hosts:** ${p.mergedThirdPartyHosts.map((h) => `\`${h}\``).join(', ')}\n`;
    } else {
      md += '- *(no merged host list)*\n';
    }
    md += '\n';
  }

  return md;
}
