#!/usr/bin/env node

/*
 * validate-nav-content.js
 *
 * Deterministic validation of nav.plain.html against phase-2/phase-3 requirements.
 * This script is MANDATORY — the orchestrator MUST run it after writing nav content
 * and MUST NOT proceed if it exits non-zero.
 *
 * Only supports: content/nav.plain.html (HTML). nav.md is not supported.
 * Extracts image paths from: <img src="path"> and ![alt](path).
 *
 * Usage:
 *   node scripts/validate-nav-content.js <nav-file> <validation-dir>
 *
 * Example:
 *   node scripts/validate-nav-content.js content/nav.plain.html blocks/header/navigation-validation
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = validation failures (images missing, wrong location, empty/broken files size=0, etc.)
 *   2 = usage error (missing arguments, files not found)
 *
 * Image checks: existence + size > 0 (empty downloads cause broken images; common with logo/flags).
 */

import fs from 'fs';
import path from 'path';

function debugLog(validationDir, level, msg) {
  const ts = new Date().toISOString();
  const prefix = { ERROR: '❌', PASS: '✅', BLOCK: '🚫', START: '🔵', END: '🏁' }[level] || 'ℹ️';
  const entry = `[${ts}] ${prefix} [SCRIPT:validate-nav-content] [${level}] ${msg}\n`;
  try {
    const logPath = path.join(validationDir, 'debug.log');
    if (fs.existsSync(validationDir)) fs.appendFileSync(logPath, entry);
  } catch (_) { /* ignore */ }
}

const IMAGE_PATTERN = /!\[.*?\]\(.*?\)/g;
const IMG_TAG_PATTERN = /<img\s[^>]*src=["']([^"']+)["']/gi;
const MEDIA_REF_PATTERN = /media_[a-f0-9]+/gi;
const IMG_EXT_PATTERN = /\.(png|jpg|jpeg|svg|webp|gif)/gi;

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function countImageReferences(content) {
  const mdImages = (content.match(IMAGE_PATTERN) || []).length;
  const htmlImages = (content.match(IMG_TAG_PATTERN) || []).length;
  const mediaRefs = (content.match(MEDIA_REF_PATTERN) || []).length;
  const extRefs = new Set((content.match(IMG_EXT_PATTERN) || []).map(e => e.toLowerCase()));
  return { mdImages, htmlImages, mediaRefs, uniqueExtensions: extRefs.size, total: mdImages + htmlImages + mediaRefs };
}

/** Extract image paths from HTML <img src="path"> and markdown ![alt](path). */
function extractImagePaths(content) {
  const paths = [];
  let m;
  const mdPattern = /!\[.*?\]\(([^)]+)\)/g;
  while ((m = mdPattern.exec(content)) !== null) {
    paths.push(m[1].trim());
  }
  const htmlPattern = /<img\s[^>]*src=["']([^"']+)["']/gi;
  while ((m = htmlPattern.exec(content)) !== null) {
    paths.push(m[1].trim());
  }
  return paths;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node validate-nav-content.js <nav-file> <validation-dir>');
    console.error('Example: node validate-nav-content.js content/nav.plain.html blocks/header/navigation-validation');
    process.exit(2);
  }

  const navFile = args[0];
  const validationDir = args[1];

  debugLog(validationDir, 'START', `validate-nav-content.js invoked — navFile=${navFile}, validationDir=${validationDir}`);

  // --- Check nav file exists ---
  if (!fs.existsSync(navFile)) {
    console.error(`FAIL: nav file not found: ${navFile}`);
    console.error('Nav file must exist at content/nav.plain.html before validation.');
    process.exit(1);
  }

  const navBasename = path.basename(navFile);
  if (navBasename === 'nav.md' || navBasename === 'nav.html') {
    console.error(`FAIL: ${navBasename} is not supported. Use content/nav.plain.html. header.js fetches /nav.plain.html.`);
    process.exit(1);
  }

  // --- Check location ---
  const parentDir = path.basename(path.dirname(path.resolve(navFile)));
  if (parentDir !== 'content') {
    console.error(`FAIL: nav file is in "${parentDir}/" — must be in "content/"`);
    console.error(`Move ${navFile} to content/`);
    process.exit(1);
  }

  // --- Load phase files ---
  const p2Path = path.join(validationDir, 'phase-2-row-mapping.json');
  const p3Path = path.join(validationDir, 'phase-3-megamenu.json');
  const p4Path = path.join(validationDir, 'phase-4-mobile.json');

  if (!fs.existsSync(p2Path)) {
    console.error(`FAIL: phase-2-row-mapping.json not found at ${p2Path}`);
    console.error('Phase 2 must complete before validating nav content.');
    process.exit(2);
  }

  const p2 = loadJson(p2Path);
  const p3 = loadJson(p3Path);
  const p4 = fs.existsSync(p4Path) ? loadJson(p4Path) : null;

  // --- Collect hasImages requirements ---
  const imageRequirements = [];

  if (p2 && p2.rows) {
    for (const row of p2.rows) {
      if (row.hasImages) {
        imageRequirements.push({
          source: 'phase-2',
          element: `Row ${row.index ?? '?'}`,
          description: 'Logo, icons, or thumbnails in this row'
        });
      }
    }
  }

  if (p3) {
    if (p3.hasImages) {
      imageRequirements.push({
        source: 'phase-3',
        element: 'Megamenu (overall)',
        description: 'Vehicle thumbnails, promotional banners, image cards in megamenu'
      });
    }
    if (p3.columns) {
      for (const col of p3.columns) {
        if (col.hasImages) {
          imageRequirements.push({
            source: 'phase-3',
            element: `Megamenu column ${col.columnIndex ?? '?'}`,
            description: `Images in megamenu column ${col.columnIndex ?? '?'}`
          });
        }
      }
    }
  }

  // --- Collect locale selector flag requirements (content must be in nav file, NOT in header.js) ---
  let localeFlagCountRequired = 0;
  const localeFlagRequirements = [];

  function addLocaleFlagReq(source, element, count) {
    const n = Math.max(1, count || 0);
    localeFlagCountRequired = Math.max(localeFlagCountRequired, n);
    localeFlagRequirements.push({ source, element, required: n });
  }

  if (p2 && p2.rows) {
    for (const row of p2.rows) {
      if (row.hasLocaleSelector && row.localeSelectorDetails && row.localeSelectorDetails.hasFlags === true) {
        const n = row.localeSelectorDetails.flagCount ?? row.localeSelectorDetails.entryCount ?? 1;
        addLocaleFlagReq('phase-2', `Row ${row.index} locale selector`, n);
      }
    }
  }
  if (p3 && p3.hasLocaleSelector && p3.localeSelectorDetails && p3.localeSelectorDetails.hasFlags === true) {
    const n = p3.localeSelectorDetails.flagCount ?? p3.localeSelectorDetails.entryCount ?? 1;
    addLocaleFlagReq('phase-3', 'Megamenu locale selector', n);
  }
  if (p4 && p4.hasLocaleSelector && p4.localeSelectorDetails && p4.localeSelectorDetails.hasFlags === true) {
    const n = p4.localeSelectorDetails.flagCount ?? p4.localeSelectorDetails.entryCount ?? 1;
    addLocaleFlagReq('phase-4', 'Mobile locale selector', n);
  }

  function countFlagImageReferences(content) {
    const paths = extractImagePaths(content);
    const flagLike = paths.filter(p => /flag|country|locale|lang/i.test(p));
    return flagLike.length;
  }

  // --- Read nav content (once) ---
  const navContent = fs.readFileSync(navFile, 'utf-8');
  const imgCounts = countImageReferences(navContent);
  const imgPaths = extractImagePaths(navContent);
  const flagRefsInNav = countFlagImageReferences(navContent);

  // --- Report ---
  console.log('=== Nav Content Validation ===');
  console.log(`File: ${navFile}`);
  console.log(`Content length: ${navContent.length} chars, ${navContent.split('\n').length} lines`);
  console.log(`Image requirements from phases: ${imageRequirements.length} element(s) with hasImages=true`);
  if (localeFlagRequirements.length > 0) {
    console.log(`Locale selector (flags): ${localeFlagCountRequired} country/flag entries required — content (names + flag images) MUST be in nav file, header.js only reads from nav DOM.`);
    for (const req of localeFlagRequirements) {
      console.log(`  - [${req.source}] ${req.element}: at least ${req.required} flag/country entry(ies) in nav`);
    }
  }
  console.log(`Image references found in nav: ${imgCounts.total} (md: ${imgCounts.mdImages}, html: ${imgCounts.htmlImages}, media: ${imgCounts.mediaRefs})`);
  if (localeFlagRequirements.length > 0) {
    console.log(`Flag/locale image references in nav: ${flagRefsInNav} (must be >= ${localeFlagCountRequired})`);
  }

  if (imageRequirements.length > 0) {
    console.log('\nRequired images:');
    for (const req of imageRequirements) {
      console.log(`  - [${req.source}] ${req.element}: ${req.description}`);
    }
  }

  if (imgPaths.length > 0) {
    console.log('\nImage paths found in nav:');
    for (const p of imgPaths) {
      console.log(`  - ${p}`);
    }
  }

  // --- Validation ---
  const failures = [];

  if (imageRequirements.length > 0 && imgPaths.length === 0) {
    failures.push(
      `CRITICAL: ${imageRequirements.length} element(s) require images but nav file has ZERO image references.\n` +
      '  Use <img src="images/filename.ext" alt="..."> in nav.plain.html.\n' +
      '  You MUST:\n' +
      '    1. Visit the source URL for each hasImages element\n' +
      '    2. Download every image (logo, icons, thumbnails, vehicle cards, banners) to content/images/\n' +
      '    3. Reference each in the nav file (markdown or HTML syntax)\n' +
      '    4. header.js must READ image paths from the nav DOM — never hardcode or use custom formats\n' +
      '    5. Re-run this script to verify'
    );
  }

  if (imageRequirements.length > 0 && imgCounts.total > 0 && imgPaths.length === 0) {
    failures.push(
      'CRITICAL: Images found in nav file but NOT in supported format.\n' +
      '  Use ![alt](images/filename.ext) (markdown) or <img src="images/filename.ext" alt="..."> (HTML). No pipe-delimited or custom formats.\n' +
      '  header.js must READ image paths from the nav DOM.'
    );
  }

  if (imageRequirements.length > 0 && imgPaths.length > 0 && imgPaths.length < imageRequirements.length) {
    failures.push(
      `WARNING: Found ${imgPaths.length} image reference(s) but ${imageRequirements.length} element(s) require images.\n` +
      '  Some images may be missing. Verify each hasImages element has its image in the nav file.'
    );
  }

  // Locale selector: country names and flag images MUST be in nav file — header.js must NOT hardcode them
  if (localeFlagCountRequired > 0) {
    if (flagRefsInNav === 0) {
      failures.push(
        'CRITICAL: Locale selector has flags (hasFlags=true) but nav file contains NO flag/country image references.\n' +
        '  Country names and flag images MUST live in the nav file. header.js must only READ this content from the nav DOM and implement behavior (open/close, selection).\n' +
        '  You MUST:\n' +
        '    1. Add a locale section with one entry per country: markdown ![Country](images/flag-xx.svg) or HTML <img src="images/flag-xx.svg" alt="Country">\n' +
        '    2. Download every flag image to content/images/\n' +
        '    3. In header.js: read locale entries from the nav DOM — do NOT hardcode country names or flag URLs in JS.\n' +
        '    4. In header.css: style the layout (e.g. multi-column grid) to match the source.'
      );
    } else if (flagRefsInNav < localeFlagCountRequired) {
      failures.push(
        `Locale selector requires at least ${localeFlagCountRequired} flag/country entries but nav file has only ${flagRefsInNav} flag-like image reference(s). ` +
        'Add all country names and flag image references to the nav file. header.js must read from nav DOM only — no hardcoded countries or flags in JS.'
      );
    }
  }

  // Check image files actually exist on disk and have size > 0 (no broken/empty downloads)
  let validatedOnDisk = 0;
  const localPaths = imgPaths.filter(p => !p.startsWith('http://') && !p.startsWith('https://') && !p.startsWith('//'));
  for (const imgPath of localPaths) {
    // Absolute paths (leading /) resolve to filesystem root — they will NOT find workspace files.
    // Use relative paths like images/filename.ext so path.resolve(dirname(navFile), imgPath) finds content/images/.
    if (imgPath.startsWith('/')) {
      const suggested = imgPath.replace(/^\/+/, '').replace(/^content\/images\//, 'images/');
      failures.push(
        `Image path uses absolute path (leading /) — validation resolves to filesystem root, not workspace: ${imgPath}\n` +
        `  Use relative path instead: <img src="${suggested}" alt="..."> (e.g. images/filename.ext). ` +
        'Browser and validation script both resolve relative to nav file location.'
      );
      continue;
    }
    const resolved = path.resolve(path.dirname(navFile), imgPath);
    let filePath = null;
    if (fs.existsSync(resolved)) {
      filePath = resolved;
    } else {
      const fromRoot = path.resolve(imgPath);
      if (fs.existsSync(fromRoot)) filePath = fromRoot;
    }
    if (!filePath) {
      failures.push(`Image file not found on disk: ${imgPath} (checked ${resolved} and ${path.resolve(imgPath)}). Use relative path like images/filename.ext — no leading /.`);
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      failures.push(
        `Image file is EMPTY (0 bytes) — broken download: ${imgPath}\n` +
        '  Re-download from source. Empty files cause broken images. Common causes: redirect to HTML error page, failed fetch, or placeholder.'
      );
      continue;
    }
    validatedOnDisk++;
  }

  // --- Output result ---
  if (failures.length > 0) {
    console.log('\n=== VALIDATION FAILED ===');
    for (const f of failures) {
      console.error(`\nFAIL: ${f}`);
    }
    console.log(`\n${failures.length} failure(s). Fix ALL before proceeding.`);
    debugLog(validationDir, 'BLOCK', `FAILED — ${failures.length} failure(s): ${failures.map(f => f.split('\n')[0]).join('; ')}`);
    process.exit(1);
  }

  console.log('\n=== VALIDATION PASSED ===');
  console.log(`All ${imageRequirements.length} image requirement(s) satisfied. ${imgCounts.total} image reference(s) in nav.`);
  console.log(`Validated ${validatedOnDisk} image(s) on disk: all exist, all size > 0.`);
  debugLog(validationDir, 'PASS', `PASSED — ${imageRequirements.length} requirement(s), ${imgCounts.total} ref(s), ${validatedOnDisk} on disk (exist + size>0)`);

  // Write marker file so hook can detect this script was run
  try {
    fs.writeFileSync(path.join(validationDir, '.nav-content-validated'), JSON.stringify({ timestamp: new Date().toISOString(), imageCount: imgCounts.total, requirementCount: imageRequirements.length, validatedOnDisk }));
  } catch (_) { /* ignore */ }

  process.exit(0);
}

main();
