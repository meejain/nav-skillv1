import { getMetadata } from '../../scripts/aem.js';

/**
 * Builds accordion sections from h5 + ul pairs.
 * @param {Element} container The container with h5/ul pairs
 */
function buildAccordions(container) {
  const headings = container.querySelectorAll('h5');
  headings.forEach((h5) => {
    const list = h5.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;

    const wrapper = document.createElement('div');
    wrapper.className = 'accordion-item';

    const button = document.createElement('button');
    button.className = 'accordion-toggle';
    button.setAttribute('aria-expanded', 'false');
    const title = h5.textContent;
    button.textContent = `+ ${title}`;

    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.hidden = true;
    body.append(list);

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = `${expanded ? '+' : '\u2212'} ${title}`;
      body.hidden = expanded;
    });

    wrapper.append(button, body);
    h5.replaceWith(wrapper);
  });
}

/**
 * Decorates the footer sections by position.
 * Section order: CTA, Hero Image, Form, Disclaimer, Links, Legal, Bottom, Proconve
 * @param {Element} footer The footer wrapper element
 */
function decorateSections(footer) {
  const sections = footer.querySelectorAll(':scope > div');
  const sectionNames = [
    'footer-cta',
    'footer-hero-image',
    'footer-form',
    'footer-disclaimer',
    'footer-links',
    'footer-legal',
    'footer-bottom',
    'footer-proconve',
  ];
  sections.forEach((section, i) => {
    if (sectionNames[i]) section.classList.add(sectionNames[i]);
  });

  // Links section: first child = left column, second = right column (accordions)
  const linksSection = footer.querySelector('.footer-links');
  if (linksSection) {
    const cols = linksSection.querySelectorAll(':scope > div');
    if (cols[0]) cols[0].classList.add('footer-links-left');
    if (cols[1]) {
      cols[1].classList.add('footer-links-right');
      buildAccordions(cols[1]);
    }
  }

  // Bottom section: logo paragraph, copyright, social icons
  const bottomSection = footer.querySelector('.footer-bottom');
  if (bottomSection) {
    const paragraphs = bottomSection.querySelectorAll(':scope > p');
    if (paragraphs[0]) paragraphs[0].classList.add('footer-logo');
    if (paragraphs[1]) paragraphs[1].classList.add('copyright');
    if (paragraphs[2]) paragraphs[2].classList.add('footer-social');
  }

  // Legal section: convert pipe-separated links
  const legalSection = footer.querySelector('.footer-legal');
  if (legalSection) {
    const cookieLink = legalSection.querySelector('a[data-action="cookie-manager"]');
    if (cookieLink) {
      const btn = document.createElement('button');
      btn.className = 'cookie-manager';
      btn.textContent = cookieLink.textContent;
      btn.addEventListener('click', () => {
        if (window.OneTrust) window.OneTrust.ToggleInfoDisplay();
      });
      cookieLink.replaceWith(btn);
    }
  }

  // Form section: classify inner divs
  const formSection = footer.querySelector('.footer-form');
  if (formSection) {
    const form = formSection.querySelector('form');
    if (form) {
      const formDivs = form.querySelectorAll(':scope > div');
      if (formDivs[0]) {
        formDivs[0].classList.add('form-fields');
        formDivs[0].querySelectorAll(':scope > div').forEach((f) => f.classList.add('form-field'));
      }
      if (formDivs[1]) {
        formDivs[1].classList.add('channel-preferences');
        const optionsDiv = formDivs[1].querySelector(':scope > div');
        if (optionsDiv) optionsDiv.classList.add('channel-options');
      }
      if (formDivs[2]) formDivs[2].classList.add('consent-options');
      form.addEventListener('submit', (e) => e.preventDefault());
    }
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.innerHTML = await resp.text();

  decorateSections(footer);

  block.append(footer);
}
