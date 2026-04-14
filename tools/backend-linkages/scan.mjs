#!/usr/bin/env node
/**
 * URL-driven backend linkages scan (fetch + Playwright) — self-contained under tools/backend-linkages/.
 *
 * CLI:
 *   npm run scan -- --url "https://www.example.com/"
 *   npm run scan -- --url "https://..." --out site-urls/my-run
 *   npm run scan -- --reference-only --out site-urls/my-run
 *
 * Outputs (when Playwright runs): include **third-party-hosts-inventory.md** — full host list without the vendor catalog.
 *
 * Programmatic:
 *   import { runBackendLinkagesScan } from './tools/backend-linkages/scan.mjs';
 *   await runBackendLinkagesScan({ url: 'https://...', outDir: 'site-urls/...' });
 */
import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { createScanContext } from './lib/context.mjs';

export { createScanContext };
import { runFetchScan, renderFetchMarkdown } from './lib/fetch-report.mjs';
import { getIntegrationCatalog } from './lib/integration-catalog.mjs';
import { runPlaywrightScan, renderPlaywrightMarkdown } from './lib/playwright-report.mjs';
import { buildHostInventoryMarkdown } from './lib/host-inventory-markdown.mjs';
import { buildThirdPartyReferenceMd } from './lib/reference-markdown.mjs';
import { buildIntegrationsVendorsMd } from './lib/vendor-markdown.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function slugForUrl(pageUrl) {
  const u = new URL(pageUrl);
  let host = u.hostname.toLowerCase().replace(/^www\./, '');
  host = host.replace(/\./g, '-');
  const pathPart = (u.pathname === '/' ? 'root' : u.pathname)
    .replace(/\/+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/[^a-z0-9-]/gi, '-')
    .slice(0, 48);
  const hash = createHash('sha256').update(pageUrl).digest('hex').slice(0, 10);
  return `${host}-${pathPart}--${hash}`.replace(/-+/g, '-');
}

function parseArgs(argv) {
  const out = {
    url: null,
    outDir: null,
    firstPartyHost: null,
    skipFetch: false,
    skipPlaywright: false,
    referenceOnly: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--url' && argv[i + 1]) {
      out.url = argv[i + 1];
      i += 1;
    } else if (a === '--out' && argv[i + 1]) {
      out.outDir = argv[i + 1];
      i += 1;
    } else if (a === '--first-party-host' && argv[i + 1]) {
      out.firstPartyHost = argv[i + 1].toLowerCase();
      i += 1;
    } else if (a === '--skip-fetch') {
      out.skipFetch = true;
    } else if (a === '--skip-playwright') {
      out.skipPlaywright = true;
    } else if (a === '--reference-only') {
      out.referenceOnly = true;
    }
  }
  return out;
}

function writeUrlsAll(outDir, urls) {
  const payload = {
    'analysis-urls-all': {
      captured: new Date().toISOString(),
      method: 'tools/backend-linkages',
      urls: urls.map((u) => ({ url: u })),
    },
  };
  writeFileSync(join(outDir, 'urls-all.json'), JSON.stringify(payload, null, 2), 'utf8');
}

function writeDeepDive(outDir, ctx) {
  const { HOST, SITE_LABEL } = ctx;
  const md = `# Third-party implementation deep dive — ${HOST}

**Scanned:** \`https://${HOST}/\` (see \`urls-all.json\` for exact URLs)  
**First-party origin:** \`https://${HOST}/\`  
**Companion outputs:** \`backend-linkages-post-hcp-report.json\`, \`integrations-vendors-and-proof.md\`, \`third-party-integrations-reference.md\`

This file is a short placeholder for human-written architecture notes. Enrich manually or extend the scan tool to emit page-specific findings.

**Tool:** \`tools/backend-linkages/scan.mjs\` — **${SITE_LABEL}**
`;
  writeFileSync(join(outDir, 'third-party-implementation-deep-dive.md'), md, 'utf8');
}

/**
 * @param {{
 *   url?: string,
 *   urls?: string[],
 *   outDir: string,
 *   firstPartyHost?: string,
 *   skipFetch?: boolean,
 *   skipPlaywright?: boolean,
 *   referenceOnly?: boolean,
 * }} opts
 */
export async function runBackendLinkagesScan(opts) {
  const {
    outDir,
    firstPartyHost,
    skipFetch = false,
    skipPlaywright = false,
    referenceOnly = false,
  } = opts;
  const urls = opts.urls?.length ? opts.urls : opts.url ? [opts.url] : [];
  if (!outDir) throw new Error('runBackendLinkagesScan: outDir is required');
  if (!referenceOnly && urls.length === 0) throw new Error('runBackendLinkagesScan: pass url or urls');

  mkdirSync(outDir, { recursive: true });

  if (referenceOnly) {
    const report = JSON.parse(readFileSync(join(outDir, 'backend-linkages-post-hcp-report.json'), 'utf8'));
    const seedUrl = report.byPage?.[0]?.url || `https://${report.site}/`;
    const ctxRef = createScanContext(seedUrl, firstPartyHost);
    const catalogRef = getIntegrationCatalog(ctxRef.HOST);
    const hostSeenOnPages = new Map();
    for (const row of report.hostsAggregated || []) {
      hostSeenOnPages.set(row.host, new Set(row.pages));
    }
    const refMd = buildThirdPartyReferenceMd(hostSeenOnPages, report.generated, ctxRef, catalogRef);
    const vendorMd = buildIntegrationsVendorsMd(report, ctxRef, catalogRef);
    const inventoryMd = buildHostInventoryMarkdown(report, ctxRef);
    writeFileSync(join(outDir, 'third-party-integrations-reference.md'), refMd, 'utf8');
    writeFileSync(join(outDir, 'integrations-vendors-and-proof.md'), vendorMd, 'utf8');
    writeFileSync(join(outDir, 'third-party-hosts-inventory.md'), inventoryMd, 'utf8');
    return { outDir, referenceOnly: true };
  }

  const primaryUrl = urls[0];
  const ctx = createScanContext(primaryUrl, firstPartyHost);
  const catalog = getIntegrationCatalog(ctx.HOST);

  writeUrlsAll(outDir, urls);
  writeDeepDive(outDir, ctx);

  if (!skipFetch) {
    const fetchReport = await runFetchScan(urls, ctx);
    writeFileSync(join(outDir, 'backend-linkages-report.json'), JSON.stringify(fetchReport, null, 2), 'utf8');
    writeFileSync(join(outDir, 'backend-linkages-report.md'), renderFetchMarkdown(fetchReport, ctx), 'utf8');
  }

  if (!skipPlaywright) {
    const { report: pwReport, hostSeenOnPages } = await runPlaywrightScan(urls, ctx);
    writeFileSync(join(outDir, 'backend-linkages-post-hcp-report.json'), JSON.stringify(pwReport, null, 2), 'utf8');
    writeFileSync(join(outDir, 'backend-linkages-post-hcp-report.md'), renderPlaywrightMarkdown(pwReport, ctx), 'utf8');
    const refMd = buildThirdPartyReferenceMd(hostSeenOnPages, pwReport.generated, ctx, catalog);
    const vendorMd = buildIntegrationsVendorsMd(pwReport, ctx, catalog);
    const inventoryMd = buildHostInventoryMarkdown(pwReport, ctx);
    writeFileSync(join(outDir, 'third-party-integrations-reference.md'), refMd, 'utf8');
    writeFileSync(join(outDir, 'integrations-vendors-and-proof.md'), vendorMd, 'utf8');
    writeFileSync(join(outDir, 'third-party-hosts-inventory.md'), inventoryMd, 'utf8');
  }

  return { outDir, ctx };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.referenceOnly) {
    if (!args.outDir) {
      console.error('Use --out <dir> with --reference-only (folder must contain backend-linkages-post-hcp-report.json)');
      process.exit(1);
    }
    await runBackendLinkagesScan({
      outDir: args.outDir,
      referenceOnly: true,
    });
    console.log(
      'Regenerated third-party-integrations-reference.md, integrations-vendors-and-proof.md, third-party-hosts-inventory.md in',
      args.outDir
    );
    return;
  }

  if (!args.url) {
    console.error('Usage: node tools/backend-linkages/scan.mjs --url "https://example.com/" [--out dir] [--first-party-host host]');
    process.exit(1);
  }

  const outDir =
    args.outDir || join(process.cwd(), 'site-urls', slugForUrl(args.url));

  await runBackendLinkagesScan({
    url: args.url,
    outDir,
    firstPartyHost: args.firstPartyHost || undefined,
    skipFetch: args.skipFetch,
    skipPlaywright: args.skipPlaywright,
  });

  console.log('Wrote backend linkages bundle to:', outDir);
  const lines = [];
  if (!args.skipFetch) lines.push('  backend-linkages-report.json / .md (fetch)');
  if (!args.skipPlaywright) {
    lines.push('  backend-linkages-post-hcp-report.json / .md (Playwright)');
    lines.push('  third-party-integrations-reference.md');
    lines.push('  integrations-vendors-and-proof.md');
    lines.push('  third-party-hosts-inventory.md (catalog-free host list)');
  }
  lines.push('  urls-all.json', '  third-party-implementation-deep-dive.md');
  console.log(lines.join('\n'));
}

const isMain = path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
