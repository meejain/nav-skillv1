/* eslint-disable */
/* global WebImporter */
/** Parser for columns-compare. Base: columns. Source: hyundai.com.br. Generated: 2026-04-07 */
export default function parse(element, { document }) {
  const cells = [];
  const vehicles = element.querySelectorAll('.pc-vehicle, .comparator-vehicle');
  if (vehicles.length >= 2) {
    const col1 = [];
    const col2 = [];
    vehicles.forEach((vehicle, i) => {
      const img = vehicle.querySelector('img');
      const name = vehicle.querySelector('select, .version-name, h3, h4');
      const col = i === 0 ? col1 : col2;
      if (img) col.push(img);
      if (name) {
        const p = document.createElement('p');
        p.textContent = name.textContent.trim() || name.value || '';
        col.push(p);
      }
    });
    if (col1.length || col2.length) cells.push([col1, col2]);
  }
  // Spec comparison table
  const specRows = element.querySelectorAll('.pc-table tr, .comparison-row, [class*="spec-row"]');
  specRows.forEach(row => {
    const tds = row.querySelectorAll('td, .spec-value');
    if (tds.length >= 2) {
      cells.push([tds[0], tds[1]]);
    }
  });
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-compare', cells });
  element.replaceWith(block);
}
