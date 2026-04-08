/* eslint-disable */
/* global WebImporter */
/** Parser for accordion-tech. Base: accordion. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  const items = element.querySelectorAll('.MuiAccordion-root');
  items.forEach(item => {
    const title = item.querySelector('.accordion-title, .MuiAccordionSummary-content h4');
    const text = item.querySelector('.accordion-text, .MuiAccordionDetails-root p');
    const question = title ? title.textContent.trim() : '';
    const answer = text ? text.textContent.trim() : '';
    if (question) cells.push([question, answer]);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-tech', cells });
  element.replaceWith(block);
}
