/* eslint-disable */
/* global WebImporter */
/** Parser for cards-gallery. Base: cards. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  const items = element.querySelectorAll('.pg-item');
  items.forEach(item => {
    const img = item.querySelector('.item-thumb img');
    const title = item.querySelector('.item-title, .item-hover h4');
    const row = [];
    if (img) row.push(img);
    if (title) row.push(title);
    if (row.length) cells.push(row);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-gallery', cells });
  element.replaceWith(block);
}
