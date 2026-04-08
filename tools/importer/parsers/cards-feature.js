/* eslint-disable */
/* global WebImporter */
/** Parser for cards-feature. Base: cards. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  // Extract tech spec items as cards
  const specItems = element.querySelectorAll('.ppt-item');
  specItems.forEach(item => {
    const title = item.querySelector('h3, .ppt-item-title');
    const value = item.querySelector('h4, .ppt-item-text');
    const contentCell = [];
    if (title) contentCell.push(title);
    if (value) contentCell.push(value);
    if (contentCell.length) cells.push(contentCell);
  });
  // If no spec items found, try color swatches
  if (cells.length === 0) {
    const colorButtons = element.querySelectorAll('.pd-external360-colors-content button');
    colorButtons.forEach(btn => {
      const colorName = btn.querySelector('p');
      if (colorName) cells.push([colorName]);
    });
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
