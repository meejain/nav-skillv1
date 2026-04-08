/* eslint-disable */
/* global WebImporter */
/** Parser for hero-product. Base: hero. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  // Background/hero image
  const heroImg = element.querySelector('picture > img.img-fluid, .pb-container picture img');
  if (heroImg) cells.push([heroImg]);
  // Content: heading, subtitle, description, CTA
  const contentCell = [];
  const heading = element.querySelector('h1, h2.pb-title, .pb-vehicle-name');
  if (heading) contentCell.push(heading);
  const subtitle = element.querySelector('h2.pb-title, .pb-description h2');
  if (subtitle && subtitle !== heading) contentCell.push(subtitle);
  const desc = element.querySelector('p.pb-text, .pb-description p');
  if (desc) contentCell.push(desc);
  const cta = element.querySelector('a.hyundai-button, button.hyundai-button');
  if (cta) {
    if (cta.tagName === 'BUTTON') {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = cta.textContent.trim();
      contentCell.push(a);
    } else {
      contentCell.push(cta);
    }
  }
  if (contentCell.length) cells.push(contentCell);
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-product', cells });
  element.replaceWith(block);
}
