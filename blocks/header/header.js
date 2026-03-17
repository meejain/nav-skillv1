import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function buildHamburger() {
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="bar bar-1"></span><span class="bar bar-2"></span><span class="bar bar-3"></span>';
  return hamburger;
}

function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-panel.is-active').forEach((panel) => {
    panel.classList.remove('is-active');
  });
  const menuRoot = nav.querySelector('.nav-menu-root');
  if (menuRoot) menuRoot.style.transform = '';
}

function toggleMenu(nav, force) {
  const isOpen = typeof force === 'boolean' ? force : !nav.classList.contains('is-open');
  const hamburger = nav.querySelector('.nav-hamburger');
  nav.classList.toggle('is-open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  hamburger.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  document.body.style.overflowY = isOpen ? 'hidden' : '';
  if (!isOpen) closeAllPanels(nav);
}

function openSubPanel(nav, panelId) {
  const panel = nav.querySelector(`.nav-panel[data-panel="${panelId}"]`);
  if (!panel) return;
  const menuRoot = nav.querySelector('.nav-menu-root');
  if (menuRoot) menuRoot.style.transform = 'translateX(-100%)';
  panel.classList.add('is-active');
}

function closeSubPanel(panel) {
  panel.classList.remove('is-active');
  const nav = panel.closest('nav');
  const menuRoot = nav.querySelector('.nav-menu-root');
  if (menuRoot) menuRoot.style.transform = '';
}

function buildNavItem(li, index) {
  const link = li.querySelector(':scope > a');
  const subList = li.querySelector(':scope > ul');
  const item = document.createElement('li');
  item.className = 'nav-item';

  if (li.classList.contains('highlighted')) {
    item.classList.add('nav-item-highlighted');
  }

  if (li.classList.contains('dealer-search')) {
    const form = li.querySelector('form');
    if (form) {
      item.classList.add('nav-item-dealer-search');
      item.appendChild(form.cloneNode(true));
      return { item, panel: null };
    }
  }

  if (!subList) {
    if (link) {
      const a = link.cloneNode(true);
      item.appendChild(a);
    }
    return { item, panel: null };
  }

  const panelId = `panel-${index}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-item-trigger';

  if (link) {
    const label = document.createElement('span');
    label.className = 'nav-item-label';
    label.textContent = link.textContent;
    wrapper.appendChild(label);
  }

  const arrow = document.createElement('span');
  arrow.className = 'nav-item-arrow';
  arrow.innerHTML = '&#8250;';
  wrapper.appendChild(arrow);

  wrapper.setAttribute('data-panel', panelId);
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('tabindex', '0');
  item.appendChild(wrapper);

  // Build sub-panel
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.setAttribute('data-panel', panelId);

  const backBtn = document.createElement('button');
  backBtn.className = 'nav-panel-back';
  backBtn.innerHTML = `<span class="back-arrow">&#8249;</span> ${link ? link.textContent : ''}`;
  backBtn.addEventListener('click', () => closeSubPanel(panel));
  panel.appendChild(backBtn);

  const panelContent = document.createElement('ul');
  panelContent.className = 'nav-panel-list';

  subList.querySelectorAll(':scope > li').forEach((subLi) => {
    const { item: subItem } = buildNavItem(subLi, `${index}-sub`);
    panelContent.appendChild(subItem);
  });

  panel.appendChild(panelContent);
  return { item, panel };
}

function buildOfertasBanner(li) {
  const link = li.querySelector(':scope > a');
  if (!link) return null;
  const banner = document.createElement('li');
  banner.className = 'nav-item nav-item-ofertas';
  const a = link.cloneNode(true);
  banner.appendChild(a);
  return banner;
}

function getTopLevelListItems(section) {
  const ul = section.querySelector('ul');
  return ul ? [...ul.children].filter((c) => c.tagName === 'LI') : [];
}

function decorateNav(nav, fragment) {
  const sections = [...fragment.children];
  const [brandSection, navSection, quickLinksSection, bottomLinksSection] = sections;

  // Brand / logo
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const logoLink = brandSection.querySelector('a');
    if (logoLink) {
      const a = logoLink.cloneNode(true);
      a.className = 'nav-logo-link';
      brand.appendChild(a);
    }
  }
  nav.appendChild(brand);

  // Hamburger
  const hamburger = buildHamburger();
  nav.insertBefore(hamburger, brand);
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Menu overlay
  const menuOverlay = document.createElement('div');
  menuOverlay.className = 'nav-menu';

  // Menu root (main list)
  const menuRoot = document.createElement('div');
  menuRoot.className = 'nav-menu-root';

  const mainList = document.createElement('ul');
  mainList.className = 'nav-list';

  const panels = [];

  if (navSection) {
    const items = getTopLevelListItems(navSection);
    items.forEach((li, idx) => {
      const firstLink = li.querySelector(':scope > a');
      const isOfertas = firstLink
        && (firstLink.getAttribute('class') || '').includes('nav-ofertas');
      const hasHighlight = firstLink
        && (firstLink.getAttribute('data-highlight') || '');

      if (isOfertas || hasHighlight) {
        const banner = buildOfertasBanner(li);
        if (banner) mainList.appendChild(banner);
        return;
      }

      const { item, panel } = buildNavItem(li, idx);
      mainList.appendChild(item);
      if (panel) panels.push(panel);
    });
  }

  menuRoot.appendChild(mainList);

  // Quick links section
  if (quickLinksSection) {
    const qlContainer = document.createElement('div');
    qlContainer.className = 'nav-quick-links';
    const qlList = document.createElement('ul');
    qlList.className = 'nav-quick-links-list';
    getTopLevelListItems(quickLinksSection).forEach((li) => {
      const item = document.createElement('li');
      item.className = 'nav-quick-link-item';
      const link = li.querySelector('a');
      if (link) item.appendChild(link.cloneNode(true));
      qlList.appendChild(item);
    });
    qlContainer.appendChild(qlList);
    menuRoot.appendChild(qlContainer);
  }

  // Bottom links section
  if (bottomLinksSection) {
    const blContainer = document.createElement('div');
    blContainer.className = 'nav-bottom-links';
    const blList = document.createElement('ul');
    blList.className = 'nav-bottom-links-list';
    getTopLevelListItems(bottomLinksSection).forEach((li) => {
      const item = document.createElement('li');
      item.className = 'nav-bottom-link-item';
      const link = li.querySelector('a');
      if (link) item.appendChild(link.cloneNode(true));
      blList.appendChild(item);
    });
    blContainer.appendChild(blList);
    menuRoot.appendChild(blContainer);
  }

  menuOverlay.appendChild(menuRoot);

  // Append sub-panels
  panels.forEach((panel) => menuOverlay.appendChild(panel));

  nav.appendChild(menuOverlay);

  // Click triggers to open panels
  menuRoot.querySelectorAll('.nav-item-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panelId = trigger.getAttribute('data-panel');
      openSubPanel(nav, panelId);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const panelId = trigger.getAttribute('data-panel');
        openSubPanel(nav, panelId);
      }
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      const activePanel = nav.querySelector('.nav-panel.is-active');
      if (activePanel) {
        closeSubPanel(activePanel);
      } else {
        toggleMenu(nav, false);
      }
    }
  });

  // Viewport resize handling
  isDesktop.addEventListener('change', () => {
    if (nav.classList.contains('is-open')) {
      toggleMenu(nav, false);
    }
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  decorateNav(nav, fragment);
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
