/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Columns-Cta block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: columns
 * Selector: .call-page
 *
 * Block Structure:
 * - Row 1: [image, title + text + CTA]
 *
 * Generated: 2026-02-21
 */

export const name = 'Columns-Cta';
export const selector = '.call-page';

export default function parse(element, { document }) {
  const cells = [];
  const img = element.querySelector('.cp-image img');
  const title = element.querySelector('.cp-title');
  const text = element.querySelector('.cp-text');
  const cta = element.querySelector('a.hyundai-button');
  const imgCell = img ? img.cloneNode(true) : '';
  const textParts = [];
  if (title) textParts.push(`### ${title.textContent.trim()}`);
  if (text) textParts.push(text.textContent.trim());
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.textContent.trim();
    textParts.push(a.outerHTML);
  }
  cells.push([imgCell, textParts.join('\n')]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Cta', cells });
  element.replaceWith(block);
}
