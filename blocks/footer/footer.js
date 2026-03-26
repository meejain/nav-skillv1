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
 * Builds the newsletter signup form for the footer.
 * @param {Element} section The form section element (contains the h4 heading)
 */
function buildForm(section) {
  const form = document.createElement('form');
  form.addEventListener('submit', (e) => e.preventDefault());

  const fields = document.createElement('div');
  fields.className = 'form-fields';
  [
    { label: 'NOME*', name: 'name' },
    { label: 'SOBRENOME*', name: 'surname' },
    { label: 'WHATSAPP*', name: 'cellphone' },
    { label: 'E-MAIL*', name: 'email' },
  ].forEach(({ label, name }) => {
    const field = document.createElement('div');
    field.className = 'form-field';
    const lbl = document.createElement('label');
    lbl.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    field.append(lbl, input);
    fields.append(field);
  });

  const channels = document.createElement('div');
  channels.className = 'channel-preferences';
  const channelText = document.createElement('p');
  channelText.textContent = 'Desejo ser contatado pelos seguintes canais:';
  const channelOpts = document.createElement('div');
  channelOpts.className = 'channel-options';
  [
    { label: 'E-mail', name: 'channel-email', checked: true },
    { label: 'SMS', name: 'channel-sms', checked: false },
    { label: 'Telefone', name: 'channel-telefone', checked: false },
    { label: 'Whatsapp', name: 'channel-whatsapp', checked: false },
    { label: 'Vídeo Chamada', name: 'channel-videochamada', checked: false },
  ].forEach(({ label, name, checked }) => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = name;
    cb.checked = checked;
    lbl.append(cb, ` ${label}`);
    channelOpts.append(lbl);
  });
  channels.append(channelText, channelOpts);

  const consent = document.createElement('div');
  consent.className = 'consent-options';
  [
    { name: 'consent-marketing', checked: true, text: 'Das opções marcadas, desejo receber informações da HMB, sua Rede de Concessionárias e Banco Hyundai, sobre ofertas, lançamentos, serviços, pesquisas, eventos e comunicação institucional.' },
    { name: 'consent-privacy', checked: true, text: 'Declaro que li e estou ciente com os termos da Politíca de Privacidade Hyundai' },
  ].forEach(({ name, checked, text }) => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = name;
    cb.checked = checked;
    lbl.append(cb, ` ${text}`);
    consent.append(lbl);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'ENVIAR';

  form.append(fields, channels, consent, submit);
  section.append(form);
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

  // Links section: flat structure — first UL = left column, h5+UL pairs = right column
  const linksSection = footer.querySelector('.footer-links');
  if (linksSection) {
    const firstUl = linksSection.querySelector(':scope > ul');
    const left = document.createElement('div');
    left.className = 'footer-links-left';
    if (firstUl) {
      left.append(firstUl);
      linksSection.prepend(left);
    }
    const right = document.createElement('div');
    right.className = 'footer-links-right';
    [...linksSection.querySelectorAll(':scope > h5, :scope > ul')].forEach((el) => {
      right.append(el);
    });
    linksSection.append(right);
    buildAccordions(right);
  }

  // Bottom section: logo, copyright, social icons
  // Identify by content: logo has img[alt*=Logo], copyright starts with ©, rest = social
  const bottomSection = footer.querySelector('.footer-bottom');
  if (bottomSection) {
    const paragraphs = [...bottomSection.querySelectorAll(':scope > p')];
    const socialLinks = [];
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (p.querySelector('img[alt*="Logo"]')) {
        p.classList.add('footer-logo');
      } else if (text.startsWith('\u24D2') || text.startsWith('\u00A9') || text.startsWith('©')) {
        p.classList.add('copyright');
      } else if (p.querySelector('a[href]')) {
        socialLinks.push(p);
      }
    });
    // Merge social icon paragraphs into a single <p>
    if (socialLinks.length > 1) {
      const socialP = document.createElement('p');
      socialP.className = 'footer-social';
      socialLinks.forEach((p) => {
        socialP.append(...p.childNodes);
        p.remove();
      });
      bottomSection.append(socialP);
    } else if (socialLinks.length === 1) {
      socialLinks[0].classList.add('footer-social');
    }
  }

  // Legal section: convert cookie manager link to button
  // DA may strip data-action, so match by text or data-action
  const legalSection = footer.querySelector('.footer-legal');
  if (legalSection) {
    const links = legalSection.querySelectorAll('a');
    links.forEach((a) => {
      const isCookie = a.getAttribute('data-action') === 'cookie-manager'
        || a.textContent.trim().toLowerCase().includes('gerenciar cookies');
      if (isCookie) {
        const btn = document.createElement('button');
        btn.className = 'cookie-manager';
        btn.textContent = a.textContent;
        btn.addEventListener('click', () => {
          if (window.OneTrust) window.OneTrust.ToggleInfoDisplay();
        });
        a.replaceWith(btn);
      }
    });
  }

  // Form section: build the lead-capture form via JS
  const formSection = footer.querySelector('.footer-form');
  if (formSection) buildForm(formSection);
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
