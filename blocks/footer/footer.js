import { getMetadata } from '../../scripts/aem.js';

/**
 * Builds the accordion sections from footer-accordion divs.
 * @param {Element} container The accordion container element
 */
function buildAccordions(container) {
  const accordions = container.querySelectorAll('.footer-accordion');
  accordions.forEach((accordion) => {
    const { title } = accordion.dataset;
    const list = accordion.querySelector('ul');

    const wrapper = document.createElement('div');
    wrapper.className = 'accordion-item';

    const button = document.createElement('button');
    button.className = 'accordion-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.textContent = `+ ${title}`;

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.hidden = true;
    if (list) body.append(list);

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = `${expanded ? '+' : '\u2212'} ${title}`;
      body.hidden = expanded;
    });

    wrapper.append(button, body);
    accordion.replaceWith(wrapper);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let resp = await fetch(`${footerPath}.plain.html`);
  if (!resp.ok && !footerMeta) {
    resp = await fetch('/content/footer.plain.html');
  }
  if (!resp.ok) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.innerHTML = await resp.text();

  // Build accordion sections
  const rightCol = footer.querySelector('.footer-links-right');
  if (rightCol) buildAccordions(rightCol);

  // Prevent form default submission
  const form = footer.querySelector('.footer-form form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  // Cookie manager button
  const cookieBtn = footer.querySelector('.cookie-manager');
  if (cookieBtn) {
    cookieBtn.addEventListener('click', () => {
      if (window.OneTrust) {
        window.OneTrust.ToggleInfoDisplay();
      }
    });
  }

  block.append(footer);
}
