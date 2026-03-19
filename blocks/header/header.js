import { getMetadata } from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Close all open dropdown panels and reset header state
 * @param {Element} nav The nav element
 */
function closeAllDropdowns(nav) {
  nav.querySelectorAll('.nav-item.is-active').forEach((item) => {
    item.classList.remove('is-active');
    item.setAttribute('aria-expanded', 'false');
  });
  const header = nav.closest('header');
  if (header) header.classList.remove('is-open');
}

/**
 * Open a specific dropdown panel (desktop)
 * @param {Element} nav The nav element
 * @param {Element} navItem The nav item to open
 */
function openDropdown(nav, navItem) {
  if (!navItem.querySelector('.nav-dropdown')) return;
  closeAllDropdowns(nav);
  navItem.classList.add('is-active');
  navItem.setAttribute('aria-expanded', 'true');
  const header = nav.closest('header');
  if (header) header.classList.add('is-open');
}

/**
 * Setup vehicle megamenu interactions — featured card updates on hover, tab filtering
 * @param {Element} dropdown The vehicle dropdown element
 */
function setupVehicleMegamenu(dropdown) {
  const featured = dropdown.querySelector('.vehicle-featured');
  if (!featured) return;

  const tabs = dropdown.querySelectorAll('.vehicle-tab');
  const cards = dropdown.querySelectorAll('.vehicle-card');
  const featuredName = featured.querySelector('.vehicle-featured-name');
  const featuredImage = featured.querySelector('.vehicle-featured-image');
  const featuredLink = featured.querySelector('.vehicle-featured-link');
  const specValues = featured.querySelectorAll('.spec-value');

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const { filter } = tab.dataset;
      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (featuredName) featuredName.textContent = card.dataset.name || '';
      const cardImg = card.querySelector('img');
      if (featuredImage && cardImg) {
        featuredImage.src = cardImg.src;
        featuredImage.alt = card.dataset.name || '';
      }
      if (featuredLink) featuredLink.href = card.href || '#';
      const specData = [
        card.dataset.motor,
        card.dataset.transmissao,
        card.dataset.potencia,
        card.dataset.torque,
      ];
      specValues.forEach((sv, i) => {
        if (specData[i] !== undefined) sv.textContent = specData[i];
      });
    });
  });
}

/**
 * Setup dealer search form
 * @param {Element} searchContainer The dealer search container
 */
function setupDealerSearch(searchContainer) {
  if (!searchContainer) return;
  const radios = searchContainer.querySelectorAll('input[type="radio"]');
  const input = searchContainer.querySelector('.dealer-search-form input[type="text"]');

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!input) return;
      if (radio.value === 'location') {
        input.style.display = 'none';
      } else {
        input.style.display = '';
        const placeholders = { name: 'NOME DA CONCESSIONÁRIA', cep: 'CEP' };
        input.placeholder = placeholders[radio.value] || '';
      }
    });
  });
}

/**
 * Open a mobile sub-panel (slide-in from right)
 * @param {Element} nav The nav element
 * @param {Element} navItem The nav item whose panel to show
 */
function openMobileSubPanel(nav, navItem) {
  const mobileMenu = nav.querySelector('.mobile-menu-container');
  if (!mobileMenu) return;
  const mainPanel = mobileMenu.querySelector('.mobile-main-panel');
  const subPanels = mobileMenu.querySelectorAll('.mobile-sub-panel');

  subPanels.forEach((p) => p.classList.remove('is-visible'));
  const targetPanel = mobileMenu.querySelector(`.mobile-sub-panel[data-id="${navItem.dataset.id}"]`);
  if (targetPanel) {
    mainPanel.classList.add('is-slid-left');
    targetPanel.classList.add('is-visible');
  }
}

/**
 * Close mobile sub-panel (slide back to main)
 * @param {Element} nav The nav element
 */
function closeMobileSubPanel(nav) {
  const mobileMenu = nav.querySelector('.mobile-menu-container');
  if (!mobileMenu) return;
  const mainPanel = mobileMenu.querySelector('.mobile-main-panel');
  mobileMenu.querySelectorAll('.mobile-sub-panel').forEach((p) => p.classList.remove('is-visible'));
  if (mainPanel) mainPanel.classList.remove('is-slid-left');
}

/**
 * Toggle mobile menu open/close
 * @param {Element} nav The nav element
 */
function toggleMobileMenu(nav) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = expanded ? '' : 'hidden';
  if (expanded) {
    closeAllDropdowns(nav);
    closeMobileSubPanel(nav);
  }
}

/**
 * Build the desktop nav items list from source content
 * @param {Element} sourceUl The source ul element from nav.plain.html
 * @param {Element} nav The nav element for event binding
 * @returns {Element} The built nav list
 */
function buildNavList(sourceUl, nav) {
  const navList = document.createElement('ul');
  navList.className = 'nav-list';

  sourceUl.querySelectorAll(':scope > li.nav-item').forEach((sourceItem) => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    if (sourceItem.dataset.id) li.dataset.id = sourceItem.dataset.id;
    if (sourceItem.classList.contains('nav-item-vehicles')) {
      li.classList.add('nav-item-vehicles');
    }

    const sourceLink = sourceItem.querySelector(':scope > a');
    if (sourceLink) {
      const trigger = document.createElement('a');
      trigger.href = sourceLink.getAttribute('href') || '#';
      trigger.textContent = sourceLink.textContent;
      trigger.className = 'nav-link';
      li.append(trigger);
    }

    const sourceDropdown = sourceItem.querySelector(':scope > .nav-dropdown');
    if (sourceDropdown) {
      li.setAttribute('aria-expanded', 'false');
      const panel = document.createElement('div');
      panel.className = 'nav-dropdown';
      if (sourceDropdown.classList.contains('nav-dropdown-vehicles')) {
        panel.classList.add('nav-dropdown-vehicles');
      }
      panel.innerHTML = sourceDropdown.innerHTML;
      li.append(panel);

      li.addEventListener('mouseenter', () => {
        if (isDesktop.matches) openDropdown(nav, li);
      });
    }

    navList.append(li);
  });

  return navList;
}

/**
 * Build mobile slide-in menu structure from nav sections and hamburger menu
 * @param {Element} navSections Source nav-sections element
 * @param {Element} hamburgerMenuSource Source hamburger-menu element
 * @param {Element} nav The nav element for event binding
 * @returns {Element} The mobile menu container
 */
function buildMobileMenu(navSections, hamburgerMenuSource, nav) {
  const container = document.createElement('div');
  container.className = 'mobile-menu-container';

  // Main panel (root level)
  const mainPanel = document.createElement('div');
  mainPanel.className = 'mobile-main-panel';

  // Ofertas CTA at top
  const ofertasCta = hamburgerMenuSource?.querySelector('.mobile-ofertas-cta');
  if (ofertasCta) {
    const ctaDiv = document.createElement('div');
    ctaDiv.className = 'mobile-ofertas-cta';
    ctaDiv.innerHTML = ofertasCta.innerHTML;
    mainPanel.append(ctaDiv);
  }

  // Nav items list
  const navItemsList = document.createElement('div');
  navItemsList.className = 'mobile-nav-items';

  const sourceUl = navSections?.querySelector(':scope > ul');
  if (sourceUl) {
    sourceUl.querySelectorAll(':scope > li.nav-item').forEach((sourceItem) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'mobile-nav-item';
      const itemId = sourceItem.dataset.id || '';
      itemDiv.dataset.id = itemId;
      const sourceLink = sourceItem.querySelector(':scope > a');
      const hasDropdown = !!sourceItem.querySelector(':scope > .nav-dropdown');
      const label = sourceLink?.textContent?.trim() || '';

      if (hasDropdown) {
        const btn = document.createElement('button');
        btn.className = 'mobile-nav-trigger';
        btn.innerHTML = `<span class="mobile-nav-label">${label}</span><span class="mobile-nav-chevron">&#8250;</span>`;
        btn.addEventListener('click', () => openMobileSubPanel(nav, itemDiv));
        itemDiv.append(btn);
      } else {
        const link = document.createElement('a');
        link.className = 'mobile-nav-trigger';
        link.href = sourceLink?.getAttribute('href') || '#';
        link.innerHTML = `<span class="mobile-nav-label">${label}</span><span class="mobile-nav-chevron">&#8250;</span>`;
        itemDiv.append(link);
      }

      navItemsList.append(itemDiv);
    });
  }
  mainPanel.append(navItemsList);

  // Institutional section (A Hyundai icon cards)
  const institutional = hamburgerMenuSource?.querySelector('.mobile-institutional');
  if (institutional) {
    const instDiv = document.createElement('div');
    instDiv.className = 'mobile-institutional';
    instDiv.innerHTML = institutional.innerHTML;
    mainPanel.append(instDiv);
  }

  // Extra links section
  const extraLinks = hamburgerMenuSource?.querySelector('.mobile-extra-links');
  if (extraLinks) {
    const extraDiv = document.createElement('div');
    extraDiv.className = 'mobile-extra-links';
    extraDiv.innerHTML = extraLinks.innerHTML;
    mainPanel.append(extraDiv);
  }

  container.append(mainPanel);

  // Sub-panels (one per dropdown)
  if (sourceUl) {
    sourceUl.querySelectorAll(':scope > li.nav-item').forEach((sourceItem) => {
      const dropdown = sourceItem.querySelector(':scope > .nav-dropdown');
      if (!dropdown) return;

      const itemId = sourceItem.dataset.id || '';
      const label = sourceItem.querySelector(':scope > a')?.textContent?.trim() || '';

      const subPanel = document.createElement('div');
      subPanel.className = 'mobile-sub-panel';
      subPanel.dataset.id = itemId;

      // Back button
      const backBtn = document.createElement('button');
      backBtn.className = 'mobile-back-btn';
      backBtn.innerHTML = `<span class="mobile-back-arrow">&#8249;</span><span>${label}</span>`;
      backBtn.addEventListener('click', () => closeMobileSubPanel(nav));
      subPanel.append(backBtn);

      // Panel content
      const panelContent = document.createElement('div');
      panelContent.className = 'mobile-sub-panel-content';
      panelContent.innerHTML = dropdown.innerHTML;
      subPanel.append(panelContent);

      container.append(subPanel);
    });
  }

  return container;
}

/**
 * Loads and decorates the header block
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return;

  const html = await resp.text();
  const parser = new DOMParser();
  const navDoc = parser.parseFromString(html, 'text/html');
  const sections = navDoc.querySelectorAll('body > div');

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Hamburger button (3 spans for morphing animation)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMobileMenu(nav));
  nav.append(hamburger);

  // Brand (logo)
  const brandSource = sections[0]?.querySelector('.nav-brand');
  if (brandSource) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    brand.innerHTML = brandSource.innerHTML;
    nav.append(brand);
  }

  // Desktop nav sections (visible only on desktop)
  const sectionsSource = sections[1]?.querySelector('.nav-sections');
  if (sectionsSource) {
    const navSections = document.createElement('div');
    navSections.className = 'nav-sections';
    const sourceUl = sectionsSource.querySelector(':scope > ul');
    if (sourceUl) {
      navSections.append(buildNavList(sourceUl, nav));
    }
    nav.append(navSections);
  }

  // Tools (CTA)
  const toolsSource = sections[2]?.querySelector('.nav-tools');
  if (toolsSource) {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    tools.innerHTML = toolsSource.innerHTML;
    nav.append(tools);
  }

  // Mobile slide-in menu (built from sections + hamburger menu)
  const hamburgerMenuSource = sections[3]?.querySelector('.nav-hamburger-menu');
  const mobileMenu = buildMobileMenu(
    sectionsSource,
    hamburgerMenuSource,
    nav,
  );
  nav.append(mobileMenu);

  // Wrap and mount
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.textContent = '';
  block.append(wrapper);

  // Setup desktop interactive components
  const vehicleDropdown = nav.querySelector('.nav-sections .nav-dropdown-vehicles');
  if (vehicleDropdown) setupVehicleMegamenu(vehicleDropdown);

  const dealerSearch = nav.querySelector('.nav-sections .nav-dealer-search');
  if (dealerSearch) setupDealerSearch(dealerSearch.closest('.nav-dropdown'));

  // Close dropdowns on mouse leave (desktop)
  nav.addEventListener('mouseleave', () => {
    if (isDesktop.matches) closeAllDropdowns(nav);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns(nav);
      if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
        toggleMobileMenu(nav);
      }
    }
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeAllDropdowns(nav);
    }
  });

  // Viewport resize — reset state when crossing breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllDropdowns(nav);
    closeMobileSubPanel(nav);
    nav.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
  });
}
