import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');
let closeTimeout = null;

function closeAllDropdowns(nav) {
  const panels = nav.querySelectorAll('.nav-dropdown-panel');
  panels.forEach((panel) => {
    panel.classList.remove('is-active');
  });
  const items = nav.querySelectorAll('.nav-item');
  items.forEach((item) => {
    item.classList.remove('is-active');
  });
  const header = nav.closest('.nav-wrapper');
  if (header) header.classList.remove('is-open');
  // reset active state
}

function openDropdown(nav, item, panel) {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  closeAllDropdowns(nav);
  item.classList.add('is-active');
  panel.classList.add('is-active');
  const header = nav.closest('.nav-wrapper');
  if (header) header.classList.add('is-open');
  // track active panel (via DOM class)
}

function buildIconCard(li) {
  const link = li.querySelector('a');
  if (!link) return li;
  const card = document.createElement('a');
  card.href = link.href;
  card.className = 'icon-card';
  const img = li.querySelector('img');
  if (img) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'icon-card-icon';
    iconWrap.append(img);
    card.append(iconWrap);
  }
  const labelWrap = document.createElement('span');
  labelWrap.className = 'icon-card-label';
  labelWrap.textContent = link.textContent.trim();
  card.append(labelWrap);
  return card;
}

function buildTextLink(li) {
  const link = li.querySelector('a');
  if (!link) return null;
  const a = document.createElement('a');
  a.href = link.href;
  a.className = 'text-link';
  a.textContent = link.textContent.trim();
  return a;
}

function buildStandardPanel(ul) {
  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel';
  const container = document.createElement('div');
  container.className = 'panel-container';

  const iconCards = [];
  const textLinks = [];

  ul.querySelectorAll(':scope > li').forEach((li) => {
    if (li.classList.contains('icon-card')) {
      iconCards.push(buildIconCard(li));
    } else {
      const link = buildTextLink(li);
      if (link) textLinks.push(link);
    }
  });

  if (iconCards.length) {
    const col = document.createElement('div');
    col.className = 'panel-col panel-col-icons';
    iconCards.forEach((card) => col.append(card));
    container.append(col);
  }
  if (textLinks.length) {
    const col = document.createElement('div');
    col.className = 'panel-col panel-col-links';
    textLinks.forEach((link) => col.append(link));
    container.append(col);
  }
  panel.append(container);
  return panel;
}

function updateFeatured(featured, card) {
  featured.innerHTML = '';
  const img = card.querySelector('img');
  if (img) {
    const imgEl = document.createElement('img');
    imgEl.src = img.src;
    imgEl.alt = img.alt;
    imgEl.className = 'featured-img';
    featured.append(imgEl);
  }
  const nameSpan = card.querySelector('.vehicle-card-name');
  if (nameSpan) {
    const nameEl = document.createElement('h3');
    nameEl.className = 'featured-name';
    nameEl.textContent = nameSpan.textContent;
    featured.append(nameEl);
  }
  const specsStr = card.getAttribute('data-specs');
  if (specsStr) {
    try {
      const specs = JSON.parse(specsStr);
      const specsList = document.createElement('dl');
      specsList.className = 'featured-specs';
      specs.forEach((s) => {
        const dt = document.createElement('dt');
        dt.textContent = s.label;
        const dd = document.createElement('dd');
        dd.textContent = s.value;
        specsList.append(dt, dd);
      });
      featured.append(specsList);
    } catch (e) { /* skip malformed specs */ }
  }
  const link = document.createElement('a');
  link.href = card.href;
  link.className = 'featured-link';
  link.textContent = 'Saiba mais';
  featured.append(link);
}

function buildVehiclesPanel(ul) {
  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel vehicles-panel';
  const container = document.createElement('div');
  container.className = 'panel-container';

  const vehicles = ul.querySelectorAll('.vehicle-card');
  const categories = new Set();
  vehicles.forEach((v) => {
    const cat = v.getAttribute('data-category');
    if (cat) categories.add(cat);
  });

  // Category tabs
  const tabs = document.createElement('div');
  tabs.className = 'vehicle-tabs';
  const allTab = document.createElement('button');
  allTab.className = 'vehicle-tab is-active';
  allTab.textContent = 'Todos';
  allTab.setAttribute('data-category', 'all');
  tabs.append(allTab);
  categories.forEach((cat) => {
    const tab = document.createElement('button');
    tab.className = 'vehicle-tab';
    tab.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    tab.setAttribute('data-category', cat);
    tabs.append(tab);
  });
  container.append(tabs);

  // Featured vehicle area
  const featured = document.createElement('div');
  featured.className = 'vehicle-featured';
  container.append(featured);

  // Vehicle grid
  const grid = document.createElement('div');
  grid.className = 'vehicle-grid';
  vehicles.forEach((v) => {
    const link = v.querySelector('a');
    if (!link) return;
    const card = document.createElement('a');
    card.href = link.href;
    card.className = 'vehicle-card-item';
    card.setAttribute('data-category', v.getAttribute('data-category') || '');
    card.setAttribute('data-vehicle', v.getAttribute('data-vehicle') || '');

    const img = v.querySelector('img');
    if (img) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'vehicle-card-img';
      imgWrap.append(img.cloneNode(true));
      card.append(imgWrap);
    }
    const name = v.querySelector('.vehicle-name');
    if (name) {
      const nameEl = document.createElement('span');
      nameEl.className = 'vehicle-card-name';
      nameEl.textContent = name.textContent;
      card.append(nameEl);
    }
    // Store specs for featured area
    const specs = v.querySelectorAll('.vehicle-spec');
    if (specs.length) {
      const specsData = [];
      specs.forEach((s) => {
        specsData.push({ label: s.getAttribute('data-label'), value: s.textContent });
      });
      card.setAttribute('data-specs', JSON.stringify(specsData));
    }
    grid.append(card);
  });
  container.append(grid);

  // Set first vehicle as featured
  const firstCard = grid.querySelector('.vehicle-card-item');
  if (firstCard) {
    updateFeatured(featured, firstCard);
    firstCard.classList.add('is-featured');
  }

  // Tab filtering
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.vehicle-tab');
    if (!tab) return;
    tabs.querySelectorAll('.vehicle-tab').forEach((t) => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    const cat = tab.getAttribute('data-category');
    grid.querySelectorAll('.vehicle-card-item').forEach((c) => {
      c.style.display = (cat === 'all' || c.getAttribute('data-category') === cat) ? '' : 'none';
    });
  });

  // Hover to update featured
  grid.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.vehicle-card-item');
    if (!card) return;
    grid.querySelectorAll('.vehicle-card-item').forEach((c) => c.classList.remove('is-featured'));
    card.classList.add('is-featured');
    updateFeatured(featured, card);
  });

  panel.append(container);
  return panel;
}

function buildDealerPanel(ul) {
  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel dealer-panel';
  const container = document.createElement('div');
  container.className = 'panel-container';

  const iconCards = [];
  let dealerSearch = null;

  ul.querySelectorAll(':scope > li').forEach((li) => {
    if (li.classList.contains('icon-card')) {
      iconCards.push(buildIconCard(li));
    } else if (li.classList.contains('dealer-search')) {
      dealerSearch = li;
    }
  });

  if (iconCards.length) {
    const col = document.createElement('div');
    col.className = 'panel-col panel-col-icons';
    iconCards.forEach((card) => col.append(card));
    container.append(col);
  }
  if (dealerSearch) {
    const col = document.createElement('div');
    col.className = 'panel-col panel-col-dealer';
    col.innerHTML = dealerSearch.innerHTML;
    container.append(col);
  }
  panel.append(container);
  return panel;
}

function buildHamburgerDrawer(toolsSection) {
  const drawer = document.createElement('div');
  drawer.className = 'hamburger-drawer';

  const drawerInner = toolsSection.querySelector('.hamburger-drawer');
  if (!drawerInner) return drawer;

  const iconList = drawerInner.querySelector('.drawer-icon-cards');
  if (iconList) {
    const iconSection = document.createElement('div');
    iconSection.className = 'drawer-icons';
    iconList.querySelectorAll('li').forEach((li) => {
      iconSection.append(buildIconCard(li));
    });
    drawer.append(iconSection);
  }

  const textList = drawerInner.querySelector('.drawer-text-links');
  if (textList) {
    const textSection = document.createElement('div');
    textSection.className = 'drawer-links';
    textList.querySelectorAll('li').forEach((li) => {
      const link = buildTextLink(li);
      if (link) textSection.append(link);
    });
    drawer.append(textSection);
  }
  return drawer;
}

function buildHamburgerIcon() {
  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.setAttribute('aria-label', 'Menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="hamburger-bars"><span class="bar bar-1"></span><span class="bar bar-2"></span><span class="bar bar-3"></span></span>';
  return btn;
}

function buildMobileSubPanel(label, items) {
  const panel = document.createElement('div');
  panel.className = 'mobile-sub-panel';

  const backBtn = document.createElement('button');
  backBtn.className = 'mobile-back-btn';
  backBtn.innerHTML = `<span class="mobile-back-arrow">&lsaquo;</span> ${label}`;
  panel.append(backBtn);

  const list = document.createElement('div');
  list.className = 'mobile-sub-list';

  items.forEach((item) => {
    if (item.isIconCard) {
      const card = document.createElement('a');
      card.href = item.href;
      card.className = 'mobile-icon-card';
      if (item.imgSrc) {
        const img = document.createElement('img');
        img.src = item.imgSrc;
        img.alt = item.label;
        card.append(img);
      }
      const span = document.createElement('span');
      span.textContent = item.label;
      card.append(span);
      list.append(card);
    } else if (item.isDealerSearch) {
      list.append(item.element.cloneNode(true));
    } else {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'mobile-sub-link';
      a.textContent = item.label;
      list.append(a);
    }
  });

  panel.append(list);
  return panel;
}

function resetMobileSlide(mobileMenu) {
  if (!mobileMenu) return;
  mobileMenu.style.transform = '';
}

function slideMobileToPanel(mobileMenu, panelIndex) {
  if (!mobileMenu) return;
  const offset = panelIndex * -100;
  mobileMenu.style.transform = `translateX(${offset}vw)`;
}

function buildMobileMenu(navSections, toolsSection) {
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';

  const slider = document.createElement('div');
  slider.className = 'mobile-slider';

  // Main panel (panel 0)
  const mainPanel = document.createElement('div');
  mainPanel.className = 'mobile-main-panel';

  // Extract nav items from sections
  const ul = navSections
    ? (navSections.querySelector(':scope .default-content-wrapper > ul')
    || navSections.querySelector('ul'))
    : null;

  const subPanels = [];

  if (ul) {
    // Collect all list items, then reorder: CTAs first, then rest
    const allLis = [...ul.querySelectorAll(':scope > li')];
    const ctaLis = allLis.filter((li) => li.classList.contains('nav-cta'));
    const otherLis = allLis.filter((li) => !li.classList.contains('nav-cta'));
    const orderedLis = [...ctaLis, ...otherLis];

    orderedLis.forEach((li) => {
      const triggerLink = li.querySelector(':scope > a') || li.querySelector(':scope > span');
      const label = triggerLink?.textContent?.trim() || '';
      const href = triggerLink?.tagName === 'A' ? triggerLink.href : null;
      const subUl = li.querySelector(':scope > ul');
      const isCta = li.classList.contains('nav-cta');

      if (isCta) {
        // Ofertas CTA - highlighted row
        const row = document.createElement('a');
        row.className = 'mobile-nav-item mobile-nav-cta';
        row.href = href || '#';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mobile-nav-label';
        labelSpan.textContent = label;
        row.append(labelSpan);
        mainPanel.append(row);
      } else if (subUl) {
        // Has sub-menu — create button with chevron
        const row = document.createElement('button');
        row.className = 'mobile-nav-item mobile-nav-expandable';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mobile-nav-label';
        labelSpan.textContent = label;
        row.append(labelSpan);
        const chevron = document.createElement('span');
        chevron.className = 'mobile-nav-chevron';
        chevron.textContent = '›';
        row.append(chevron);
        mainPanel.append(row);

        // Build sub-panel items
        const items = [];
        subUl.querySelectorAll(':scope > li').forEach((subLi) => {
          if (subLi.classList.contains('vehicle-card')) {
            const a = subLi.querySelector('a');
            const img = subLi.querySelector('img');
            const name = subLi.querySelector('.vehicle-name');
            items.push({
              isIconCard: true,
              href: a?.href || '#',
              imgSrc: img?.src || '',
              label: name?.textContent?.trim() || a?.textContent?.trim() || '',
            });
          } else if (subLi.classList.contains('icon-card')) {
            const a = subLi.querySelector('a');
            const img = subLi.querySelector('img');
            // Extract text from link excluding image alt
            let cardLabel = '';
            if (a) {
              const nodes = [];
              a.childNodes.forEach((n) => {
                if (n.nodeType === 3) nodes.push(n.textContent.trim());
              });
              cardLabel = nodes.join(' ').trim() || img?.alt || '';
            }
            items.push({
              isIconCard: true,
              href: a?.href || '#',
              imgSrc: img?.src || '',
              label: cardLabel,
            });
          } else if (subLi.classList.contains('dealer-search')) {
            items.push({ isDealerSearch: true, element: subLi });
          } else {
            const a = subLi.querySelector('a');
            if (a) {
              items.push({
                href: a.href,
                label: a.textContent.trim(),
              });
            }
          }
        });

        const subPanel = buildMobileSubPanel(label, items);
        subPanels.push(subPanel);

        // Link button to panel index
        const panelIdx = subPanels.length; // 1-based (0 is main panel)
        row.addEventListener('click', () => {
          slideMobileToPanel(slider, panelIdx);
        });

        // Back button handler
        subPanel.querySelector('.mobile-back-btn').addEventListener('click', () => {
          slideMobileToPanel(slider, 0);
        });
      } else if (href) {
        // Direct link (e.g. Alugar)
        const row = document.createElement('a');
        row.className = 'mobile-nav-item';
        row.href = href;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'mobile-nav-label';
        labelSpan.textContent = label;
        row.append(labelSpan);
        const chevron = document.createElement('span');
        chevron.className = 'mobile-nav-chevron';
        chevron.textContent = '›';
        row.append(chevron);
        mainPanel.append(row);
      }
    });
  }

  // Secondary sections from tools/drawer
  if (toolsSection) {
    const drawerInner = toolsSection.querySelector('.hamburger-drawer');
    if (drawerInner) {
      const iconList = drawerInner.querySelector('.drawer-icon-cards');
      if (iconList) {
        const section = document.createElement('div');
        section.className = 'mobile-utility-section';
        iconList.querySelectorAll('li').forEach((li) => {
          const a = li.querySelector('a');
          const img = li.querySelector('img');
          if (a) {
            const card = document.createElement('a');
            card.href = a.href;
            card.className = 'mobile-utility-item';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'mobile-utility-label';
            // Extract text content excluding img alt text
            const textNodes = [];
            a.childNodes.forEach((n) => {
              if (n.nodeType === 3) textNodes.push(n.textContent.trim());
            });
            labelSpan.textContent = textNodes.join(' ').trim() || img?.alt || '';
            card.append(labelSpan);
            if (img) {
              const icon = document.createElement('span');
              icon.className = 'mobile-utility-icon';
              icon.append(img.cloneNode(true));
              card.append(icon);
            }
            section.append(card);
          }
        });
        mainPanel.append(section);
      }

      const textList = drawerInner.querySelector('.drawer-text-links');
      if (textList) {
        const section = document.createElement('div');
        section.className = 'mobile-extra-links';
        textList.querySelectorAll('li').forEach((li) => {
          const a = li.querySelector('a');
          if (a) {
            const link = document.createElement('a');
            link.href = a.href;
            link.className = 'mobile-extra-link';
            link.textContent = a.textContent.trim();
            section.append(link);
          }
        });
        mainPanel.append(section);
      }
    }
  }

  slider.append(mainPanel);
  subPanels.forEach((p) => slider.append(p));

  menu.append(slider);
  return menu;
}

function toggleHamburger(nav, forceClose = false) {
  const wrapper = nav.closest('.nav-wrapper');
  const btn = nav.querySelector('.hamburger-btn');
  const drawerEl = nav.querySelector('.hamburger-drawer');
  const mobileMenu = nav.querySelector('.mobile-menu');
  const isOpen = wrapper.classList.contains('drawer-open');

  if (forceClose || isOpen) {
    wrapper.classList.remove('drawer-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menu');
    if (drawerEl) drawerEl.classList.remove('is-active');
    if (mobileMenu) {
      mobileMenu.classList.remove('is-active');
      resetMobileSlide(mobileMenu);
    }
    document.body.style.overflow = '';
  } else {
    closeAllDropdowns(nav);
    wrapper.classList.add('drawer-open');
    wrapper.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Fechar menu');
    if (!isDesktop.matches && mobileMenu) {
      mobileMenu.classList.add('is-active');
      resetMobileSlide(mobileMenu);
      document.body.style.overflow = 'hidden';
    } else if (drawerEl) {
      drawerEl.classList.add('is-active');
    }
  }
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Assign section classes
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Clean up brand link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = 'nav-brand-link';
      const p = brandLink.closest('p');
      if (p) p.className = '';
    }
  }

  // Build mobile menu BEFORE transforming navSections (needs original UL)
  const navSections = nav.querySelector('.nav-sections');
  const preToolsSection = nav.querySelector('.nav-tools');
  const mobileMenu = buildMobileMenu(navSections, preToolsSection);

  // Build nav items with dropdown panels
  if (navSections) {
    const ul = navSections.querySelector(':scope .default-content-wrapper > ul')
      || navSections.querySelector('ul');
    if (ul) {
      const navItems = document.createElement('div');
      navItems.className = 'nav-items';

      ul.querySelectorAll(':scope > li').forEach((li) => {
        const item = document.createElement('div');
        item.className = 'nav-item';

        if (li.classList.contains('nav-cta')) {
          item.classList.add('nav-cta');
        }

        // Trigger (link or span)
        const triggerSource = li.querySelector(':scope > a') || li.querySelector(':scope > span');
        const trigger = document.createElement(triggerSource?.tagName === 'A' ? 'a' : 'button');
        trigger.className = 'nav-item-trigger';
        if (triggerSource?.tagName === 'A') {
          trigger.href = triggerSource.href;
        }
        trigger.textContent = triggerSource?.textContent?.trim() || '';
        item.append(trigger);

        // Dropdown panel
        const subUl = li.querySelector(':scope > ul');
        if (subUl) {
          let panel;
          if (subUl.classList.contains('vehicles-megamenu')) {
            panel = buildVehiclesPanel(subUl);
          } else if (subUl.querySelector('.dealer-search')) {
            panel = buildDealerPanel(subUl);
          } else {
            panel = buildStandardPanel(subUl);
          }
          item.append(panel);
          item.classList.add('has-dropdown');

          // Desktop hover behavior
          item.addEventListener('mouseenter', () => {
            if (isDesktop.matches) {
              openDropdown(nav, item, panel);
            }
          });
          item.addEventListener('mouseleave', () => {
            if (isDesktop.matches) {
              closeTimeout = setTimeout(() => {
                closeAllDropdowns(nav);
              }, 200);
            }
          });
          panel.addEventListener('mouseenter', () => {
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              closeTimeout = null;
            }
          });
          panel.addEventListener('mouseleave', () => {
            if (isDesktop.matches) {
              closeTimeout = setTimeout(() => {
                closeAllDropdowns(nav);
              }, 200);
            }
          });
        }
        navItems.append(item);
      });

      const wrapper = navSections.querySelector('.default-content-wrapper') || ul.parentElement;
      if (wrapper && wrapper !== navSections) {
        wrapper.replaceWith(navItems);
      } else {
        navSections.innerHTML = '';
        navSections.append(navItems);
      }
    }
  }

  // Build hamburger
  const hamburgerBtn = buildHamburgerIcon();
  hamburgerBtn.addEventListener('click', () => toggleHamburger(nav));

  // Build hamburger drawer from tools section (desktop)
  const toolsSection = nav.querySelector('.nav-tools');
  let drawer = null;

  if (toolsSection) {
    drawer = buildHamburgerDrawer(toolsSection);
    toolsSection.replaceWith(drawer);
  }

  // Assemble nav
  const headerContainer = document.createElement('div');
  headerContainer.className = 'header-container';
  headerContainer.append(hamburgerBtn);
  if (navBrand) headerContainer.append(navBrand);
  if (navSections) headerContainer.append(navSections);

  nav.innerHTML = '';
  nav.append(headerContainer);
  if (drawer) nav.append(drawer);
  nav.append(mobileMenu);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Close dropdowns on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns(nav);
      const wrapper = nav.closest('.nav-wrapper');
      if (wrapper.classList.contains('drawer-open')) {
        toggleHamburger(nav, true);
      }
    }
  });

  // Viewport resize handling
  isDesktop.addEventListener('change', () => {
    closeAllDropdowns(nav);
    const wrapper = nav.closest('.nav-wrapper');
    if (wrapper && wrapper.classList.contains('drawer-open')) {
      toggleHamburger(nav, true);
    }
  });
}
