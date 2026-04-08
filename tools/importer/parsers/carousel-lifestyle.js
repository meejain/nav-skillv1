/* eslint-disable */
/* global WebImporter */
/** Parser for carousel-lifestyle. Base: carousel. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  const slides = element.querySelectorAll('.swiper-slide');
  slides.forEach(slide => {
    const img = slide.querySelector('img');
    if (img) cells.push([img]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-lifestyle', cells });
  element.replaceWith(block);
}
