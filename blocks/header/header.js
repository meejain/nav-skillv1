import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const expanded = nav.querySelector('.nav-sections .nav-drop[aria-expanded="true"]');
    if (expanded) {
      expanded.setAttribute('aria-expanded', 'false');
      const panel = nav.querySelector(`.nav-megamenu-panel[data-section="${expanded.dataset.section}"]`);
      if (panel) panel.hidden = true;
    }
  }
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-drop').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function closeMegamenus(nav) {
  nav.querySelectorAll('.nav-megamenu-panel').forEach((panel) => { panel.hidden = true; });
  nav.querySelectorAll('.nav-drop').forEach((drop) => { drop.setAttribute('aria-expanded', 'false'); });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, false);
  closeMegamenus(nav);
  closeMobileSubPanels(navSections);
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

function buildMegamenuPanel(navItem) {
  const panel = document.createElement('div');
  panel.className = 'nav-megamenu-panel';
  panel.hidden = true;

  const subList = navItem.querySelector('ul');
  if (!subList) return null;

  const items = [...subList.children];
  const heading = items.length > 0 && !items[0].querySelector('a') ? items.shift() : null;
  const textLinks = [];
  const imageCards = [];

  items.forEach((item) => {
    const link = item.querySelector('a');
    const img = item.querySelector('img');
    if (img && link) {
      imageCards.push({ label: img.alt || link.textContent.trim(), url: link.href, img });
    } else if (link) {
      textLinks.push({ label: link.textContent.trim(), url: link.href, el: link });
    }
  });

  const inner = document.createElement('div');
  inner.className = 'nav-megamenu-inner';

  // Left column: heading + text links
  const leftCol = document.createElement('div');
  leftCol.className = 'nav-megamenu-links';
  if (heading) {
    const h3 = document.createElement('h3');
    h3.className = 'nav-megamenu-heading';
    const text = heading.textContent.trim();
    const words = text.split(' ');
    if (words.length > 1) {
      const last = words.pop();
      h3.innerHTML = `${words.join(' ')} <em>${last}</em>`;
    } else {
      h3.textContent = text;
    }
    leftCol.append(h3);
  }
  const linkList = document.createElement('ul');
  textLinks.forEach(({ label, url, el }) => {
    const li = document.createElement('li');
    const a = el.cloneNode(true);
    a.textContent = label;
    a.href = url;
    li.append(a);
    linkList.append(li);
  });
  leftCol.append(linkList);
  inner.append(leftCol);

  // Right column: image carousel
  if (imageCards.length > 0) {
    const rightCol = document.createElement('div');
    rightCol.className = 'nav-megamenu-carousel';

    const track = document.createElement('div');
    track.className = 'nav-megamenu-track';

    imageCards.forEach(({ label, url, img }) => {
      const card = document.createElement('a');
      card.className = 'nav-megamenu-card';
      card.href = url;
      const imgWrap = document.createElement('div');
      imgWrap.className = 'nav-megamenu-card-image';
      imgWrap.append(img.cloneNode(true));
      card.append(imgWrap);
      const cardLabel = document.createElement('span');
      cardLabel.className = 'nav-megamenu-card-label';
      cardLabel.textContent = label;
      card.append(cardLabel);
      track.append(card);
    });

    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-megamenu-prev';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '‹';
    prevBtn.disabled = true;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-megamenu-next';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '›';

    const updateButtons = () => {
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    };

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: -340, behavior: 'smooth' });
      setTimeout(updateButtons, 400);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      track.scrollBy({ left: 340, behavior: 'smooth' });
      setTimeout(updateButtons, 400);
    });

    track.addEventListener('scroll', updateButtons);

    rightCol.append(prevBtn, track, nextBtn);
    inner.append(rightCol);
  }

  panel.append(inner);
  return panel;
}

function buildMobileSubPanel(navItem, subList) {
  if (!subList) return null;

  const items = [...subList.children];
  const heading = items.length > 0 && !items[0].querySelector('a') ? items.shift() : null;
  const textLinks = [];
  const imageCards = [];

  items.forEach((item) => {
    const link = item.querySelector('a');
    const img = item.querySelector('img');
    if (img && link) {
      imageCards.push({ label: img.alt || link.textContent.trim(), url: link.href, img });
    } else if (link) {
      textLinks.push({ label: link.textContent.trim(), url: link.href, el: link });
    }
  });

  const panel = document.createElement('div');
  panel.className = 'nav-mobile-subpanel';

  // Label from the nav item text
  const label = navItem.childNodes[0]?.textContent?.trim()
    || navItem.textContent.trim().split('\n')[0].trim();

  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-mobile-back';
  backBtn.textContent = label;
  backBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.remove('is-open');
  });
  panel.append(backBtn);

  // Text links
  const linkList = document.createElement('ul');
  linkList.className = 'nav-mobile-subpanel-links';
  textLinks.forEach(({ label: lbl, url, el }) => {
    const li = document.createElement('li');
    const a = el.cloneNode(true);
    a.textContent = lbl;
    a.href = url;
    li.append(a);
    linkList.append(li);
  });
  panel.append(linkList);

  // Heading
  if (heading) {
    const h3 = document.createElement('h3');
    h3.className = 'nav-mobile-subpanel-heading';
    const text = heading.textContent.trim();
    const words = text.split(' ');
    if (words.length > 1) {
      const last = words.pop();
      h3.innerHTML = `${words.join(' ')} <em>${last}</em>`;
    } else {
      h3.textContent = text;
    }
    panel.append(h3);
  }

  // Image carousel
  if (imageCards.length > 0) {
    const carousel = document.createElement('div');
    carousel.className = 'nav-mobile-subpanel-carousel';
    imageCards.forEach(({ label: lbl, url, img }) => {
      const card = document.createElement('a');
      card.className = 'nav-mobile-subpanel-card';
      card.href = url;
      const imgWrap = document.createElement('div');
      imgWrap.className = 'nav-mobile-subpanel-card-image';
      imgWrap.append(img.cloneNode(true));
      card.append(imgWrap);
      const cardLabel = document.createElement('span');
      cardLabel.className = 'nav-mobile-subpanel-card-label';
      cardLabel.textContent = lbl;
      card.append(cardLabel);
      carousel.append(card);
    });
    panel.append(carousel);
  }

  return panel;
}

function closeMobileSubPanels(navSections) {
  if (!navSections) return;
  navSections.querySelectorAll('.nav-mobile-subpanel.is-open').forEach((p) => {
    p.classList.remove('is-open');
  });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Brand
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  // Sections with megamenu
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const topItems = navSections.querySelectorAll(':scope .default-content-wrapper > ul > li');
    topItems.forEach((navItem, idx) => {
      const subList = navItem.querySelector('ul');
      if (subList) {
        navItem.classList.add('nav-drop');
        navItem.dataset.section = `section-${idx}`;

        // Build desktop megamenu panel
        const panel = buildMegamenuPanel(navItem);

        // Build mobile slide-in sub-panel (before removing subList)
        const mobilePanel = buildMobileSubPanel(navItem, subList);

        if (panel) {
          panel.dataset.section = `section-${idx}`;
          subList.remove();
          nav.append(panel);
        }

        if (mobilePanel) {
          navSections.append(mobilePanel);
        }

        navItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isDesktop.matches) {
            // Desktop: toggle megamenu
            const isExpanded = navItem.getAttribute('aria-expanded') === 'true';
            closeMegamenus(nav);
            if (!isExpanded) {
              navItem.setAttribute('aria-expanded', 'true');
              if (panel) panel.hidden = false;
            }
          } else if (mobilePanel) {
            // Mobile: open slide-in sub-panel
            closeMobileSubPanels(navSections);
            mobilePanel.classList.add('is-open');
          }
        });
      }
    });
  }

  // Tools: convert to icon buttons with text for mobile
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolLinks = navTools.querySelectorAll('a');
    toolLinks.forEach((link) => {
      const text = link.textContent.trim().toLowerCase();
      const displayText = link.textContent.trim();
      link.className = `nav-tool-link nav-tool-${text}`;
      link.setAttribute('aria-label', displayText);
      let svg = '';
      if (text === 'search') {
        svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
      } else if (text === 'boutiques') {
        svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>';
      } else if (text === 'login') {
        svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      }
      link.innerHTML = `${svg}<span class="nav-tool-text">${displayText}</span>`;
    });
  }

  // Hamburger
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Close megamenu on click outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeMegamenus(nav);
    }
  });

  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
    closeMegamenus(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
