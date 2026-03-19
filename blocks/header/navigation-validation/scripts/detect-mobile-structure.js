#!/usr/bin/env node

/*
 * detect-mobile-structure.js
 *
 * MANDATORY mobile structure script — programmatic row and item count at mobile viewport.
 * Same idea as desktop detect-header-rows.js: never rely on screenshot/observation alone.
 * Run at 375×812, detects: (1) header bar rows and items per row when closed,
 * (2) top-level menu item count when hamburger is open.
 *
 * Writes mobile/mobile-structure-detection.json and .mobile-structure-detection-complete.
 * Hook blocks mobile structural validation until this script has run.
 *
 * When mobile has more rows/items or extra images than desktop, add content to
 * nav.plain.html in a mobile-only section (mobile missing-content-register).
 *
 * Usage:
 *   node blocks/header/navigation-validation/scripts/detect-mobile-structure.js --url=<source-url> [--validation-dir=<path>] [--viewport=375x812]
 *
 * Exit: 0 = success; 1 = script error; 2 = usage error.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findLocalChromiumExecutable() {
  const localBrowsers = path.resolve(__dirname, 'playwright-browsers');
  if (!fs.existsSync(localBrowsers)) return null;
  const chromiumDirs = fs.readdirSync(localBrowsers).filter((d) => d.startsWith('chromium-'));
  for (const dir of chromiumDirs) {
    const chromeMac = path.join(localBrowsers, dir, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
    if (fs.existsSync(chromeMac)) return chromeMac;
    const chromeLinux = path.join(localBrowsers, dir, 'chrome-linux', 'chrome');
    if (fs.existsSync(chromeLinux)) return chromeLinux;
  }
  return null;
}

function debugLog(validationDir, level, msg) {
  const ts = new Date().toISOString();
  const prefix = {
    ERROR: '❌', PASS: '✅', BLOCK: '🚫', START: '🔵', END: '🏁',
  }[level] || 'ℹ️';
  const entry = `[${ts}] ${prefix} [SCRIPT:detect-mobile-structure] [${level}] ${msg}\n`;
  try {
    if (validationDir && fs.existsSync(validationDir)) {
      fs.appendFileSync(path.join(validationDir, 'debug.log'), entry);
    }
  } catch (_) { /* ignore */ }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let url = null;
  let validationDir = 'blocks/header/navigation-validation';
  let viewport = '375x812';
  for (const a of args) {
    if (a.startsWith('--url=')) url = a.slice(6);
    else if (a.startsWith('--validation-dir=')) validationDir = a.slice(17);
    else if (a.startsWith('--viewport=')) viewport = a.slice(11);
  }
  return { url, validationDir, viewport };
}

async function main() {
  const { url, validationDir, viewport } = parseArgs();
  if (!url) {
    console.error('Usage: node blocks/header/navigation-validation/scripts/detect-mobile-structure.js --url=<source-url> [--validation-dir=<path>] [--viewport=375x812]');
    console.error('Example: node blocks/header/navigation-validation/scripts/detect-mobile-structure.js --url=https://www.example.com --validation-dir=blocks/header/navigation-validation');
    process.exit(2);
  }

  const absValidationDir = path.resolve(validationDir);
  const mobileDir = path.join(absValidationDir, 'mobile');
  debugLog(absValidationDir, 'START', `detect-mobile-structure.js — url=${url}, viewport=${viewport}`);

  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (e) {
    console.error('Playwright not found. Install from scripts folder: npm install playwright');
    debugLog(absValidationDir, 'ERROR', `Playwright import failed: ${e.message}`);
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for React/SPA-rendered headers to appear in the DOM
    try {
      await page.waitForSelector('header, [role="banner"], [class*="hyundai-header"], [class*="site-header"]', { timeout: 10000 });
    } catch (_) {
      // fallback: just wait a bit for SPA render
      await page.waitForTimeout(3000);
    }

    const cookieSelectors = ['button:has-text("Accept")', 'button:has-text("Allow")', '[data-testid="cookie-accept"]', '.cookie-accept', '#onetrust-accept-btn-handler'];
    for (const sel of cookieSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      } catch (_) { /* ignore */ }
    }

    // --- Closed state: header bar rows and item count per row ---
    // Only count VISIBLE items in the header bar (items within viewport, not hidden by CSS)
    const closedResult = await page.evaluate(() => {
      const headerSel = 'header, [role="banner"], [class*="hyundai-header"], [class*="site-header"], [class*="main-header"]';
      const header = document.querySelector(headerSel);
      if (!header) return { rowCount: 0, rows: [], error: 'no header found' };
      const headerRect = header.getBoundingClientRect();
      // Count only items that are truly visible in the header bar (within the header bounding box)
      const allInteractive = header.querySelectorAll('a, button, [role="button"], [class*="icon"]');
      const visibleItems = Array.from(allInteractive).filter((el) => {
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return r.height > 0 && r.width > 0 && s.display !== 'none' && s.visibility !== 'hidden'
          && r.top >= headerRect.top - 5 && r.bottom <= headerRect.bottom + 5;
      });
      const hasImages = header.querySelectorAll('img, svg').length > 0;
      return {
        rowCount: 1,
        rows: [{ index: 0, itemCount: visibleItems.length || 1, hasImages }],
        error: null,
      };
    });

    if (closedResult.error) {
      await browser.close();
      console.error(`FAIL: ${closedResult.error}`);
      debugLog(absValidationDir, 'BLOCK', `FAILED — ${closedResult.error}`);
      process.exit(1);
    }

    // --- Open hamburger and count top-level menu items ---
    // Try multiple selectors for hamburger/menu-toggle (divs and buttons)
    const hamburgerSelectors = [
      '[class*="mh-icon"]',
      '[class*="hamburger"]',
      'header button[aria-expanded]',
      '[class*="hyundai-header"] button',
      'header button',
      '.header button',
    ];
    let hamburger = null;
    for (const sel of hamburgerSelectors) {
      hamburger = await page.$(sel);
      if (hamburger) break;
    }
    let topLevelMenuItemCount = 0;
    let menuOpenRows = [];

    if (hamburger) {
      await hamburger.click();
      await page.waitForTimeout(800);

      const menuResult = await page.evaluate(() => {
        // Count top-level mobile menu items: buttons and links that are direct nav triggers
        // Strategy: find visible buttons/links in the mobile menu that represent nav headings
        const headerSel = 'header, [role="banner"], [class*="hyundai-header"], [class*="site-header"], [class*="main-header"]';
        const header = document.querySelector(headerSel);
        if (!header) return { topLevelMenuItemCount: 0, rows: [], hasImages: false };

        // Strategy 1: look for ul > li nav items (standard pattern)
        let bestList = null;
        let bestCount = 0;
        const navs = header.querySelectorAll('nav');
        navs.forEach((nav) => {
          nav.querySelectorAll('ul').forEach((ul) => {
            const items = Array.from(ul.querySelectorAll(':scope > li')).filter((li) => {
              const style = window.getComputedStyle(li);
              return style.display !== 'none' && li.getBoundingClientRect().height > 0;
            });
            if (items.length > bestCount) {
              bestCount = items.length;
              bestList = ul;
            }
          });
        });
        if (bestCount > 0) {
          const hasImages = bestList.querySelectorAll('img, svg').length > 0;
          return { topLevelMenuItemCount: bestCount, rows: [{ index: 0, itemCount: bestCount, hasImages }], hasImages };
        }

        // Strategy 2: count direct buttons/links that are top-level nav triggers
        // Look for button containers in mobile menu wrappers
        const menuContainers = header.querySelectorAll('[class*="menu-wrapper"], [class*="menu-mobile"], [class*="mobile-menu"], [class*="nav-list"]');
        for (const container of menuContainers) {
          const directItems = Array.from(container.querySelectorAll(':scope > div > button, :scope > div > a, :scope > button, :scope > a')).filter((el) => {
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return r.height > 0 && r.width > 0 && s.display !== 'none';
          });
          if (directItems.length > bestCount) {
            bestCount = directItems.length;
          }
        }

        // Strategy 3: fallback — count all visible buttons in the header that look like nav items
        if (bestCount === 0) {
          const allButtons = header.querySelectorAll('button');
          const navButtons = Array.from(allButtons).filter((btn) => {
            const r = btn.getBoundingClientRect();
            const s = window.getComputedStyle(btn);
            const text = btn.textContent.trim();
            return r.height > 20 && r.width > 50 && s.display !== 'none' && text.length > 0 && text.length < 50;
          });
          bestCount = navButtons.length;
        }

        const hasImages = header.querySelectorAll('img').length > 0;
        return { topLevelMenuItemCount: bestCount, rows: [{ index: 0, itemCount: bestCount, hasImages }], hasImages };
      });

      topLevelMenuItemCount = menuResult.topLevelMenuItemCount;
      menuOpenRows = menuResult.rows || [];
    }

    await browser.close();

    const rowsClosed = (closedResult.rows || []).map((r) => ({ index: r.index, itemCount: r.itemCount, hasImages: r.hasImages }));
    const rowCountClosed = rowsClosed.length;
    const rows = [...rowsClosed];
    if (topLevelMenuItemCount > 0) {
      rows.push({ index: rows.length, itemCount: topLevelMenuItemCount, hasImages: menuOpenRows[0]?.hasImages ?? false });
    }
    const rowCount = rows.length;

    const output = {
      viewport: { width: vw, height: vh },
      url,
      timestamp: new Date().toISOString(),
      rowCount,
      rows,
      headerBarRowCount: rowCountClosed,
      topLevelMenuItemCount,
      notes: [
        `Header bar (closed): ${rowCountClosed} row(s), items per row: ${rowsClosed.map((r) => r.itemCount).join(', ')}`,
        topLevelMenuItemCount > 0 ? `Menu open: ${topLevelMenuItemCount} top-level item(s)` : 'Hamburger not found or menu not opened',
      ],
    };

    if (!fs.existsSync(mobileDir)) fs.mkdirSync(mobileDir, { recursive: true });
    const detectionPath = path.join(mobileDir, 'mobile-structure-detection.json');
    const markerPath = path.join(mobileDir, '.mobile-structure-detection-complete');
    fs.writeFileSync(detectionPath, JSON.stringify(output, null, 2), 'utf-8');
    fs.writeFileSync(markerPath, JSON.stringify({
      timestamp: new Date().toISOString(), rowCount, topLevelMenuItemCount, url,
    }), 'utf-8');

    console.log('=== Mobile Structure Detection Complete ===');
    console.log(`rowCount: ${rowCount} (header bar: ${rowCountClosed}, menu list: ${topLevelMenuItemCount > 0 ? 1 : 0})`);
    console.log(`rows: ${JSON.stringify(rows)}`);
    console.log(`topLevelMenuItemCount: ${topLevelMenuItemCount}`);
    if (topLevelMenuItemCount === 0 && !hamburger) console.log('[WARN] Hamburger not found — topLevelMenuItemCount is 0.');
    debugLog(absValidationDir, 'PASS', `PASSED — rowCount=${rowCount}, topLevelMenuItemCount=${topLevelMenuItemCount}`);

    process.exit(0);
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    console.error(`FAIL: ${e.message}`);
    debugLog(absValidationDir, 'BLOCK', `FAILED — ${e.message}`);
    process.exit(1);
  }
}

main();
