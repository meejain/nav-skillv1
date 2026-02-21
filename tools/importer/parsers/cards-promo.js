/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Cards-Promo block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: cards
 * Selector: .mosaic
 *
 * Block Structure:
 * - Each row: [image, title + link] per mosaic item
 *
 * Generated: 2026-02-21
 */

export const name = 'Cards-Promo';
export const selector = '.mosaic';

export default function parse(element, { document }) {
  const cells = [];
  const items = element.querySelectorAll('.mosaic-item, a[href]');
  items.forEach((item) => {
    const img = item.querySelector('img');
    const link = item.closest('a') || item.querySelector('a');
    const alt = img ? img.alt : '';
    const imgCell = img ? img.cloneNode(true) : '';
    const textParts = [];
    if (alt) textParts.push(`**${alt}**`);
    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = 'Ver mais';
      textParts.push(a.outerHTML);
    }
    cells.push([imgCell, textParts.join('\n')]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Promo', cells });
  element.replaceWith(block);
}
