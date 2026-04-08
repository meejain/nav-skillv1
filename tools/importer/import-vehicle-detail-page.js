/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroProductParser from './parsers/hero-product.js';
import tabsDesignParser from './parsers/tabs-design.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import carouselGalleryParser from './parsers/carousel-gallery.js';
import columnsMediaParser from './parsers/columns-media.js';
import accordionTechParser from './parsers/accordion-tech.js';
import cardsGalleryParser from './parsers/cards-gallery.js';
import carouselLifestyleParser from './parsers/carousel-lifestyle.js';
import columnsCompareParser from './parsers/columns-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/hyundai-cleanup.js';
import sectionsTransformer from './transformers/hyundai-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-product': heroProductParser,
  'tabs-design': tabsDesignParser,
  'cards-feature': cardsFeatureParser,
  'carousel-gallery': carouselGalleryParser,
  'columns-media': columnsMediaParser,
  'accordion-tech': accordionTechParser,
  'cards-gallery': cardsGalleryParser,
  'carousel-lifestyle': carouselLifestyleParser,
  'columns-compare': columnsCompareParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'vehicle-detail-page',
  description: 'Vehicle detail page showcasing a specific Hyundai model with features, specs, gallery, and CTAs',
  urls: ['https://www.hyundai.com.br/veiculos/novo-hyundai-creta.html'],
  blocks: [
    { name: 'hero-product', instances: ['.product-banner'] },
    { name: 'tabs-design', instances: ['.product-design'] },
    { name: 'cards-feature', instances: ['.container-colors'] },
    { name: 'carousel-gallery', instances: ['.container-colors .product-carousel'] },
    { name: 'columns-media', instances: ['#creta_potamalas'] },
    { name: 'accordion-tech', instances: ['#tecnologia-e-conectividade .product-accordion'] },
    { name: 'cards-gallery', instances: ["[id$='product_gallery']", "[id$='product_gallery_282470564']"] },
    { name: 'carousel-lifestyle', instances: ['.product-parallax'] },
    { name: 'columns-compare', instances: ['.product-comparator'] },
  ],
  sections: [
    { id: 'section-1-hero-banner', name: 'Hero Banner', selector: '.product-banner', style: null, blocks: ['hero-product'], defaultContent: [] },
    { id: 'section-2-design', name: 'Design', selector: '.product-design', style: null, blocks: ['tabs-design'], defaultContent: [] },
    { id: 'section-3-performance-safety', name: 'Performance and Safety', selector: '.container-colors', style: null, blocks: ['cards-feature', 'carousel-gallery'], defaultContent: ['.container-colors > .product-header'] },
    { id: 'section-4-trunk-space', name: 'Trunk Space', selector: '#creta_potamalas', style: 'dark', blocks: ['columns-media'], defaultContent: [] },
    { id: 'section-5-technology', name: 'Technology', selector: '#tecnologia-e-conectividade', style: null, blocks: ['accordion-tech'], defaultContent: ['#tecnologia-e-conectividade > .product-header'] },
    { id: 'section-6-comfort', name: 'Comfort', selector: "[id$='product_gallery']:not([id$='product_gallery_282470564'])", style: null, blocks: ['cards-gallery'], defaultContent: ["[id$='product_gallery']:not([id$='product_gallery_282470564']) > .product-header"] },
    { id: 'section-7-accessories', name: 'Accessories', selector: "[id$='product_gallery_282470564']", style: null, blocks: ['cards-gallery'], defaultContent: ["[id$='product_gallery_282470564'] > .product-header"] },
    { id: 'section-8-parallax', name: 'Parallax Gallery', selector: '.product-parallax', style: null, blocks: ['carousel-lifestyle'], defaultContent: [] },
    { id: 'section-9-cta', name: 'Call to Action', selector: '#button_quote_add', style: 'dark', blocks: [], defaultContent: ['#button_quote_add'] },
    { id: 'section-10-comparator', name: 'Version Comparator', selector: '.product-comparator', style: null, blocks: ['columns-compare'], defaultContent: ['.product-comparator > .product-header'] },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. Execute afterTransform transformers (cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
