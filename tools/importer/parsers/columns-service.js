/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Columns-Service block
 *
 * Source: https://www.hyundai.com.br/
 * Base Block: columns
 * Selector: .link-hub
 *
 * Block Structure:
 * - Row 1: [links list, banner image]
 *
 * Generated: 2026-02-21
 */

export const name = 'Columns-Service';
export const selector = '.link-hub';

export default function parse(element, { document }) {
  const cells = [];
  const links = element.querySelectorAll('.lb-link');
  const bannerImg = element.querySelector('.lh-banner img, .lh-hub-banner img');
  const linkParts = [];
  links.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.textContent.trim();
    linkParts.push(a.outerHTML);
  });
  const imgCell = bannerImg ? bannerImg.cloneNode(true) : '';
  cells.push([linkParts.join('<br>'), imgCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Service', cells });
  element.replaceWith(block);
}
