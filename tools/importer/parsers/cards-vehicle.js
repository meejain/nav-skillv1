/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Cards-Vehicle block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: cards
 * Selector: .vehicle-showroom
 *
 * Block Structure:
 * - Each row: [image, name + price + CTA] per vehicle card
 *
 * Generated: 2026-02-21
 */

export const name = 'Cards-Vehicle';
export const selector = '.vehicle-showroom';

export default function parse(element, { document }) {
  const cells = [];
  const vehicles = element.querySelectorAll('.vs-card, .vehicle-card');
  vehicles.forEach((vehicle) => {
    const img = vehicle.querySelector('img');
    const vehicleName = vehicle.querySelector('.vs-model-name, .vehicle-name');
    const price = vehicle.querySelector('.vs-price, .vehicle-price');
    const cta = vehicle.querySelector('a.hyundai-button');
    const imgCell = img ? img.cloneNode(true) : '';
    const textParts = [];
    if (vehicleName) textParts.push(`**${vehicleName.textContent.trim()}**`);
    if (price) textParts.push(price.textContent.trim());
    if (cta) {
      const a = document.createElement('a');
      a.href = cta.href;
      a.textContent = cta.textContent.trim();
      textParts.push(a.outerHTML);
    }
    cells.push([imgCell, textParts.join('\n')]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Vehicle', cells });
  element.replaceWith(block);
}
