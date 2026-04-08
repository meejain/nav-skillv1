/* eslint-disable */
/* global WebImporter */
/** Parser for carousel-gallery. Base: carousel. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  const slides = element.querySelectorAll('.swiper-slide');
  slides.forEach(slide => {
    const img = slide.querySelector('.pc-item-thumb img, .pc-item-thumb-image');
    const title = slide.querySelector('h4, .pc-item-title');
    const row = [];
    if (img) row.push(img);
    if (title) {
      if (row.length === 0) row.push('');
      row.push(title);
    }
    if (row.length) cells.push(row);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-gallery', cells });
  element.replaceWith(block);
}
