/* eslint-disable */
/* global WebImporter */
/** Parser for columns-media. Base: columns. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  // Column 1: Text content
  const textCol = [];
  const heading = element.querySelector('h2');
  if (heading) textCol.push(heading);
  const desc = element.querySelector('p');
  if (desc) textCol.push(desc);
  const cta = element.querySelector('button#cta, a.hyundai-button');
  if (cta) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = cta.textContent.trim();
    textCol.push(a);
  }
  // Column 2: Video
  const mediaCol = [];
  const videoSource = element.querySelector('video source[src], video[src]');
  if (videoSource) {
    const videoUrl = videoSource.getAttribute('src');
    const a = document.createElement('a');
    a.href = videoUrl;
    a.textContent = videoUrl;
    mediaCol.push(a);
  }
  if (textCol.length || mediaCol.length) {
    cells.push([textCol.length ? textCol : '', mediaCol.length ? mediaCol : '']);
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
