#!/usr/bin/env node

/*
 * detect-mobile-structure.js
 *
 * MANDATORY mobile structure script — programmatic row and
 * item count at mobile viewport.
 * Same idea as desktop detect-header-rows.js: never rely on
 * screenshot/observation alone.
 * Run at 375x812, detects:
 *   (1) header bar rows and items per row when closed,
 *   (2) top-level menu item count when hamburger is open.
 *
 * Writes mobile/mobile-structure-detection.json and
 * .mobile-structure-detection-complete.
 * Hook blocks mobile structural validation until this runs.
 *
 * Usage:
 *   node scripts/detect-mobile-structure.js \
 *     --url=<source-url> \
 *     [--validation-dir=<path>] [--viewport=375x812]
 *
 * Exit: 0 = success; 1 = script error; 2 = usage error.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line no-underscore-dangle
const dirname = path.dirname(fileURLToPath(import.meta.url));

function findLocalChromiumExecutable() {
  const localBrowsers = path.resolve(dirname, 'playwright-browsers');
  if (!fs.existsSync(localBrowsers)) return null;
  const chromiumDirs = fs.readdirSync(localBrowsers)
    .filter((d) => d.startsWith('chromium-'));
  const found = chromiumDirs.reduce((acc, dir) => {
    if (acc) return acc;
    const chromeMac = path.join(
      localBrowsers,
      dir,
      'chrome-mac-arm64',
      'Google Chrome for Testing.app',
      'Contents',
      'MacOS',
      'Google Chrome for Testing',
    );
    if (fs.existsSync(chromeMac)) return chromeMac;
    const chromeLinux = path.join(
      localBrowsers,
      dir,
      'chrome-linux',
      'chrome',
    );
    if (fs.existsSync(chromeLinux)) return chromeLinux;
    return null;
  }, null);
  return found;
}

function debugLog(validationDir, level, msg) {
  const ts = new Date().toISOString();
  const prefix = {
    ERROR: '❌', PASS: '✅', BLOCK: '🚫', START: '🔵', END: '🏁',
  }[level] || 'ℹ️';
  const tag = '[SCRIPT:detect-mobile-structure]';
  const entry = `[${ts}] ${prefix} ${tag} [${level}] ${msg}\n`;
  try {
    if (validationDir && fs.existsSync(validationDir)) {
      fs.appendFileSync(
        path.join(validationDir, 'debug.log'),
        entry,
      );
    }
  } catch (_) { /* ignore */ }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let url = null;
  let validationDir = 'blocks/header/navigation-validation';
  let viewport = '375x812';
  args.forEach((a) => {
    if (a.startsWith('--url=')) url = a.slice(6);
    else if (a.startsWith('--validation-dir=')) {
      validationDir = a.slice(17);
    } else if (a.startsWith('--viewport=')) {
      viewport = a.slice(11);
    }
  });
  return { url, validationDir, viewport };
}

async function dismissCookies(page) {
  try {
    const otBtn = await page.$('#onetrust-accept-btn-handler');
    if (otBtn) {
      await otBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  } catch (_) { /* ignore */ }

  const cookieSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Allow")',
    '[data-testid="cookie-accept"]',
    '.cookie-accept',
  ];
  const clicks = cookieSelectors.map(async (sel) => {
    try {
      const btn = await page.$(sel);
      if (btn) await btn.click({ force: true });
    } catch (_) { /* ignore */ }
  });
  await Promise.all(clicks);
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const ot = document.getElementById('onetrust-consent-sdk');
    if (ot) ot.remove();
    document.querySelectorAll(
      '[class*="onetrust"], [class*="cookie-banner"]',
    ).forEach((el) => el.remove());
  }).catch(() => {});
}

async function main() {
  const { url, validationDir, viewport } = parseArgs();
  if (!url) {
    /* eslint-disable no-console */
    console.error(
      'Usage: node scripts/detect-mobile-structure.js'
      + ' --url=<source-url>'
      + ' [--validation-dir=<path>]'
      + ' [--viewport=375x812]',
    );
    console.error(
      'Example: node scripts/detect-mobile-structure.js'
      + ' --url=https://www.example.com'
      + ' --validation-dir='
      + 'blocks/header/navigation-validation',
    );
    /* eslint-enable no-console */
    process.exit(2);
  }

  const absValidationDir = path.resolve(validationDir);
  const mobileDir = path.join(absValidationDir, 'mobile');
  debugLog(
    absValidationDir,
    'START',
    `detect-mobile-structure.js — url=${url}, viewport=${viewport}`,
  );

  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (e) {
    console.error(
      'Playwright not found. Install: npm install playwright',
    );
    debugLog(
      absValidationDir,
      'ERROR',
      `Playwright import failed: ${e.message}`,
    );
    process.exit(2);
  }

  const [vw, vh] = viewport.split('x').map(Number) || [375, 812];
  const execPath = findLocalChromiumExecutable();
  const launchOpts = { headless: true };
  if (execPath) launchOpts.executablePath = execPath;

  let browser;
  try {
    browser = await chromium.launch(launchOpts);
    const page = await browser.newPage();
    await page.setViewportSize({ width: vw, height: vh });
    await page.goto(
      url,
      { waitUntil: 'networkidle', timeout: 60000 },
    );
    await page.waitForTimeout(3000);
    await dismissCookies(page);

    // --- Closed state: header bar rows and items per row ---
    const closedResult = await page.evaluate(() => {
      const header = document.querySelector(
        'header, [role="banner"]',
      )
        || document.querySelector(
          '[class*="header"]:not(script):not(style):not(link)',
        )
        || document.querySelector('nav');
      if (!header) {
        return { rowCount: 0, rows: [], error: 'no header found' };
      }
      const bands = [];
      const children = header.querySelectorAll(
        ':scope > div, :scope > nav',
      );
      children.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (
          rect.height > 0
          && rect.width > 0
          && style.display !== 'none'
          && style.visibility !== 'hidden'
        ) {
          const count = el.querySelectorAll(
            'a, button, [role="button"]',
          ).length || 1;
          const hasImg = el.querySelectorAll('img, svg').length > 0;
          bands.push({
            index: bands.length,
            itemCount: count,
            hasImages: hasImg,
            top: rect.top,
            height: rect.height,
          });
        }
      });
      if (bands.length === 0) {
        const rect = header.getBoundingClientRect();
        if (rect.height > 0) {
          const count = header.querySelectorAll(
            'a, button, [role="button"]',
          ).length || 1;
          const hasImg = header.querySelectorAll(
            'img, svg',
          ).length > 0;
          bands.push({
            index: 0,
            itemCount: count,
            hasImages: hasImg,
            top: rect.top,
            height: rect.height,
          });
        }
      }
      bands.sort((a, b) => a.top - b.top);
      return {
        rowCount: bands.length,
        rows: bands.map((b) => ({
          index: b.index,
          itemCount: b.itemCount,
          hasImages: b.hasImages,
        })),
        error: null,
      };
    });

    if (closedResult.error) {
      await browser.close();
      console.error(`FAIL: ${closedResult.error}`);
      debugLog(
        absValidationDir,
        'BLOCK',
        `FAILED — ${closedResult.error}`,
      );
      process.exit(1);
    }

    // --- Open hamburger and count top-level menu items ---
    const hamburgerSel = [
      '.header button[aria-label*="nav" i]',
      '.header button[aria-label*="menu" i]',
      '.header button[aria-expanded]',
      '.header [class*="hamburger"]',
      'header button',
      '[class*="hamburger"]',
      'button[aria-label*="nav" i]',
      'button[aria-label*="menu" i]',
    ].join(', ');
    const hamburger = await page.$(hamburgerSel);
    let topLevelMenuItemCount = 0;
    let menuOpenRows = [];

    if (hamburger) {
      await hamburger.click();
      await page.waitForTimeout(600);

      const menuResult = await page.evaluate(() => {
        const hdr = document.querySelector(
          'header, [role="banner"]',
        )
          || document.querySelector(
            '[class*="header"]:not(script):not(style):not(link)',
          )
          || document.querySelector('nav');
        if (!hdr) {
          return {
            topLevelMenuItemCount: 0,
            rows: [],
            hasImages: false,
          };
        }
        const navs = hdr.querySelectorAll('nav');
        let bestList = null;
        let bestCount = 0;
        navs.forEach((nav) => {
          nav.querySelectorAll('ul').forEach((ul) => {
            const items = Array.from(
              ul.querySelectorAll(':scope > li'),
            ).filter((li) => {
              const s = window.getComputedStyle(li);
              return s.display !== 'none'
                && li.getBoundingClientRect().height > 0;
            });
            if (items.length > bestCount) {
              bestCount = items.length;
              bestList = ul;
            }
          });
        });
        const itemCt = bestList
          ? Array.from(
            bestList.querySelectorAll(':scope > li'),
          ).filter((li) => {
            const s = window.getComputedStyle(li);
            return s.display !== 'none'
              && li.getBoundingClientRect().height > 0;
          }).length
          : 0;
        const hasImg = bestList
          ? bestList.querySelectorAll('img, svg').length > 0
          : false;
        return {
          topLevelMenuItemCount: itemCt,
          rows: [{ index: 0, itemCount: itemCt, hasImages: hasImg }],
          hasImages: hasImg,
        };
      });

      topLevelMenuItemCount = menuResult.topLevelMenuItemCount;
      menuOpenRows = menuResult.rows || [];
    }

    await browser.close();

    const rowsClosed = (closedResult.rows || []).map((r) => ({
      index: r.index,
      itemCount: r.itemCount,
      hasImages: r.hasImages,
    }));
    const rowCountClosed = rowsClosed.length;
    const rows = [...rowsClosed];
    if (topLevelMenuItemCount > 0) {
      rows.push({
        index: rows.length,
        itemCount: topLevelMenuItemCount,
        hasImages: menuOpenRows[0]?.hasImages ?? false,
      });
    }
    const rowCount = rows.length;

    const closedItems = rowsClosed
      .map((r) => r.itemCount).join(', ');
    const menuNote = topLevelMenuItemCount > 0
      ? `Menu open: ${topLevelMenuItemCount} top-level item(s)`
      : 'Hamburger not found or menu not opened';
    const output = {
      viewport: { width: vw, height: vh },
      url,
      timestamp: new Date().toISOString(),
      rowCount,
      rows,
      headerBarRowCount: rowCountClosed,
      topLevelMenuItemCount,
      notes: [
        `Header bar (closed): ${rowCountClosed} row(s),`
        + ` items per row: ${closedItems}`,
        menuNote,
      ],
    };

    if (!fs.existsSync(mobileDir)) {
      fs.mkdirSync(mobileDir, { recursive: true });
    }
    const detectionPath = path.join(
      mobileDir,
      'mobile-structure-detection.json',
    );
    const markerPath = path.join(
      mobileDir,
      '.mobile-structure-detection-complete',
    );
    fs.writeFileSync(
      detectionPath,
      JSON.stringify(output, null, 2),
      'utf-8',
    );
    fs.writeFileSync(markerPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      rowCount,
      topLevelMenuItemCount,
      url,
    }), 'utf-8');

    console.log('=== Mobile Structure Detection Complete ===');
    console.log(
      `rowCount: ${rowCount}`
      + ` (header bar: ${rowCountClosed},`
      + ` menu list: ${topLevelMenuItemCount > 0 ? 1 : 0})`,
    );
    console.log(`rows: ${JSON.stringify(rows)}`);
    console.log(
      `topLevelMenuItemCount: ${topLevelMenuItemCount}`,
    );
    if (topLevelMenuItemCount === 0 && !hamburger) {
      console.log(
        '[WARN] Hamburger not found — topLevelMenuItemCount is 0.',
      );
    }
    debugLog(
      absValidationDir,
      'PASS',
      `PASSED — rowCount=${rowCount},`
      + ` topLevelMenuItemCount=${topLevelMenuItemCount}`,
    );

    process.exit(0);
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    console.error(`FAIL: ${e.message}`);
    debugLog(
      absValidationDir,
      'BLOCK',
      `FAILED — ${e.message}`,
    );
    process.exit(1);
  }
}

main();
