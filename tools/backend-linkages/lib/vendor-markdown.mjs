/**
 * @param {object} report — backend-linkages-post-hcp-report.json shape
 * @param {ReturnType<import('./context.mjs').createScanContext>} ctx
 * @param {{ INTEGRATION_REFERENCE: object[], matchReferenceEntry: (h: string) => object | null }} catalog
 */
export function buildIntegrationsVendorsMd(report, ctx, catalog) {
  const { HOST, SITE_LABEL, isOrgRoutingHost } = ctx;
  const { INTEGRATION_REFERENCE, matchReferenceEntry } = catalog;

  const SKIP_CATALOG_IDS = new Set(['first-party-note', 'same-site-subdomain']);

  const hostToPaths = new Map();
  const hostToHtmlUrls = new Map();

  for (const p of report.byPage || []) {
    if (p.networkSamplePaths && typeof p.networkSamplePaths === 'object') {
      Object.entries(p.networkSamplePaths).forEach(([host, paths]) => {
        if (isOrgRoutingHost(host)) return;
        if (!hostToPaths.has(host)) hostToPaths.set(host, new Set());
        paths.forEach((path) => hostToPaths.get(host).add(path));
      });
    }
    if (Array.isArray(p.htmlThirdPartyUrls)) {
      p.htmlThirdPartyUrls.forEach((url) => {
        try {
          const u = new URL(url);
          if (isOrgRoutingHost(u.hostname)) return;
          if (!hostToHtmlUrls.has(u.hostname)) hostToHtmlUrls.set(u.hostname, new Set());
          hostToHtmlUrls.get(u.hostname).add(url.split('#')[0].split('?')[0]);
        } catch {
          /* ignore */
        }
      });
    }
  }

  const allVendorHosts = new Set([...hostToPaths.keys(), ...hostToHtmlUrls.keys()]);
  const catalogHosts = new Map();

  allVendorHosts.forEach((host) => {
    const entry = matchReferenceEntry(host);
    if (entry && !SKIP_CATALOG_IDS.has(entry.id)) {
      if (!catalogHosts.has(entry.id)) catalogHosts.set(entry.id, new Set());
      catalogHosts.get(entry.id).add(host);
    }
  });

  const unmatchedHosts = [...allVendorHosts]
    .filter((h) => {
      const e = matchReferenceEntry(h);
      return !e || SKIP_CATALOG_IDS.has(e.id);
    })
    .sort();

  function pathToExampleUrl(host, path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    if (p.includes('…')) {
      return `https://${host}${p}`;
    }
    return `https://${host}${p}`;
  }

  let md = `# ${SITE_LABEL} — third-party vendor integrations (with proof)\n\n`;
  md += `Generated from post–consent scan: **${report.generated}** (\`backend-linkages-post-hcp-report.json\`).\n\n`;
  md += `## What counts as an integration here\n\n`;
  md += `- **Included:** External vendor hostnames from **network** or **HTML** after cookie/consent dismissal.\n`;
  md += `- **Excluded:** **\`${HOST}\`** and **\`*.${HOST}\`** (same-site default in this tool).\n`;
  md += `- **First-party:** **\`https://${HOST}/\`**.\n\n`;
  md += `---\n\n`;

  function proofBlockForHosts(hostnames) {
    const lines = [];
    const sorted = [...hostnames].sort();
    lines.push(`**Observed hostnames:** ${sorted.map((h) => `\`${h}\``).join(', ')}\n`);
    lines.push('**Proof (representative URLs — from crawl):**\n');
    const proofs = new Set();
    sorted.forEach((host) => {
      const paths = hostToPaths.get(host);
      if (paths) {
        [...paths].slice(0, 4).forEach((path) => {
          proofs.add(pathToExampleUrl(host, path));
        });
      }
      const htmlU = hostToHtmlUrls.get(host);
      if (htmlU) {
        [...htmlU].slice(0, 3).forEach((u) => proofs.add(u));
      }
    });
    if (proofs.size === 0) {
      lines.push('- *(no sample path in JSON)*');
    } else {
      const deduped = [...proofs].filter((u, i, arr) => {
        const key = u.replace(/\?….*$/, '').replace(/\?+$/, '');
        return arr.findIndex((x) => x.replace(/\?….*$/, '').replace(/\?+$/, '') === key) === i;
      });
      deduped.slice(0, 10).forEach((u) => {
        lines.push(`- ${u}`);
      });
      if (deduped.length > 10) {
        lines.push(`- *(+ ${deduped.length - 10} more omitted)*`);
      }
    }
    return `${lines.join('\n')}\n\n`;
  }

  for (const entry of INTEGRATION_REFERENCE) {
    if (SKIP_CATALOG_IDS.has(entry.id)) continue;
    const hosts = catalogHosts.get(entry.id);
    if (!hosts || hosts.size === 0) continue;

    md += `## ${entry.title}\n\n`;
    md += `- **Vendor:** ${entry.vendor}\n`;
    md += `- **Role:** ${entry.category}\n\n`;
    md += `### Details\n\n`;
    const configLines = Array.isArray(entry.configuration)
      ? entry.configuration
      : [entry.configuration];
    configLines.forEach((line) => {
      md += `- ${line}\n`;
    });
    md += `\n### Why this is a third-party integration\n\n${entry.whyThirdParty}\n\n`;
    md += `### Proof\n\n`;
    md += proofBlockForHosts(hosts);
    md += `---\n\n`;
  }

  if (unmatchedHosts.length) {
    md += `## Additional vendor endpoints\n\n`;
    md += `| Host | Proof (example) |\n|------|-----------------|\n`;
    unmatchedHosts.forEach((host) => {
      const paths = hostToPaths.get(host);
      const htmlU = hostToHtmlUrls.get(host);
      let example = '';
      if (paths && paths.size) {
        example = pathToExampleUrl(host, [...paths][0]);
      } else if (htmlU && htmlU.size) {
        example = [...htmlU][0];
      } else {
        example = '—';
      }
      md += `| \`${host}\` | ${String(example).replace(/\|/g, '\\|')} |\n`;
    });
    md += '\n';
  }

  return md;
}
