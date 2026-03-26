/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Cards-Offer block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: cards
 * Selector: .offers-slider
 *
 * Block Structure:
 * - Each row: [image, model + price + highlights + CTA] per offer card
 *
 * Generated: 2026-02-21
 */

export const name = 'Cards-Offer';
export const selector = '.offers-slider';

export default function parse(element, { document }) {
  const cells = [];
  const offers = element.querySelectorAll('.ocd-card');
  offers.forEach((offer) => {
    const img = offer.querySelector('img');
    const model = offer.querySelector('.ocd-model-name');
    const version = offer.querySelector('.ocd-version-name');
    const price = offer.querySelector('.ocd-price');
    const highlights = offer.querySelectorAll('.ocd-highlights p');
    const cta = offer.querySelector('a.hyundai-button');
    const imgCell = img ? img.cloneNode(true) : '';
    const textParts = [];
    if (model) textParts.push(`**${model.textContent.trim()}${version ? ` ${version.textContent.trim()}` : ''}**`);
    if (price) textParts.push(price.textContent.trim());
    highlights.forEach((h) => textParts.push(`- ${h.textContent.trim()}`));
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.textContent.trim();
      textParts.push(a.outerHTML);
    }
    cells.push([imgCell, textParts.join('\n')]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Offer', cells });
  element.replaceWith(block);
}
