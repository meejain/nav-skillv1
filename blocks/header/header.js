import { getMetadata } from '../../scripts/aem.js';

const DESKTOP_MQ = '(min-width: 900px)';
const isDesktop = window.matchMedia(DESKTOP_MQ);

/**
 * Fetches and parses the nav document
 * @param {string} navPath - Path to nav document (without .plain.html)
 * @returns {HTMLElement|null} The parsed nav content
 */
async function fetchNav(navPath) {
  const resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Resolve relative image paths against nav document location
  const navBase = new URL(`${navPath}.plain.html`, window.location);
  temp.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) {
      img.src = new URL(src, navBase).href;
    }
  });

  return temp.querySelector('header') || temp;
}

/**
 * Closes all open dropdown panels and resets header state
 * @param {HTMLElement} nav
 */
function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((item) => {
    item.setAttribute('aria-expanded', 'false');
  });
  const hamburger = nav.querySelector('.nav-hamburger');
  if (hamburger && hamburger.classList.contains('is-active')) {
    hamburger.classList.remove('is-active');
    const toolsPanel = nav.querySelector('.nav-tools-panel');
    if (toolsPanel) toolsPanel.setAttribute('aria-hidden', 'true');
    nav.setAttribute('aria-expanded', 'false');
  }
  nav.closest('.nav-wrapper')?.classList.remove('is-open');
  document.body.style.overflowY = '';
}

/**
 * Opens a nav item dropdown panel
 * @param {HTMLElement} nav
 * @param {HTMLElement} item - The nav-item to open
 */
function openPanel(nav, item) {
  closeAllPanels(nav);
  item.setAttribute('aria-expanded', 'true');
  nav.closest('.nav-wrapper')?.classList.add('is-open');
}

/**
 * Builds the featured vehicle area for a megamenu
 * @param {HTMLElement[]} vehicleItems - LI elements with data-category
 * @returns {HTMLElement}
 */
function buildFeaturedArea(vehicleItems) {
  const featured = document.createElement('div');
  featured.className = 'megamenu-featured';
  if (!vehicleItems.length) return featured;

  const first = vehicleItems[0];
  const link = first.querySelector(':scope > a');
  const img = first.querySelector(':scope > a > img');
  const specs = first.querySelector('.specs');

  const imgWrap = document.createElement('a');
  imgWrap.className = 'megamenu-featured-img';
  imgWrap.href = link ? link.href : '#';
  if (img) {
    const largeImg = document.createElement('img');
    largeImg.src = img.src;
    largeImg.alt = img.alt || '';
    imgWrap.append(largeImg);
  }

  const info = document.createElement('div');
  info.className = 'megamenu-featured-info';

  const title = document.createElement('h3');
  title.className = 'megamenu-featured-title';
  title.textContent = link ? link.textContent.trim() : '';

  const specsList = document.createElement('ul');
  specsList.className = 'megamenu-featured-specs';
  if (specs) {
    specs.querySelectorAll('li').forEach((s) => {
      const li = document.createElement('li');
      const label = s.getAttribute('data-spec') || '';
      const labelSpan = document.createElement('span');
      labelSpan.className = 'spec-label';
      labelSpan.textContent = label;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'spec-value';
      valueSpan.textContent = s.textContent;
      li.append(labelSpan, valueSpan);
      specsList.append(li);
    });
  }

  info.append(title, specsList);
  featured.append(imgWrap, info);
  return featured;
}

/**
 * Builds category filter tabs from vehicle items
 * @param {HTMLElement[]} vehicleItems
 * @returns {HTMLElement}
 */
function buildCategoryTabs(vehicleItems) {
  const tabs = document.createElement('div');
  tabs.className = 'megamenu-tabs';

  const categories = new Map();
  categories.set('todos', { label: 'Todos', count: vehicleItems.length });
  vehicleItems.forEach((item) => {
    const cat = item.getAttribute('data-category');
    if (cat) {
      if (!categories.has(cat)) {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        categories.set(cat, { label, count: 0 });
      }
      categories.get(cat).count += 1;
    }
  });

  categories.forEach((val, key) => {
    const tab = document.createElement('button');
    tab.className = 'megamenu-tab';
    if (key === 'todos') tab.classList.add('active');
    tab.setAttribute('data-category', key);
    tab.textContent = `${val.label} (${val.count})`;
    tabs.append(tab);
  });

  return tabs;
}

/**
 * Builds the vehicle card grid
 * @param {HTMLElement[]} vehicleItems
 * @returns {HTMLElement}
 */
function buildVehicleGrid(vehicleItems) {
  const grid = document.createElement('div');
  grid.className = 'megamenu-vehicle-grid';

  vehicleItems.forEach((item) => {
    const link = item.querySelector(':scope > a');
    const img = item.querySelector(':scope > a > img');
    const category = item.getAttribute('data-category') || '';
    const specs = item.querySelector('.specs');

    const card = document.createElement('a');
    card.href = link ? link.href : '#';
    card.className = 'vehicle-card';
    card.setAttribute('data-category', category);

    if (img) {
      const cardImg = document.createElement('div');
      cardImg.className = 'vehicle-card-img';
      const cloned = document.createElement('img');
      cloned.src = img.src;
      cloned.alt = img.alt || '';
      cloned.loading = 'lazy';
      cardImg.append(cloned);
      card.append(cardImg);
    }

    const label = document.createElement('span');
    label.className = 'vehicle-card-label';
    label.textContent = link ? link.textContent.trim() : '';
    card.append(label);

    if (specs) {
      const specData = {};
      specs.querySelectorAll('li').forEach((s) => {
        const key = s.getAttribute('data-spec');
        if (key) specData[key] = s.textContent;
      });
      card.setAttribute('data-specs', JSON.stringify(specData));
      card.setAttribute('data-vehicle-name', label.textContent);
      card.setAttribute('data-vehicle-img', img ? img.src : '');
    }

    grid.append(card);
  });

  return grid;
}

/**
 * Builds the megamenu panel content (featured area + category tabs + vehicle grid)
 * @param {HTMLElement} subList - UL with vehicle items
 * @returns {HTMLElement}
 */
function buildMegamenuContent(subList) {
  const content = document.createElement('div');
  content.className = 'panel-content megamenu-layout';

  const vehicleItems = [...subList.querySelectorAll(':scope > li[data-category]')];
  const featured = buildFeaturedArea(vehicleItems);
  const right = document.createElement('div');
  right.className = 'megamenu-right';
  right.append(buildCategoryTabs(vehicleItems), buildVehicleGrid(vehicleItems));

  content.append(featured, right);
  return content;
}

/**
 * Builds a standard dropdown panel content (icon cards + text links)
 * @param {HTMLElement} subList - UL with dropdown items
 * @returns {HTMLElement}
 */
function buildStandardContent(subList) {
  const content = document.createElement('div');
  content.className = 'panel-content standard-layout';

  const left = document.createElement('div');
  left.className = 'panel-left';

  const right = document.createElement('div');
  right.className = 'panel-right';

  subList.querySelectorAll(':scope > li').forEach((li) => {
    if (li.classList.contains('dealer-search')) {
      const searchWrap = document.createElement('div');
      searchWrap.className = 'panel-dealer-search';
      const title = li.querySelector('p');
      if (title) {
        const h4 = document.createElement('h4');
        h4.textContent = title.textContent;
        searchWrap.append(h4);
      }
      const form = li.querySelector('form');
      if (form) searchWrap.append(form.cloneNode(true));
      right.append(searchWrap);
      return;
    }

    const link = li.querySelector('a');
    const img = li.querySelector('img');

    if (img && link) {
      const card = document.createElement('a');
      card.href = link.href;
      card.className = 'icon-card';
      const imgSpan = document.createElement('span');
      imgSpan.className = 'icon-card-img';
      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.alt || '';
      imgEl.loading = 'lazy';
      imgSpan.append(imgEl);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'icon-card-label';
      labelSpan.textContent = link.textContent.trim();
      card.append(imgSpan, labelSpan);
      left.append(card);
    } else if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'panel-link';
      a.textContent = link.textContent.trim();
      right.append(a);
    }
  });

  if (left.children.length) content.append(left);
  if (right.children.length) content.append(right);
  return content;
}

/**
 * Sets up category tab filtering in a megamenu panel
 * @param {HTMLElement} panel - The dropdown-panel element
 */
function setupCategoryTabs(panel) {
  const tabs = panel.querySelectorAll('.megamenu-tab');
  const cards = panel.querySelectorAll('.vehicle-card');

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-category');
      cards.forEach((card) => {
        const show = cat === 'todos' || card.getAttribute('data-category') === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/**
 * Sets up featured area hover updates when hovering vehicle cards
 * @param {HTMLElement} panel - The dropdown-panel element
 */
function setupFeaturedHover(panel) {
  const featured = panel.querySelector('.megamenu-featured');
  if (!featured) return;

  panel.querySelectorAll('.vehicle-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const name = card.getAttribute('data-vehicle-name');
      const imgSrc = card.getAttribute('data-vehicle-img');
      const specsJson = card.getAttribute('data-specs');
      if (!name) return;

      const titleEl = featured.querySelector('.megamenu-featured-title');
      if (titleEl) titleEl.textContent = name;

      const imgEl = featured.querySelector('.megamenu-featured-img img');
      if (imgEl && imgSrc) {
        imgEl.src = imgSrc;
        imgEl.alt = name;
      }

      const linkEl = featured.querySelector('.megamenu-featured-img');
      if (linkEl) linkEl.href = card.href;

      if (specsJson) {
        try {
          const specs = JSON.parse(specsJson);
          const specsList = featured.querySelector('.megamenu-featured-specs');
          if (specsList) {
            specsList.innerHTML = '';
            Object.entries(specs).forEach(([key, value]) => {
              const li = document.createElement('li');
              const labelSpan = document.createElement('span');
              labelSpan.className = 'spec-label';
              labelSpan.textContent = key;
              const valueSpan = document.createElement('span');
              valueSpan.className = 'spec-value';
              valueSpan.textContent = value;
              li.append(labelSpan, valueSpan);
              specsList.append(li);
            });
          }
        } catch (err) {
          // ignore parse errors
        }
      }
    });
  });
}

/**
 * Sets up desktop hover behavior for nav items with dropdowns
 * @param {HTMLElement} nav
 */
function setupDesktopHover(nav) {
  const items = nav.querySelectorAll('.nav-sections .nav-item');
  let hoverTimeout;

  items.forEach((item) => {
    if (!item.querySelector('.dropdown-panel')) return;

    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      clearTimeout(hoverTimeout);
      openPanel(nav, item);
    });

    item.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      hoverTimeout = setTimeout(() => closeAllPanels(nav), 200);
    });
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPanels(nav);
  });
}

/**
 * Sets up hamburger menu toggle
 * @param {HTMLElement} nav
 */
function setupHamburger(nav) {
  const hamburger = nav.querySelector('.nav-hamburger');
  if (!hamburger) return;

  hamburger.addEventListener('click', () => {
    const active = hamburger.classList.contains('is-active');
    if (active) {
      closeAllPanels(nav);
    } else {
      closeAllPanels(nav);
      hamburger.classList.add('is-active');
      const toolsPanel = nav.querySelector('.nav-tools-panel');
      if (toolsPanel) toolsPanel.setAttribute('aria-hidden', 'false');
      nav.closest('.nav-wrapper')?.classList.add('is-open');
      nav.setAttribute('aria-expanded', 'true');
      if (!isDesktop.matches) document.body.style.overflowY = 'hidden';
    }
  });
}

/**
 * Sets up viewport resize handling to clean up state
 * @param {HTMLElement} nav
 */
function setupViewportResize(nav) {
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
  });
}

/**
 * Loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : '/content/nav';

  const navContent = await fetchNav(navPath);
  if (!navContent) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Extract 3 sections from nav content: brand, sections, tools
  const divs = [...navContent.children].filter((el) => el.tagName === 'DIV');
  const [brandDiv, sectionsDiv, toolsDiv] = divs;

  // --- Brand ---
  const navBrand = document.createElement('div');
  navBrand.className = 'nav-brand';
  if (brandDiv) {
    const brandLink = brandDiv.querySelector('a');
    if (brandLink) {
      const link = document.createElement('a');
      link.href = brandLink.href;
      link.className = 'nav-brand-link';
      link.setAttribute('aria-label', brandLink.textContent.trim());
      link.textContent = brandLink.textContent.trim();
      navBrand.append(link);
    }
  }

  // --- Nav Sections ---
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';

  if (sectionsDiv) {
    const mainList = sectionsDiv.querySelector('ul');
    if (mainList) {
      mainList.querySelectorAll(':scope > li').forEach((li) => {
        const navItem = document.createElement('div');
        const isCta = li.classList.contains('cta');
        navItem.className = isCta ? 'nav-item nav-cta' : 'nav-item';

        const trigger = li.querySelector(':scope > a') || li.querySelector(':scope > span');
        const subList = li.querySelector(':scope > ul');

        if (trigger) {
          const isLink = trigger.tagName === 'A';
          const triggerEl = document.createElement(isLink ? 'a' : 'span');
          triggerEl.className = 'nav-item-trigger';
          if (isLink) triggerEl.href = trigger.href;
          triggerEl.textContent = trigger.textContent.trim();
          navItem.append(triggerEl);
        }

        if (subList && !isCta) {
          const isMegamenu = trigger && trigger.getAttribute('data-type') === 'megamenu';
          navItem.setAttribute('aria-expanded', 'false');

          const dropdown = document.createElement('div');
          dropdown.className = 'dropdown-panel';
          const panelContent = isMegamenu
            ? buildMegamenuContent(subList)
            : buildStandardContent(subList);
          dropdown.append(panelContent);
          navItem.append(dropdown);

          if (isMegamenu) {
            setupCategoryTabs(dropdown);
            setupFeaturedHover(dropdown);
          }
        }

        navSections.append(navItem);
      });
    }
  }

  // --- Hamburger Button ---
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hbButton = document.createElement('button');
  hbButton.type = 'button';
  hbButton.setAttribute('aria-controls', 'nav');
  hbButton.setAttribute('aria-label', 'Open navigation');
  hbButton.innerHTML = '<span class="hamburger-bar"></span><span class="hamburger-bar"></span><span class="hamburger-bar"></span>';
  hamburger.append(hbButton);

  // --- Tools Panel (hamburger dropdown content) ---
  const toolsPanel = document.createElement('div');
  toolsPanel.className = 'nav-tools-panel';
  toolsPanel.setAttribute('aria-hidden', 'true');
  if (toolsDiv) {
    const toolsList = toolsDiv.querySelector('ul');
    if (toolsList) {
      toolsPanel.append(buildStandardContent(toolsList));
    }
  }

  // --- Assemble ---
  nav.append(hamburger, navBrand, navSections, toolsPanel);

  // Setup interactions
  setupDesktopHover(nav);
  setupHamburger(nav);
  setupViewportResize(nav);

  // Wrap in nav-wrapper
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.textContent = '';
  block.append(navWrapper);
}
