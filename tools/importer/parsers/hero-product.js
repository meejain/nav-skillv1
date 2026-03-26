/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Hero-Product block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: hero
 * Selector: .kona-video-container, .vehicle-video-hero
 *
 * Block Structure:
 * - Row 1: background image
 * - Row 2: CTA link
 *
 * Generated: 2026-02-21
 */

export const name = 'Hero-Product';
export const selector = '.kona-video-container, .vehicle-video-hero';

export default function parse(element, { document }) {
  const cells = [];
  const img = element.querySelector('img');
  if (img) {
    cells.push([img.cloneNode(true)]);
  }
  const cta = element.querySelector('a.hyundai-button, a[href*="veiculos"]');
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.textContent.trim();
    cells.push([a]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero-Product', cells });
  element.replaceWith(block);
}
