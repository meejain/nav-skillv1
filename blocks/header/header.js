import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

/* --- state helpers --- */

function closeAllPanels(nav) {
  const wrapper = nav.closest('.nav-wrapper');
  nav.querySelectorAll('.nav-drop').forEach((d) => {
    d.classList.remove('is-active');
    d.setAttribute('aria-expanded', 'false');
  });
  const drawer = nav.querySelector('.nav-hamburger-content');
  if (drawer) drawer.classList.remove('is-open');
  const hb = nav.querySelector('.nav-hamburger');
  if (hb) hb.classList.remove('is-open');
  if (wrapper) wrapper.classList.remove('is-open');
  document.body.style.overflowY = '';
}

function openDropdown(nav, drop) {
  const wrapper = nav.closest('.nav-wrapper');
  nav.querySelectorAll('.nav-drop').forEach((d) => {
    d.classList.remove('is-active');
    d.setAttribute('aria-expanded', 'false');
  });
  const drawer = nav.querySelector('.nav-hamburger-content');
  if (drawer) drawer.classList.remove('is-open');
  const hb = nav.querySelector('.nav-hamburger');
  if (hb) hb.classList.remove('is-open');
  drop.classList.add('is-active');
  drop.setAttribute('aria-expanded', 'true');
  if (wrapper) wrapper.classList.add('is-open');
}

function toggleHamburgerDrawer(nav) {
  const wrapper = nav.closest('.nav-wrapper');
  const hb = nav.querySelector('.nav-hamburger');
  const drawer = nav.querySelector('.nav-hamburger-content');
  if (!hb || !drawer) return;
  const wasOpen = hb.classList.contains('is-open');
  closeAllPanels(nav);
  if (!wasOpen) {
    hb.classList.add('is-open');
    drawer.classList.add('is-open');
    if (wrapper) wrapper.classList.add('is-open');
    if (!isDesktop.matches) document.body.style.overflowY = 'hidden';
  }
}

/* --- panel builders --- */

function isVehicleGrid(ul) {
  let catCount = 0;
  [...ul.children].forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (sub && sub.querySelector('img')) catCount += 1;
  });
  return catCount >= 2;
}

function buildStandardPanel(ul) {
  const panel = document.createElement('div');
  panel.classList.add('nav-panel');
  const highlights = document.createElement('ul');
  highlights.classList.add('highlight-cards');
  const links = document.createElement('ul');
  links.classList.add('text-links');
  [...ul.children].forEach((li) => {
    if (li.querySelector('img')) highlights.append(li);
    else links.append(li);
  });
  if (highlights.children.length) panel.append(highlights);
  if (links.children.length) panel.append(links);
  return panel;
}

function buildVehiclePanel(ul) {
  const panel = document.createElement('div');
  panel.classList.add('nav-panel', 'nav-panel-vehicles');

  const categories = [];
  const allVehicles = [];
  [...ul.children].forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const catName = li.childNodes[0]?.textContent?.trim();
    if (!sub || !catName) return;
    const vehicles = [];
    [...sub.children].forEach((vli) => {
      const a = vli.querySelector('a');
      const img = vli.querySelector('img');
      const name = img?.alt || a?.textContent?.trim() || '';
      vehicles.push({
        name, href: a?.href || '#', src: img?.src || '', cat: catName.toLowerCase(),
      });
    });
    categories.push({ name: catName, count: vehicles.length });
    allVehicles.push(...vehicles);
  });

  const first = allVehicles[0];

  // feature card
  const feature = document.createElement('div');
  feature.classList.add('vehicle-feature');
  feature.innerHTML = `<div class="vehicle-feature-image"><img src="${first?.src || ''}" alt="${first?.name || ''}"></div>
    <div class="vehicle-feature-name">${first?.name || ''}</div>
    <a href="${first?.href || '#'}" class="vehicle-feature-link">Saiba mais</a>`;

  // grid
  const grid = document.createElement('div');
  grid.classList.add('vehicle-grid');

  const tabs = document.createElement('ul');
  tabs.classList.add('vehicle-category-tabs');
  const allTab = document.createElement('li');
  allTab.dataset.filter = 'all';
  allTab.classList.add('active');
  allTab.textContent = `Todos (${allVehicles.length})`;
  tabs.append(allTab);
  categories.forEach((c) => {
    const t = document.createElement('li');
    t.dataset.filter = c.name.toLowerCase();
    t.textContent = `${c.name} (${c.count})`;
    tabs.append(t);
  });

  const cards = document.createElement('ul');
  cards.classList.add('vehicle-cards');
  allVehicles.forEach((v) => {
    const li = document.createElement('li');
    li.dataset.category = v.cat;
    li.innerHTML = `<a href="${v.href}"><img src="${v.src}" alt="${v.name}"><span>${v.name}</span></a>`;
    cards.append(li);
  });

  grid.append(tabs, cards);
  panel.append(feature, grid);
  return panel;
}

function setupVehicleInteractions(panel) {
  const tabs = panel.querySelectorAll('.vehicle-category-tabs li');
  const cards = panel.querySelectorAll('.vehicle-cards li');
  const featureImg = panel.querySelector('.vehicle-feature-image img');
  const featureName = panel.querySelector('.vehicle-feature-name');
  const featureLink = panel.querySelector('.vehicle-feature-link');

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.filter;
      cards.forEach((c) => {
        c.style.display = (f === 'all' || c.dataset.category === f) ? '' : 'none';
      });
    });
  });

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const img = card.querySelector('img');
      const name = card.querySelector('span');
      const link = card.querySelector('a');
      if (featureImg && img) { featureImg.src = img.src; featureImg.alt = img.alt; }
      if (featureName && name) featureName.textContent = name.textContent;
      if (featureLink && link) featureLink.href = link.href;
    });
  });
}

/* --- nav item processing --- */

function processNavSections(section) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return;
  const items = wrapper.querySelectorAll(':scope > ul > li');
  items.forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    if (!sub) return;
    li.classList.add('nav-drop');
    li.setAttribute('aria-expanded', 'false');

    // get or create the trigger element
    let trigger = li.querySelector(':scope > a');
    if (!trigger) {
      // text-only trigger (Serviços, Veículos) – wrap in span
      const text = li.childNodes[0]?.textContent?.trim();
      if (text) {
        li.childNodes[0].textContent = '';
        const span = document.createElement('span');
        span.classList.add('nav-trigger');
        span.textContent = text;
        li.prepend(span);
        trigger = span;
      }
    } else {
      trigger.classList.add('nav-trigger');
    }

    // build panel
    let panel;
    if (isVehicleGrid(sub)) {
      panel = buildVehiclePanel(sub);
    } else {
      panel = buildStandardPanel(sub);
    }
    sub.remove();
    li.append(panel);
  });
}

/* --- event setup --- */

function setupDesktopHover(nav) {
  let timer;
  const drops = () => nav.querySelectorAll('.nav-sections .nav-drop');

  nav.addEventListener('mouseover', (e) => {
    if (!isDesktop.matches) return;
    const drop = e.target.closest('.nav-drop');
    if (drop && nav.querySelector('.nav-sections')?.contains(drop)) {
      clearTimeout(timer);
      openDropdown(nav, drop);
    }
  });

  nav.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    timer = setTimeout(() => closeAllPanels(nav), 200);
  });

  // keep panel open while inside
  nav.addEventListener('mouseenter', () => {
    clearTimeout(timer);
  });

  // clicks on nav-drop triggers toggle on desktop too
  drops().forEach((drop) => {
    const trigger = drop.querySelector(':scope > .nav-trigger');
    if (trigger && trigger.tagName === 'SPAN') {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isDesktop.matches) {
          const active = drop.classList.contains('is-active');
          closeAllPanels(nav);
          if (!active) openDropdown(nav, drop);
        }
      });
    }
  });
}

function setupMobileToggle(nav) {
  const drops = nav.querySelectorAll('.nav-sections .nav-drop');
  drops.forEach((drop) => {
    const trigger = drop.querySelector(':scope > .nav-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      if (isDesktop.matches) return;
      // for links, prevent navigation on mobile to open panel instead
      if (trigger.tagName === 'A') e.preventDefault();
      const active = drop.classList.contains('is-active');
      // close all first
      drops.forEach((d) => {
        d.classList.remove('is-active');
        d.setAttribute('aria-expanded', 'false');
      });
      if (!active) {
        drop.classList.add('is-active');
        drop.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

function applyViewportStyles(wrapper) {
  if (!isDesktop.matches) {
    wrapper.style.backgroundColor = '#fff';
    wrapper.style.color = '#000';
  } else {
    wrapper.style.backgroundColor = '';
    wrapper.style.color = '';
  }
}

function setupGlobalListeners(nav) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPanels(nav);
  });
  document.addEventListener('click', (e) => {
    const wrapper = nav.closest('.nav-wrapper');
    if (wrapper && !wrapper.contains(e.target)) closeAllPanels(nav);
  });
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    const wrapper = nav.closest('.nav-wrapper');
    if (wrapper) applyViewportStyles(wrapper);
  });
}

/* --- main --- */

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // assign section roles by index
  const brandSection = nav.children[0];
  const hamburgerSection = nav.children[1];
  const navLinksSection = nav.children[2];
  const toolsSection = nav.children[3];

  if (brandSection) brandSection.classList.add('nav-brand');
  if (hamburgerSection) hamburgerSection.classList.add('nav-hamburger-content');
  if (navLinksSection) navLinksSection.classList.add('nav-sections');
  if (toolsSection) toolsSection.classList.add('nav-tools');

  // de-buttonize logo
  const brandLink = brandSection?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    const bc = brandLink.closest('.button-container');
    if (bc) bc.className = '';
  }

  // de-buttonize CTA but mark it
  const ctaLink = toolsSection?.querySelector('.button');
  if (ctaLink) {
    ctaLink.className = 'nav-cta';
    const bc = ctaLink.closest('.button-container');
    if (bc) bc.className = '';
  }

  // process nav sections – build panels
  if (navLinksSection) processNavSections(navLinksSection);

  // setup vehicle interactions
  const vehiclePanel = nav.querySelector('.nav-panel-vehicles');
  if (vehiclePanel) setupVehicleInteractions(vehiclePanel);

  // build hamburger button
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="hamburger-bar"></span><span class="hamburger-bar"></span><span class="hamburger-bar"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleHamburgerDrawer(nav));

  // assemble header row
  const row = document.createElement('div');
  row.classList.add('nav-header-row');
  const left = document.createElement('div');
  left.classList.add('nav-left');
  left.append(hamburger);
  if (brandSection) left.append(brandSection);
  const right = document.createElement('div');
  right.classList.add('nav-right');
  if (navLinksSection) right.append(navLinksSection);
  if (toolsSection) right.append(toolsSection);
  row.append(left, right);

  // clear nav children and rebuild
  nav.textContent = '';
  nav.append(row);
  if (hamburgerSection) nav.append(hamburgerSection);

  // events
  setupDesktopHover(nav);
  setupMobileToggle(nav);
  setupGlobalListeners(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  // gradient overlay (replaces ::before to avoid hook conflict)
  const overlay = document.createElement('div');
  overlay.className = 'nav-gradient-overlay';
  navWrapper.append(overlay);

  navWrapper.append(nav);

  // apply mobile solid background via inline style
  applyViewportStyles(navWrapper);

  block.append(navWrapper);
}
