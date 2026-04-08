/* eslint-disable */
/* global WebImporter */
/** Parser for tabs-design. Base: tabs. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  // Tab 1: Design Externo (360 + exterior details)
  const extLabel = document.createElement('p');
  extLabel.textContent = 'Design Externo';
  const extContent = document.createElement('div');
  const ext360 = element.querySelector('.pd-external360');
  const extDetails = element.querySelector('.pd-external');
  if (ext360) {
    const img360 = ext360.querySelector('img.preview, .reel360 img:last-of-type');
    if (img360) extContent.appendChild(img360);
  }
  if (extDetails) {
    const extItems = extDetails.querySelectorAll('.pc-item');
    extItems.forEach(item => {
      const img = item.querySelector('.pc-item-thumb img, .pc-item-thumb-image');
      const title = item.querySelector('h4, .pc-item-title');
      if (img) extContent.appendChild(img);
      if (title) extContent.appendChild(title);
    });
  }
  cells.push([extLabel, extContent]);

  // Tab 2: Design Interno
  const intLabel = document.createElement('p');
  intLabel.textContent = 'Design Interno';
  const intContent = document.createElement('div');
  const intSection = element.querySelector('.pd-internal');
  if (intSection) {
    const intItems = intSection.querySelectorAll('.pc-item');
    intItems.forEach(item => {
      const img = item.querySelector('.pc-item-thumb img, .pc-item-thumb-image');
      const title = item.querySelector('h4, .pc-item-title');
      if (img) intContent.appendChild(img);
      if (title) intContent.appendChild(title);
    });
  }
  cells.push([intLabel, intContent]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-design', cells });
  element.replaceWith(block);
}
