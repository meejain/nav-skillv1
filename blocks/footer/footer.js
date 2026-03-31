import { getMetadata } from '../../scripts/aem.js';

const HAMBURGER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="9" viewBox="0 0 18 9">
  <rect width="18" height="1" y="0" fill="#fff"/>
  <rect width="18" height="1" y="4" fill="#fff"/>
  <rect width="18" height="1" y="8" fill="#fff"/>
</svg>`;

function classifySection(div) {
  const h4 = div.querySelector('h4');
  const h5 = div.querySelector('h5');
  const imgs = div.querySelectorAll('img');
  const links = div.querySelectorAll('a');
  const ps = div.querySelectorAll('p');
  const ul = div.querySelector('ul');

  if (links.length === 1 && !h4 && !h5 && imgs.length === 0 && !ul) {
    return 'cta';
  }
  if (imgs.length === 1 && !h4 && !h5 && !ul && links.length <= 1) {
    const img = imgs[0];
    if (img.alt && img.alt.includes('Linha')) return 'promo-image';
    if (img.alt && img.alt.includes('Proconve')) return 'proconve';
  }
  if (h4) return 'form';
  if (h5 && ul) return 'link-column';
  if (ul && !h5 && !h4) {
    const liImgs = ul.querySelectorAll('li img');
    if (liImgs.length >= 3) return 'social-icons';
  }
  if (imgs.length >= 1 && ps.length >= 3 && ul) {
    const hasLogo = [...imgs].some((img) => img.alt && img.alt.includes('Logo Hyundai'));
    if (hasLogo) return 'info-panel';
  }
  if (ps.length === 1 && !ul && !h4 && !h5 && imgs.length === 0) return 'disclaimer';
  if (imgs.length >= 1) {
    const hasProconve = [...imgs].some((img) => img.alt && img.alt.includes('Proconve'));
    if (hasProconve) return 'proconve';
  }
  return 'unknown';
}

function buildForm(formSection) {
  const container = document.createElement('div');
  container.className = 'footer-form';

  const heading = formSection.querySelector('h4');
  if (heading) {
    const h = document.createElement('h4');
    h.textContent = heading.textContent;
    container.append(h);
  }

  const form = document.createElement('form');
  form.noValidate = true;

  const fieldsRow = document.createElement('div');
  fieldsRow.className = 'footer-form-fields';

  const fieldDefs = [
    { name: 'name', label: 'NOME*' },
    { name: 'surname', label: 'SOBRENOME*' },
    { name: 'cellphone', label: 'WHATSAPP*' },
    { name: 'email', label: 'E-MAIL*', type: 'email' },
  ];

  fieldDefs.forEach((def) => {
    const group = document.createElement('div');
    group.className = 'footer-form-group';
    const input = document.createElement('input');
    input.type = def.type || 'text';
    input.name = def.name;
    input.placeholder = ' ';
    input.required = true;
    const label = document.createElement('label');
    label.textContent = def.label;
    group.append(input, label);
    fieldsRow.append(group);
  });

  form.append(fieldsRow);

  const channelUl = formSection.querySelector('ul');
  if (channelUl) {
    const channelSection = document.createElement('div');
    channelSection.className = 'footer-form-channels';

    const allPs = formSection.querySelectorAll('p');
    allPs.forEach((p) => {
      if (p.textContent.includes('Desejo ser contatado')) {
        const channelP = document.createElement('p');
        channelP.textContent = p.textContent;
        channelSection.append(channelP);
      }
    });

    const checkboxRow = document.createElement('div');
    checkboxRow.className = 'footer-form-checkbox-row';

    const items = channelUl.querySelectorAll('li');
    items.forEach((li, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'footer-form-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.name = `channel-${li.textContent.trim().toLowerCase().replace(/\s+/g, '-')}`;
      cb.id = `channel-${idx}`;
      if (idx === 0) cb.checked = true;
      const lbl = document.createElement('label');
      lbl.htmlFor = `channel-${idx}`;
      lbl.textContent = li.textContent.trim();
      wrapper.append(cb, lbl);
      checkboxRow.append(wrapper);
    });
    channelSection.append(checkboxRow);
    form.append(channelSection);
  }

  const consentSection = document.createElement('div');
  consentSection.className = 'footer-form-consent';

  const allPs = formSection.querySelectorAll('p');
  let consentIdx = 0;
  allPs.forEach((p) => {
    const text = p.textContent.trim();
    if (text.includes('Das opções marcadas') || text.includes('Declaro que li')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'footer-form-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.name = `consent-${consentIdx}`;
      cb.id = `consent-${consentIdx}`;
      cb.checked = true;
      const lbl = document.createElement('label');
      lbl.htmlFor = `consent-${consentIdx}`;
      lbl.textContent = text;
      wrapper.append(cb, lbl);
      consentSection.append(wrapper);
      consentIdx += 1;
    }
  });
  form.append(consentSection);

  const btnRow = document.createElement('div');
  btnRow.className = 'footer-form-submit';
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'ENVIAR';
  btnRow.append(btn);
  form.append(btnRow);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  container.append(form);
  return container;
}

function buildLinkColumn(section, isFirst) {
  const col = document.createElement('div');
  col.className = 'footer-link-column';

  const heading = section.querySelector('h5');
  const header = document.createElement('div');
  header.className = 'footer-column-header';

  if (isFirst) {
    header.innerHTML = HAMBURGER_SVG;
    header.classList.add('footer-column-header-icon');
  } else {
    const headingLink = heading.querySelector('a');
    if (headingLink) {
      const a = document.createElement('a');
      a.href = headingLink.href;
      a.textContent = heading.textContent;
      header.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = heading.textContent;
      header.append(span);
    }
  }
  col.append(header);

  const ul = section.querySelector('ul');
  if (ul) {
    const list = ul.cloneNode(true);
    if (isFirst && heading) {
      const headingLink = heading.querySelector('a');
      if (headingLink) {
        const li = document.createElement('li');
        li.className = 'footer-mobile-heading-link';
        const a = document.createElement('a');
        a.href = headingLink.href;
        a.textContent = heading.textContent;
        li.append(a);
        list.prepend(li);
      }
    }
    col.append(list);
  }

  return col;
}

function buildInfoPanel(section) {
  const panel = document.createElement('div');
  panel.className = 'footer-info-panel';

  const logoDiv = document.createElement('div');
  logoDiv.className = 'footer-logo-copyright';
  const logoImg = section.querySelector('a img[alt*="Logo Hyundai"]');
  if (logoImg) {
    const a = logoImg.closest('a').cloneNode(true);
    logoDiv.append(a);
  }
  const allPs = section.querySelectorAll('p');
  allPs.forEach((p) => {
    if (p.textContent.includes('ⓒ')) {
      const cp = document.createElement('span');
      cp.className = 'footer-copyright';
      cp.textContent = p.textContent;
      logoDiv.append(cp);
    }
  });
  panel.append(logoDiv);

  const ul = section.querySelector('ul');
  if (ul) {
    const legalDiv = document.createElement('div');
    legalDiv.className = 'footer-legal-links';
    const links = ul.querySelectorAll('a');
    links.forEach((a) => {
      const link = a.cloneNode(true);
      legalDiv.append(link);
    });
    const cookieBtn = document.createElement('button');
    cookieBtn.textContent = 'Gerenciar cookies';
    cookieBtn.className = 'footer-manage-cookies';
    cookieBtn.addEventListener('click', () => {
      if (window.OneTrust) window.OneTrust.ToggleInfoDisplay();
    });
    legalDiv.append(cookieBtn);
    panel.append(legalDiv);
  }

  const contactDiv = document.createElement('div');
  contactDiv.className = 'footer-contact-info';
  allPs.forEach((p) => {
    const text = p.textContent.trim();
    const link = p.querySelector('a');
    if (link && link.href && link.href.includes('tel:')) {
      const phone = document.createElement('a');
      phone.href = link.href;
      phone.textContent = link.textContent;
      phone.className = 'footer-phone';
      contactDiv.append(phone);
    } else if (text.includes('Horário') || text.includes('Segunda') || text.includes('sábados')) {
      const el = document.createElement('p');
      el.textContent = text;
      contactDiv.append(el);
    } else if (text === 'Hyundai Motor Brasil') {
      const el = document.createElement('p');
      el.textContent = text;
      contactDiv.append(el);
    } else if (text.includes('CNPJ')) {
      const el = document.createElement('p');
      el.textContent = text;
      contactDiv.append(el);
    } else if (link && link.href && link.href.includes('maps')) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      contactDiv.append(a);
    }
  });
  panel.append(contactDiv);

  return panel;
}

function buildSocialIcons(section) {
  const container = document.createElement('div');
  container.className = 'footer-social-icons';
  const ul = section.querySelector('ul');
  if (ul) {
    const items = ul.querySelectorAll('li');
    items.forEach((li) => {
      const a = li.querySelector('a');
      if (a) {
        const link = a.cloneNode(true);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        container.append(link);
      }
    });
  }
  return container;
}

function buildProconve(section) {
  const container = document.createElement('div');
  container.className = 'footer-proconve';
  const img = section.querySelector('img');
  if (img) container.append(img.cloneNode(true));
  const allPs = section.querySelectorAll('p');
  allPs.forEach((p) => {
    if (!p.querySelector('img')) {
      const text = document.createElement('p');
      text.textContent = p.textContent;
      container.append(text);
    }
  });
  return container;
}

function setupMobileAccordion(footerEl) {
  const rightCols = footerEl.querySelectorAll('.footer-menus-right .footer-link-column');
  rightCols.forEach((col) => {
    const header = col.querySelector('.footer-column-header');
    if (!header) return;
    header.addEventListener('click', (e) => {
      if (window.innerWidth > 599) return;
      e.preventDefault();
      const isOpen = col.classList.contains('mobile-open');
      rightCols.forEach((c) => c.classList.remove('mobile-open'));
      if (!isOpen) col.classList.add('mobile-open');
    });
  });
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : '/content/footer';

  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  const html = await resp.text();
  const temp = document.createElement('div');
  temp.innerHTML = html;

  block.textContent = '';

  const footer = document.createElement('div');
  footer.className = 'footer-wrapper';

  const sections = [...temp.children];
  const linkColumns = [];
  let ctaSection = null;
  let promoSection = null;
  let formSection = null;
  let disclaimerSection = null;
  let infoPanelSection = null;
  let socialSection = null;
  let proconveSection = null;

  sections.forEach((section) => {
    const type = classifySection(section);
    switch (type) {
      case 'cta': ctaSection = section; break;
      case 'promo-image': promoSection = section; break;
      case 'form': formSection = section; break;
      case 'disclaimer': disclaimerSection = section; break;
      case 'link-column': linkColumns.push(section); break;
      case 'info-panel': infoPanelSection = section; break;
      case 'social-icons': socialSection = section; break;
      case 'proconve': proconveSection = section; break;
      default: break;
    }
  });

  if (ctaSection) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'footer-cta-wrapper';
    const a = ctaSection.querySelector('a');
    if (a) {
      const ctaLink = a.cloneNode(true);
      ctaLink.className = 'footer-cta-button';
      ctaWrapper.append(ctaLink);
    }
    footer.append(ctaWrapper);
  }

  if (promoSection) {
    const promoWrapper = document.createElement('div');
    promoWrapper.className = 'footer-promo-image';
    const img = promoSection.querySelector('img');
    if (img) promoWrapper.append(img.cloneNode(true));
    footer.append(promoWrapper);
  }

  const mainContainer = document.createElement('div');
  mainContainer.className = 'footer-main-container';

  if (formSection) {
    mainContainer.append(buildForm(formSection));
  }

  if (disclaimerSection) {
    const disc = document.createElement('div');
    disc.className = 'footer-disclaimer';
    disc.textContent = disclaimerSection.querySelector('p').textContent;
    mainContainer.append(disc);
  }

  const columnsArea = document.createElement('div');
  columnsArea.className = 'footer-columns-area';

  const menusLeft = document.createElement('div');
  menusLeft.className = 'footer-menus-left';
  const menusRight = document.createElement('div');
  menusRight.className = 'footer-menus-right';

  linkColumns.forEach((col, idx) => {
    const builtCol = buildLinkColumn(col, idx === 0);
    if (idx === 0) {
      menusLeft.append(builtCol);
    } else {
      menusRight.append(builtCol);
    }
  });

  const menusWrapper = document.createElement('div');
  menusWrapper.className = 'footer-menus-wrapper';
  menusWrapper.append(menusLeft, menusRight);
  columnsArea.append(menusWrapper);

  if (infoPanelSection) {
    const infoPanel = buildInfoPanel(infoPanelSection);

    if (socialSection) {
      infoPanel.append(buildSocialIcons(socialSection));
    }

    if (proconveSection) {
      infoPanel.append(buildProconve(proconveSection));
    }

    columnsArea.append(infoPanel);
  }

  mainContainer.append(columnsArea);

  // Mobile: clone legal links into right menus area
  const legalDesktop = columnsArea.querySelector('.footer-legal-links');
  if (legalDesktop) {
    const legalMobile = legalDesktop.cloneNode(true);
    legalMobile.className = 'footer-legal-mobile';
    const cookieBtn = legalMobile.querySelector('.footer-manage-cookies');
    if (cookieBtn) {
      cookieBtn.addEventListener('click', () => {
        if (window.OneTrust) window.OneTrust.ToggleInfoDisplay();
      });
    }
    menusRight.append(legalMobile);
  }

  // Mobile: clone proconve for full-width bottom placement
  const proconveDesktop = columnsArea.querySelector('.footer-proconve');
  if (proconveDesktop) {
    const proconveMobile = proconveDesktop.cloneNode(true);
    proconveMobile.className = 'footer-proconve-mobile';
    mainContainer.append(proconveMobile);
  }

  footer.append(mainContainer);
  block.append(footer);
  setupMobileAccordion(footer);
}
