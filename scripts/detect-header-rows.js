#!/usr/bin/env node

/*
 * detect-header-rows.js
 *
 * MANDATORY Phase 1 script — programmatic row detection from live page.
 * Never set rowCount from screenshot alone.
 * This script MUST run before phase-1-row-detection.json.
 *
 * Uses Playwright to navigate, run page.evaluate(),
 * and write phase-1-row-detection.json.
 * Writes .row-detection-complete marker so the gate can enforce.
 *
 * Usage:
 *   node scripts/detect-header-rows.js --url=<source-url>
 *     [--validation-dir=<path>] [--viewport=1440x900]
 *
 * Exit codes:
 *   0 = success, phase-1 written
 *   1 = script error (navigation failed, no header found)
 *   2 = usage error
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
    const chromeLinux = path.join(localBrowsers, dir, 'chrome-linux', 'chrome');
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
  const tag = '[SCRIPT:detect-header-rows]';
  const entry = `[${ts}] ${prefix} ${tag} [${level}] ${msg}\n`;
  try {
    if (fs.existsSync(validationDir)) {
      fs.appendFileSync(path.join(validationDir, 'debug.log'), entry);
    }
  } catch (e) { /* ignore */ } // eslint-disable-line no-unused-vars
}

function parseArgs() {
  const args = process.argv.slice(2);
  let url = null;
  let validationDir = 'blocks/header/navigation-validation';
  let viewport = '1440x900';
  args.forEach((a) => {
    if (a.startsWith('--url=')) url = a.slice(6);
    else if (a.startsWith('--validation-dir=')) {
      validationDir = a.slice(17);
    } else if (a.startsWith('--viewport=')) viewport = a.slice(11);
  });
  return { url, validationDir, viewport };
}

async function dismissCookieBanners(page) {
  const cookieSelectors = [
    'button:has-text("Accept")',
    'button:has-text("Allow")',
    '[data-testid="cookie-accept"]',
    '.cookie-accept',
    '#onetrust-accept-btn-handler',
  ];
  const results = await Promise.all(
    cookieSelectors.map(async (sel) => {
      try {
        const btn = await page.$(sel);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(500);
          return true;
        }
      } catch (e) { /* ignore */ } // eslint-disable-line no-unused-vars
      return false;
    }),
  );
  return results.some(Boolean);
}

async function main() {
  const { url, validationDir, viewport } = parseArgs();
  if (!url) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: node scripts/detect-header-rows.js'
      + ' --url=<source-url> [--validation-dir=<path>]',
    );
    process.exit(2);
  }

  const absValidationDir = path.resolve(validationDir);
  debugLog(
    absValidationDir,
    'START',
    `detect-header-rows.js invoked — url=${url}`,
  );

  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Playwright not found. Install: npm install playwright');
    debugLog(absValidationDir, 'ERROR', `Import failed: ${e.message}`);
    process.exit(2);
  }

  const [vw, vh] = viewport.split('x').map(Number) || [1440, 900];
  const execPath = findLocalChromiumExecutable();
  const launchOpts = { headless: true };
  if (execPath) launchOpts.executablePath = execPath;

  let browser;
  try {
    browser = await chromium.launch(launchOpts);
    const page = await browser.newPage();
    await page.setViewportSize({ width: vw, height: vh });
    await page.goto(url, {
      waitUntil: 'networkidle', timeout: 60000,
    });
    await page.waitForTimeout(3000);

    await dismissCookieBanners(page);

    const result = await page.evaluate(() => {
      const hdr = document.querySelector(
        'header, [role="banner"]',
      )
      || document.querySelector(
        '[class*="header"]:not(script):not(style):not(link)',
      )
      || document.querySelector('nav');
      if (!hdr) return { rowCount: 0, bands: [], error: 'no header found' };
      const hRect = hdr.getBoundingClientRect();
      const headerMeta = {
        tag: hdr.tagName,
        className: hdr.className,
        height: hRect.height,
        top: hRect.top,
        width: hRect.width,
      };
      const allNavs = hdr.querySelectorAll('nav');
      const bands = [];
      allNavs.forEach((nav) => {
        const rect = nav.getBoundingClientRect();
        const style = window.getComputedStyle(nav);
        if (
          rect.height > 0
          && style.display !== 'none'
          && style.visibility !== 'hidden'
        ) {
          bands.push({
            label: nav.getAttribute('aria-label')
              || nav.className || '',
            top: rect.top,
            height: rect.height,
            bg: style.backgroundColor,
          });
        }
      });
      if (bands.length < 2) {
        hdr.querySelectorAll(':scope > div, :scope > nav')
          .forEach((el) => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            if (
              rect.height > 0
              && style.display !== 'none'
              && style.visibility !== 'hidden'
            ) {
              const already = bands.some(
                (b) => Math.abs(b.top - rect.top) < 4,
              );
              if (!already) {
                bands.push({
                  label: el.className || el.tagName,
                  top: rect.top,
                  height: rect.height,
                  bg: style.backgroundColor,
                });
              }
            }
          });
      }
      if (bands.length === 0) {
        const hdrRect = hdr.getBoundingClientRect();
        const hdrStyle = window.getComputedStyle(hdr);
        if (
          hdrRect.height > 0
          && hdrStyle.display !== 'none'
          && hdrStyle.visibility !== 'hidden'
        ) {
          bands.push({
            label: hdr.className || hdr.tagName,
            top: hdrRect.top,
            height: hdrRect.height,
            bg: hdrStyle.backgroundColor,
          });
        }
      }
      bands.sort((a, b) => a.top - b.top);
      return {
        rowCount: bands.length,
        bands,
        headerTag: hdr.tagName,
        headerClass: hdr.className,
        headerMeta,
      };
    });

    const navLandmarks = await page.evaluate(() => {
      const hdr = document.querySelector(
        'header, [role="banner"]',
      )
        || document.querySelector(
          '[class*="header"]:not(script):not(style):not(link)',
        )
        || document.querySelector('nav');
      if (!hdr) return [];
      const navs = hdr.querySelectorAll('nav');
      return Array.from(navs).map((nav) => {
        const rect = nav.getBoundingClientRect();
        const style = window.getComputedStyle(nav);
        return {
          ariaLabel: nav.getAttribute('aria-label') || '',
          top: rect.top,
          height: rect.height,
          width: rect.width,
          bg: style.backgroundColor,
          visible: rect.height > 0 && rect.width > 0,
        };
      }).filter((n) => n.visible);
    });

    let { rowCount } = result;
    if (navLandmarks.length > rowCount) {
      rowCount = navLandmarks.length;
    }

    const headerHeightResult = await page.evaluate(() => {
      const hdr = document.querySelector(
        'header, [role="banner"]',
      )
        || document.querySelector(
          '[class*="header"]:not(script):not(style):not(link)',
        );
      if (hdr) return { height: hdr.getBoundingClientRect().height };
      const navs = document.querySelectorAll('nav');
      if (navs.length === 0) return { height: 0 };
      const parent = navs[0].closest('div');
      return {
        height: parent ? parent.getBoundingClientRect().height : 0,
      };
    });

    const headerHeight = headerHeightResult?.height ?? 0;
    const sumDetected = (result.bands || [])
      .reduce((sum, r) => sum + (r.height || 0), 0);
    let heightMismatch = false;
    if (
      headerHeight > 0
      && sumDetected > 0
      && headerHeight > sumDetected * 1.3
    ) {
      heightMismatch = true;
    }

    await browser.close();

    if (result.error) {
      debugLog(absValidationDir, 'BLOCK', `FAILED — ${result.error}`);
      process.exit(1);
    }

    const notesList = result.bands.length > 0
      ? result.bands.map((b) => {
        const lbl = b.label || 'unnamed';
        const t = Math.round(b.top);
        const h = Math.round(b.height);
        return `Row: ${lbl}, top=${t}px, height=${h}px`;
      })
      : ['No header bands detected'];

    const phase1 = {
      rowCount,
      navLandmarkCount: navLandmarks.length,
      confidence: rowCount > 0 ? 0.95 : 0,
      uncertainty: rowCount === 0,
      notes: notesList,
      ...(heightMismatch && {
        heightMismatch: true,
        headerTotalHeight: Math.round(headerHeight),
        detectedRowsHeight: Math.round(sumDetected),
      }),
    };

    if (!fs.existsSync(absValidationDir)) {
      fs.mkdirSync(absValidationDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(absValidationDir, 'phase-1-row-detection.json'),
      JSON.stringify(phase1, null, 2),
    );
    fs.writeFileSync(
      path.join(absValidationDir, '.row-detection-complete'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        rowCount,
        url,
        navLandmarkCount: navLandmarks.length,
        heightMismatch,
      }),
    );

    debugLog(
      absValidationDir,
      'PASS',
      `PASSED — rowCount=${rowCount}, bands=${result.bands.length}`
        + `, navLandmarks=${navLandmarks.length}`
        + `, heightMismatch=${heightMismatch}`,
    );

    process.exit(0);
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    debugLog(absValidationDir, 'BLOCK', `FAILED — ${e.message}`);
    process.exit(1);
  }
}

main();
