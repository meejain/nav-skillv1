import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Adds accordion toggle behavior to footer link sections.
 * On desktop, sections are always expanded. On mobile, they collapse.
 * @param {Element} linksRight The right link columns container
 */
function decorateAccordions(linksRight) {
  linksRight.querySelectorAll('.footer-accordion').forEach((acc) => {
    const heading = acc.querySelector('h5');
    if (!heading) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'footer-accordion-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', `Toggle ${heading.textContent}`);
    toggleBtn.textContent = '+';
    toggleBtn.setAttribute('aria-hidden', 'true');
    heading.append(toggleBtn);

    const titleLink = acc.getAttribute('data-title-link');
    if (titleLink) {
      const text = heading.childNodes[0].textContent;
      const linkEl = document.createElement('a');
      linkEl.href = titleLink;
      linkEl.textContent = text;
      heading.childNodes[0].textContent = '';
      heading.prepend(linkEl);
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';

      // Exclusive: close all other accordions first
      linksRight.querySelectorAll('.footer-accordion.open').forEach((other) => {
        if (other !== acc) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.footer-accordion-toggle');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      toggleBtn.setAttribute('aria-expanded', String(!expanded));
      acc.classList.toggle('open', !expanded);
    });
  });
}

/**
 * Creates the two-column layout: links on the left, info on the right.
 * Matches the source site's desktop layout where link columns and
 * info (logo, legal, contact, social, proconve) sit side by side.
 * @param {Element} footer The footer container element
 */
function decorateColumns(footer) {
  const footerLinks = footer.querySelector('.footer-links');
  const logoCopyright = footer.querySelector('.footer-logo-copyright');
  const legal = footer.querySelector('.footer-legal');
  const contact = footer.querySelector('.footer-contact');
  const social = footer.querySelector('.footer-social');
  const proconve = footer.querySelector('.footer-proconve');

  if (!footerLinks) return;

  // Create the two-column wrapper
  const columns = document.createElement('div');
  columns.className = 'footer-columns';

  // Insert wrapper where footer-links currently is
  footerLinks.parentNode.insertBefore(columns, footerLinks);

  // Move links into the left side
  columns.append(footerLinks);

  // Create info column (right side)
  const info = document.createElement('div');
  info.className = 'footer-info';

  [logoCopyright, legal, contact, social, proconve].forEach((el) => {
    if (el) info.append(el);
  });

  columns.append(info);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Rebase relative image paths to fragment base
  const base = new URL(footerPath, window.location);
  footer.querySelectorAll('img[src^="images/"], source[srcset^="images/"]').forEach((el) => {
    const attr = el.hasAttribute('srcset') ? 'srcset' : 'src';
    el[attr] = new URL(el.getAttribute(attr), base).href;
  });

  // Decorate accordion sections in right link columns
  const linksRight = footer.querySelector('.footer-links-right');
  if (linksRight) decorateAccordions(linksRight);

  // Create two-column layout (links left, info right)
  decorateColumns(footer);

  block.append(footer);
}
