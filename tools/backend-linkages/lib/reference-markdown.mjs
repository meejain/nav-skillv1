/**
 * @param {Map<string, Set<string>>} hostSeenOnPages
 * @param {string} generated
 * @param {ReturnType<import('./context.mjs').createScanContext>} ctx
 * @param {{ INTEGRATION_REFERENCE: object[], matchReferenceEntry: (h: string) => object | null }} catalog
 */
export function buildThirdPartyReferenceMd(hostSeenOnPages, generated, ctx, catalog) {
  const { REFERENCE_DOC_TITLE, SITE_LABEL, HOST } = ctx;
  const { INTEGRATION_REFERENCE, matchReferenceEntry } = catalog;

  let ref = `# ${REFERENCE_DOC_TITLE}\n\n`;
  ref += `Generated: ${generated}\n\n`;
  ref += `**Site:** ${SITE_LABEL}\n\n`;
  ref += `**First-party origin:** \`https://${HOST}/\`\n\n`;
  ref += `**Scan:** Post–consent Playwright crawl — \`backend-linkages-post-hcp-report.json\`.\n\n`;
  ref += 'Regenerate: `node tools/backend-linkages/scan.mjs --url …` (or `--reference-only` with existing JSON).\n\n';
  ref += `**Catalog vs discovery:** The sections below group hosts by an **optional vendor catalog** (for readable narrative). **Discovery is not limited to that list** — every third-party hostname also appears in \`third-party-hosts-inventory.md\` (catalog-free).\n\n`;
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
    ref += `\n### Typical data flows\n\n${entry.dataFlows}\n\n`;

    const matchedHosts = [...hostSeenOnPages.keys()].filter((h) => {
      try {
        return entry.matchHost(h);
      } catch {
        return false;
      }
    });
    ref += `### Observed (this crawl)\n\n`;
    if (entry.id === 'first-party-note') {
      ref += `Narrative only; no separate vendor hostname.\n\n`;
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
      ref += `### \`${h}\`\n- **Loads:** ${hostSeenOnPages.get(h)?.size || 0}\n\n`;
    });
  }

  return ref;
}
