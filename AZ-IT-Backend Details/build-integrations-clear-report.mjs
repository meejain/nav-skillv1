/**
 * Vendor-only integrations + proof (no page lists). Excludes *.astrazeneca.it / *.astrazeneca.com org routing.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { HOST, isAstraZenecaOrgRoutingHost } from './backend-scan-lib.mjs';
import { INTEGRATION_REFERENCE, matchReferenceEntry } from './integration-reference-catalog.mjs';
import { SITE_LABEL } from './site-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SKIP_CATALOG_IDS = new Set(['az-corporate-other', 'az-digital-governance']);

function pathToExampleUrl(host, path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.includes('…')) {
    return `https://${host}${p}`;
  }
  return `https://${host}${p}`;
}

function main() {
  const reportPath = join(__dirname, 'backend-linkages-post-hcp-report.json');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));

  const hostToPaths = new Map();
  const hostToHtmlUrls = new Map();

  for (const p of report.byPage || []) {
    if (p.networkSamplePaths && typeof p.networkSamplePaths === 'object') {
      Object.entries(p.networkSamplePaths).forEach(([host, paths]) => {
        if (isAstraZenecaOrgRoutingHost(host)) return;
        if (!hostToPaths.has(host)) hostToPaths.set(host, new Set());
        paths.forEach((path) => hostToPaths.get(host).add(path));
      });
    }
    if (Array.isArray(p.htmlThirdPartyUrls)) {
      p.htmlThirdPartyUrls.forEach((url) => {
        try {
          const u = new URL(url);
          if (isAstraZenecaOrgRoutingHost(u.hostname)) return;
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

  let md = `# ${SITE_LABEL} — third-party vendor integrations (with proof)\n\n`;
  md += `Generated from post–banner scan: **${report.generated}** (\`backend-linkages-post-hcp-report.json\`).\n\n`;
  md += `## What counts as an integration here\n\n`;
  md += `- **Included:** External vendor hostnames from **network** or **HTML** after cookie/consent/banner dismissal.\n`;
  md += `- **Excluded:** **\`*.astrazeneca.it\`** and **\`*.astrazeneca.com\`** (other subdomains, PDFs, cross-links — same organisation, not SaaS integrations).\n`;
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
    md += `## Additional vendor / ad-tech endpoints\n\n`;
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

  writeFileSync(join(__dirname, 'integrations-vendors-and-proof.md'), md, 'utf8');
  console.log('Wrote integrations-vendors-and-proof.md');
  console.log('Catalog sections:', catalogHosts.size, 'Unmatched:', unmatchedHosts.length);
}

main();
