import { getMetadata } from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

const VEHICLE_CATEGORIES = [
  { label: 'Todos', filter: null },
  { label: 'SUV', filter: ['Novo CRETA', 'Novo CRETA N Line', 'Tucson', 'KONA Híbrido', 'Palisade', 'IONIQ 5'] },
  { label: 'Hatchback', filter: ['HB20'] },
  { label: 'Sedan', filter: ['HB20S'] },
  { label: 'Utilitário', filter: ['HR'] },
];

const VEHICLE_SPECS = {
  'Novo CRETA': {
    motor: 'T-GDi 1.0 Turbo', transmissao: 'CVT', potencia: '120cv', torque: '17,5 kgf.m',
  },
  HB20: {
    motor: 'Kappa 1.0 Turbo', transmissao: 'Automática 6 marchas', potencia: '120cv', torque: '17,5 kgf.m',
  },
  'Novo CRETA N Line': {
    motor: 'T-GDi 1.0 Turbo', transmissao: 'DCT 7 marchas', potencia: '120cv', torque: '17,5 kgf.m',
  },
  HB20S: {
    motor: 'Kappa 1.0 Turbo', transmissao: 'Automática 6 marchas', potencia: '120cv', torque: '17,5 kgf.m',
  },
  Tucson: {
    motor: 'Smartstream 1.6 Turbo', transmissao: 'DCT 7 marchas', potencia: '185cv', torque: '27 kgf.m',
  },
  'KONA Híbrido': {
    motor: 'Kappa 1.6 GDi + Elétrico', transmissao: 'DCT 6 marchas', potencia: '141cv', torque: '27 kgf.m',
  },
  Palisade: {
    motor: 'Lambda II 3.5 V6', transmissao: 'Automática 8 marchas', potencia: '266cv', torque: '34 kgf.m',
  },
  'IONIQ 5': {
    motor: '100% Elétrico', transmissao: 'Single Speed', potencia: '325cv', torque: '61,2 kgf.m',
  },
  HR: {
    motor: 'Diesel 2.5', transmissao: 'Manual 6 marchas', potencia: '130cv', torque: '26 kgf.m',
  },
};

function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active');
    item.setAttribute('aria-expanded', 'false');
  });
  const wrapper = nav.closest('.nav-wrapper');
  if (wrapper) wrapper.classList.remove('is-open');
}

function openPanel(nav, item) {
  closeAllPanels(nav);
  item.classList.add('active');
  item.setAttribute('aria-expanded', 'true');
  const wrapper = nav.closest('.nav-wrapper');
  if (wrapper) wrapper.classList.add('is-open');
}

function buildImageCard(li) {
  const a = li.querySelector('a');
  if (!a) return null;
  const card = document.createElement('a');
  card.href = a.href;
  card.className = 'nav-card';
  const img = a.querySelector('img');
  if (img) {
    const icon = document.createElement('span');
    icon.className = 'nav-card-icon';
    icon.append(img.cloneNode(true));
    card.append(icon);
  }
  const label = document.createElement('span');
  label.className = 'nav-card-label';
  label.textContent = a.textContent.trim();
  card.append(label);
  return card;
}

function buildTextLink(li) {
  const a = li.querySelector('a');
  if (!a) return null;
  const link = document.createElement('a');
  link.href = a.href;
  link.className = 'nav-panel-link';
  link.textContent = a.textContent.trim();
  return link;
}

function buildFeaturedArea() {
  const featured = document.createElement('div');
  featured.className = 'nav-featured';
  const imgWrap = document.createElement('div');
  imgWrap.className = 'nav-featured-image';
  featured.append(imgWrap);
  const specs = document.createElement('div');
  specs.className = 'nav-featured-specs';
  const specFields = ['Motor', 'Transmissão', 'Potência máxima', 'Torque máxima'];
  specFields.forEach((field) => {
    const row = document.createElement('div');
    row.className = 'nav-spec-row';
    const dt = document.createElement('span');
    dt.className = 'nav-spec-label';
    dt.textContent = field;
    const dd = document.createElement('span');
    dd.className = 'nav-spec-value';
    row.append(dt, dd);
    specs.append(row);
  });
  featured.append(specs);
  return featured;
}

function updateFeaturedArea(featured, vehicleName, imgSrc) {
  const imgWrap = featured.querySelector('.nav-featured-image');
  imgWrap.innerHTML = '';
  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = vehicleName;
  img.loading = 'lazy';
  imgWrap.append(img);
  const nameEl = imgWrap.parentElement.querySelector('.nav-featured-name');
  if (nameEl) nameEl.textContent = vehicleName;
  else {
    const n = document.createElement('div');
    n.className = 'nav-featured-name';
    n.textContent = vehicleName;
    imgWrap.after(n);
  }
  const specs = VEHICLE_SPECS[vehicleName];
  if (!specs) return;
  const values = featured.querySelectorAll('.nav-spec-value');
  const specKeys = ['motor', 'transmissao', 'potencia', 'torque'];
  specKeys.forEach((key, i) => {
    if (values[i]) values[i].textContent = specs[key] || '';
  });
}

function buildVehiclePanel(subItems) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-megamenu';
  const featured = buildFeaturedArea();
  panel.append(featured);
  const right = document.createElement('div');
  right.className = 'nav-megamenu-right';
  const tabs = document.createElement('div');
  tabs.className = 'nav-category-tabs';
  VEHICLE_CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab';
    btn.textContent = cat.label;
    btn.type = 'button';
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      const grid = right.querySelector('.nav-vehicle-grid');
      grid.querySelectorAll('.nav-vehicle-card').forEach((card) => {
        const name = card.dataset.vehicle;
        if (!cat.filter) card.style.display = '';
        else card.style.display = cat.filter.includes(name) ? '' : 'none';
      });
    });
    tabs.append(btn);
  });
  right.append(tabs);
  const grid = document.createElement('div');
  grid.className = 'nav-vehicle-grid';
  subItems.forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const img = a.querySelector('img');
    if (!img) return;
    const name = a.textContent.trim();
    const card = document.createElement('a');
    card.href = a.href;
    card.className = 'nav-vehicle-card';
    card.dataset.vehicle = name;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = img.alt || name;
    thumb.loading = 'lazy';
    card.append(thumb);
    const label = document.createElement('span');
    label.textContent = name;
    card.append(label);
    card.addEventListener('mouseenter', () => {
      updateFeaturedArea(featured, name, img.src);
    });
    grid.append(card);
  });
  right.append(grid);
  panel.append(right);
  const firstCard = grid.querySelector('.nav-vehicle-card');
  if (firstCard) {
    const firstImg = firstCard.querySelector('img');
    updateFeaturedArea(featured, firstCard.dataset.vehicle, firstImg ? firstImg.src : '');
  }
  return panel;
}

function buildDealerSearchPanel(subItems) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-dealer-panel';
  const cards = document.createElement('div');
  cards.className = 'nav-panel-cards';
  subItems.forEach((li) => {
    const card = buildImageCard(li);
    if (card) cards.append(card);
  });
  panel.append(cards);
  const formWrap = document.createElement('div');
  formWrap.className = 'nav-dealer-form';
  const title = document.createElement('h3');
  title.className = 'nav-dealer-title';
  title.textContent = 'Buscar concessionária';
  formWrap.append(title);
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.addEventListener('submit', (e) => e.preventDefault());
  const radioOptions = [
    { value: 'location', label: 'Minha localização', checked: true },
    { value: 'name', label: 'Buscar por nome', checked: false },
    { value: 'cep', label: 'Buscar por CEP', checked: false },
  ];
  const radioGroup = document.createElement('div');
  radioGroup.className = 'nav-radio-group';
  radioOptions.forEach((opt) => {
    const lbl = document.createElement('label');
    lbl.className = 'nav-radio-label';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'dealer-search-type';
    input.value = opt.value;
    input.checked = opt.checked;
    lbl.append(input);
    const span = document.createElement('span');
    span.textContent = opt.label;
    lbl.append(span);
    radioGroup.append(lbl);
  });
  form.append(radioGroup);
  const inputWrap = document.createElement('div');
  inputWrap.className = 'nav-search-input-wrap';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'nav-search-input';
  input.placeholder = 'Digite o nome ou CEP';
  inputWrap.append(input);
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'nav-search-btn';
  btn.setAttribute('aria-label', 'Buscar');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>';
  inputWrap.append(btn);
  form.append(inputWrap);
  formWrap.append(form);
  panel.append(formWrap);
  return panel;
}

function buildStandardPanel(subItems) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  const imageItems = [];
  const textItems = [];
  subItems.forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    if (a.querySelector('img')) imageItems.push(li);
    else textItems.push(li);
  });
  if (imageItems.length > 0) {
    const cards = document.createElement('div');
    cards.className = 'nav-panel-cards';
    imageItems.forEach((li) => {
      const card = buildImageCard(li);
      if (card) cards.append(card);
    });
    panel.append(cards);
  }
  if (textItems.length > 0) {
    const links = document.createElement('div');
    links.className = 'nav-panel-links';
    textItems.forEach((li) => {
      const link = buildTextLink(li);
      if (link) links.append(link);
    });
    panel.append(links);
  }
  return panel;
}

function detectPanelType(subItems, triggerText) {
  if (!subItems || subItems.length === 0) return 'none';
  const allHaveImages = subItems.every((li) => li.querySelector('a img'));
  const text = triggerText.toLowerCase();
  if (allHaveImages && subItems.length > 4) return 'vehicle-gallery';
  if (text.includes('concession')) return 'dealer-search';
  return 'standard';
}

function buildSecondaryPanel(section) {
  const panel = document.createElement('div');
  panel.className = 'nav-secondary-panel';
  const items = section.querySelectorAll('ul > li');
  const imageItems = [];
  const textItems = [];
  items.forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    if (a.querySelector('img')) imageItems.push(li);
    else textItems.push(li);
  });
  if (imageItems.length > 0) {
    const cards = document.createElement('div');
    cards.className = 'nav-secondary-cards';
    imageItems.forEach((li) => {
      const card = buildImageCard(li);
      if (card) cards.append(card);
    });
    panel.append(cards);
  }
  if (textItems.length > 0) {
    const links = document.createElement('div');
    links.className = 'nav-secondary-links';
    textItems.forEach((li) => {
      const link = buildTextLink(li);
      if (link) links.append(link);
    });
    panel.append(links);
  }
  return panel;
}

function closeSecondaryPanel(nav) {
  const hamburger = nav.querySelector('.nav-hamburger');
  if (hamburger) hamburger.classList.remove('is-open');
  const secondaryPanel = nav.querySelector('.nav-secondary-panel');
  if (secondaryPanel) secondaryPanel.classList.remove('is-open');
  const wrapper = nav.closest('.nav-wrapper');
  if (wrapper && !nav.querySelector('.nav-item.active')) {
    wrapper.classList.remove('is-open');
  }
}

function setupDesktopBehavior(nav) {
  const navItems = nav.querySelectorAll('.nav-sections .nav-item.nav-drop');
  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      openPanel(nav, item);
    });
  });
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      closeAllPanels(nav);
    });
  }
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPanels(nav);
      closeSecondaryPanel(nav);
    }
  });
}

function closeMobileMenu(nav) {
  const sections = nav.querySelector('.nav-sections');
  if (sections) sections.classList.remove('mobile-open');
  nav.querySelectorAll('.nav-mobile-subpanel').forEach((sp) => sp.classList.remove('is-open'));
  document.body.classList.remove('nav-mobile-open');
}

function buildMobileSubPanel(navItem) {
  const panel = navItem.querySelector('.nav-panel');
  if (!panel) return null;
  const subPanel = document.createElement('div');
  subPanel.className = 'nav-mobile-subpanel';
  const link = navItem.querySelector('.nav-link');
  const title = link ? link.textContent.trim() : '';
  const back = document.createElement('div');
  back.className = 'nav-mobile-subpanel-back';
  back.textContent = title;
  back.addEventListener('click', () => subPanel.classList.remove('is-open'));
  subPanel.append(back);
  const content = panel.cloneNode(true);
  content.style.display = '';
  content.style.position = '';
  content.style.animation = '';
  subPanel.append(content);
  return subPanel;
}

function buildMobileSecondary(secondaryPanel) {
  const mobileSecondary = document.createElement('div');
  mobileSecondary.className = 'nav-mobile-secondary';
  const cards = secondaryPanel.querySelector('.nav-secondary-cards');
  if (cards) {
    const clonedCards = cards.cloneNode(true);
    clonedCards.className = 'nav-secondary-cards';
    mobileSecondary.append(clonedCards);
  }
  const links = secondaryPanel.querySelector('.nav-secondary-links');
  if (links) {
    const clonedLinks = links.cloneNode(true);
    clonedLinks.className = 'nav-secondary-links';
    mobileSecondary.append(clonedLinks);
  }
  return mobileSecondary;
}

function setupMobileBehavior(nav) {
  const navSections = nav.querySelector('.nav-sections');
  const secondaryPanel = nav.querySelector('.nav-secondary-panel');
  if (!navSections) return;
  // Build mobile sub-panels for each dropdown
  nav.querySelectorAll('.nav-item.nav-drop').forEach((item) => {
    const subPanel = buildMobileSubPanel(item);
    if (subPanel) {
      nav.append(subPanel);
      const link = item.querySelector('.nav-link');
      if (link) {
        link.addEventListener('click', (e) => {
          if (!isDesktop.matches) {
            e.preventDefault();
            e.stopPropagation();
            subPanel.classList.add('is-open');
          }
        });
      }
    }
  });
  // Add secondary content to mobile menu
  if (secondaryPanel) {
    const mobileSecondary = buildMobileSecondary(secondaryPanel);
    navSections.append(mobileSecondary);
  }
}

function setupHamburgerBehavior(nav) {
  const hamburger = nav.querySelector('.nav-hamburger');
  const secondaryPanel = nav.querySelector('.nav-secondary-panel');
  if (!hamburger) return;
  hamburger.addEventListener('click', () => {
    const isOpenState = hamburger.classList.contains('is-open');
    if (isOpenState) {
      if (isDesktop.matches) {
        closeSecondaryPanel(nav);
      } else {
        closeMobileMenu(nav);
        hamburger.classList.remove('is-open');
        const wrapper = nav.closest('.nav-wrapper');
        if (wrapper && !nav.querySelector('.nav-item.active')) {
          wrapper.classList.remove('is-open');
        }
      }
    } else {
      closeAllPanels(nav);
      hamburger.classList.add('is-open');
      const wrapper = nav.closest('.nav-wrapper');
      if (wrapper) wrapper.classList.add('is-open');
      if (isDesktop.matches) {
        if (secondaryPanel) secondaryPanel.classList.add('is-open');
      } else {
        const sections = nav.querySelector('.nav-sections');
        if (sections) sections.classList.add('mobile-open');
        document.body.classList.add('nav-mobile-open');
      }
    }
  });
}

function setupViewportResize(nav) {
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    closeSecondaryPanel(nav);
    closeMobileMenu(nav);
    const hamburger = nav.querySelector('.nav-hamburger');
    if (hamburger) hamburger.classList.remove('is-open');
    const wrapper = nav.closest('.nav-wrapper');
    if (wrapper) wrapper.classList.remove('is-open');
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${navPath}.plain.html`);
  }
  if (!resp.ok) return;
  const html = await resp.text();
  const parser = new DOMParser();
  const navDoc = parser.parseFromString(html, 'text/html');
  const sections = navDoc.querySelectorAll('body > div');
  if (sections.length < 2) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Brand (section 0)
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = sections[0].querySelector('a');
  if (brandLink) {
    const a = document.createElement('a');
    a.href = brandLink.href;
    a.setAttribute('aria-label', 'Hyundai - Home');
    const logoImg = brandLink.querySelector('img');
    if (logoImg) {
      const img = document.createElement('img');
      img.src = logoImg.src;
      img.alt = logoImg.alt || 'Hyundai';
      img.width = 138;
      img.height = 18;
      a.append(img);
    }
    brand.append(a);
  }
  nav.append(brand);

  // Nav sections (section 1)
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  const topItems = sections[1].querySelectorAll(':scope > ul > li');
  topItems.forEach((li, idx) => {
    const a = li.querySelector(':scope > a');
    if (!a) return;
    const navItem = document.createElement('li');
    navItem.className = 'nav-item';
    navItem.setAttribute('aria-expanded', 'false');
    const triggerText = a.textContent.trim();
    const subUl = li.querySelector(':scope > ul');
    const isLastItem = idx === topItems.length - 1;
    if (isLastItem) {
      const cta = document.createElement('a');
      cta.href = a.href;
      cta.className = 'nav-link nav-cta';
      cta.textContent = triggerText;
      navItem.append(cta);
      navItem.className = 'nav-item nav-item-cta';
      navList.append(navItem);
      return;
    }
    const link = document.createElement('a');
    link.href = a.href;
    link.className = 'nav-link';
    link.textContent = triggerText;
    navItem.append(link);
    if (subUl) {
      navItem.classList.add('nav-drop');
      const subItems = [...subUl.querySelectorAll(':scope > li')];
      const panelType = detectPanelType(subItems, triggerText);
      let panel;
      if (panelType === 'vehicle-gallery') {
        panel = buildVehiclePanel(subItems);
      } else if (panelType === 'dealer-search') {
        panel = buildDealerSearchPanel(subItems);
      } else {
        panel = buildStandardPanel(subItems);
      }
      navItem.append(panel);
    }
    navList.append(navItem);
  });
  navSections.append(navList);
  nav.append(navSections);

  // Hamburger (desktop visible, opens secondary panel from section 2)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('role', 'button');
  hamburger.setAttribute('aria-label', 'Menu');
  hamburger.setAttribute('tabindex', '0');
  const hIcon = document.createElement('span');
  hIcon.className = 'nav-hamburger-icon';
  hamburger.append(hIcon);
  nav.append(hamburger);

  // Secondary panel (section 2)
  if (sections[2]) {
    const secondaryPanel = buildSecondaryPanel(sections[2]);
    nav.append(secondaryPanel);
  }

  // Setup behaviors
  setupDesktopBehavior(nav);
  setupMobileBehavior(nav);
  setupHamburgerBehavior(nav);
  setupViewportResize(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.textContent = '';
  block.append(navWrapper);
}
