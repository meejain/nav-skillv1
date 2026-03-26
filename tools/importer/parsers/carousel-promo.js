/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Carousel-Promo block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: carousel
 * Selector: .hyundai-carousel-container
 *
 * Block Structure:
 * - Each row: [image, text + link] per slide
 *
 * Generated: 2026-02-21
 */

export const name = 'Carousel-Promo';
export const selector = '.hyundai-carousel-container';

export default function parse(element, { document }) {
  const cells = [];
  const slides = element.querySelectorAll('.swiper-slide.hc-item');
  slides.forEach((slide) => {
    const img = slide.querySelector('img');
    const link = slide.querySelector('a');
    const title = slide.querySelector('.hc-title');
    const imgCell = img ? img.cloneNode(true) : '';
    let textCell = '';
    if (title) {
      textCell = title.textContent.trim();
    }
    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim() || 'Learn more';
      textCell = textCell ? `${textCell}\n${a.outerHTML}` : a.outerHTML;
    }
    cells.push([imgCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel-Promo', cells });
  element.replaceWith(block);
}
