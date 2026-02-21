/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Hyundai Brazil website cleanup
 * Purpose: Remove site-wide non-content elements (header, footer, cookie consent, loading, tracking)
 * Applies to: www.hyundai.com.br (all templates)
 * Tested: / (homepage)
 * Generated: 2026-02-21
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration workflow (cleaned.html)
 * - .hyundai-loading (line 4) - loading spinner
 * - .hyundai-header (line 19) - site header/navigation
 * - .hyundai-footer (line 8346) - site footer
 * - #onetrust-consent-sdk (line 8963) - OneTrust cookie consent banner
 * - .onetrust-pc-dark-filter (line 8964) - OneTrust overlay
 * - iframe with demdex.net (line 8959) - Adobe tracking iframe
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove loading spinner
    // EXTRACTED: Found <div class="hyundai-loading"> in captured DOM (line 4)
    WebImporter.DOMUtils.remove(element, ['.hyundai-loading']);

    // Remove header/navigation (handled by dedicated nav skill)
    // EXTRACTED: Found <div class="hyundai-header"> in captured DOM (line 19)
    WebImporter.DOMUtils.remove(element, ['.hyundai-header']);

    // Remove footer (handled by dedicated footer skill)
    // EXTRACTED: Found <div class="hyundai-footer"> in captured DOM (line 8346)
    WebImporter.DOMUtils.remove(element, ['.hyundai-footer']);

    // Remove OneTrust cookie consent banner
    // EXTRACTED: Found <div id="onetrust-consent-sdk"> in captured DOM (line 8963)
    // Contains cookie banner, overlay filter, and preference center
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
    ]);

    // Re-enable scrolling if body has overflow hidden
    // EXTRACTED: Captured DOM showed body style="overflow: auto;" (line 1)
    if (element.style.overflow === 'hidden') {
      element.setAttribute('style', 'overflow: scroll;');
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove tracking iframes
    // EXTRACTED: Found <iframe> elements in captured DOM (lines 8957-8960)
    // Includes Adobe Demdex syncing iframe and empty iframes
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'noscript',
      'link',
      'source',
    ]);
  }
}
