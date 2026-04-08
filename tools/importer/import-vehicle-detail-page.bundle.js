var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-vehicle-detail-page.js
  var import_vehicle_detail_page_exports = {};
  __export(import_vehicle_detail_page_exports, {
    default: () => import_vehicle_detail_page_default
  });

  // tools/importer/parsers/hero-product.js
  function parse(element, { document }) {
    const cells = [];
    const heroImg = element.querySelector("picture > img.img-fluid, .pb-container picture img");
    if (heroImg) cells.push([heroImg]);
    const contentCell = [];
    const heading = element.querySelector("h1, h2.pb-title, .pb-vehicle-name");
    if (heading) contentCell.push(heading);
    const subtitle = element.querySelector("h2.pb-title, .pb-description h2");
    if (subtitle && subtitle !== heading) contentCell.push(subtitle);
    const desc = element.querySelector("p.pb-text, .pb-description p");
    if (desc) contentCell.push(desc);
    const cta = element.querySelector("a.hyundai-button, button.hyundai-button");
    if (cta) {
      if (cta.tagName === "BUTTON") {
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = cta.textContent.trim();
        contentCell.push(a);
      } else {
        contentCell.push(cta);
      }
    }
    if (contentCell.length) cells.push(contentCell);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-design.js
  function parse2(element, { document }) {
    const cells = [];
    const extLabel = document.createElement("p");
    extLabel.textContent = "Design Externo";
    const extContent = document.createElement("div");
    const ext360 = element.querySelector(".pd-external360");
    const extDetails = element.querySelector(".pd-external");
    if (ext360) {
      const img360 = ext360.querySelector("img.preview, .reel360 img:last-of-type");
      if (img360) extContent.appendChild(img360);
    }
    if (extDetails) {
      const extItems = extDetails.querySelectorAll(".pc-item");
      extItems.forEach((item) => {
        const img = item.querySelector(".pc-item-thumb img, .pc-item-thumb-image");
        const title = item.querySelector("h4, .pc-item-title");
        if (img) extContent.appendChild(img);
        if (title) extContent.appendChild(title);
      });
    }
    cells.push([extLabel, extContent]);
    const intLabel = document.createElement("p");
    intLabel.textContent = "Design Interno";
    const intContent = document.createElement("div");
    const intSection = element.querySelector(".pd-internal");
    if (intSection) {
      const intItems = intSection.querySelectorAll(".pc-item");
      intItems.forEach((item) => {
        const img = item.querySelector(".pc-item-thumb img, .pc-item-thumb-image");
        const title = item.querySelector("h4, .pc-item-title");
        if (img) intContent.appendChild(img);
        if (title) intContent.appendChild(title);
      });
    }
    cells.push([intLabel, intContent]);
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-design", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function parse3(element, { document }) {
    const cells = [];
    const specItems = element.querySelectorAll(".ppt-item");
    specItems.forEach((item) => {
      const title = item.querySelector("h3, .ppt-item-title");
      const value = item.querySelector("h4, .ppt-item-text");
      const contentCell = [];
      if (title) contentCell.push(title);
      if (value) contentCell.push(value);
      if (contentCell.length) cells.push(contentCell);
    });
    if (cells.length === 0) {
      const colorButtons = element.querySelectorAll(".pd-external360-colors-content button");
      colorButtons.forEach((btn) => {
        const colorName = btn.querySelector("p");
        if (colorName) cells.push([colorName]);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-gallery.js
  function parse4(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll(".swiper-slide");
    slides.forEach((slide) => {
      const img = slide.querySelector(".pc-item-thumb img, .pc-item-thumb-image");
      const title = slide.querySelector("h4, .pc-item-title");
      const row = [];
      if (img) row.push(img);
      if (title) {
        if (row.length === 0) row.push("");
        row.push(title);
      }
      if (row.length) cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse5(element, { document }) {
    const cells = [];
    const textCol = [];
    const heading = element.querySelector("h2");
    if (heading) textCol.push(heading);
    const desc = element.querySelector("p");
    if (desc) textCol.push(desc);
    const cta = element.querySelector("button#cta, a.hyundai-button");
    if (cta) {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = cta.textContent.trim();
      textCol.push(a);
    }
    const mediaCol = [];
    const videoSource = element.querySelector("video source[src], video[src]");
    if (videoSource) {
      const videoUrl = videoSource.getAttribute("src");
      const a = document.createElement("a");
      a.href = videoUrl;
      a.textContent = videoUrl;
      mediaCol.push(a);
    }
    if (textCol.length || mediaCol.length) {
      cells.push([textCol.length ? textCol : "", mediaCol.length ? mediaCol : ""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-tech.js
  function parse6(element, { document }) {
    const cells = [];
    const items = element.querySelectorAll(".MuiAccordion-root");
    items.forEach((item) => {
      const title = item.querySelector(".accordion-title, .MuiAccordionSummary-content h4");
      const text = item.querySelector(".accordion-text, .MuiAccordionDetails-root p");
      const question = title ? title.textContent.trim() : "";
      const answer = text ? text.textContent.trim() : "";
      if (question) cells.push([question, answer]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-tech", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-gallery.js
  function parse7(element, { document }) {
    const cells = [];
    const items = element.querySelectorAll(".pg-item");
    items.forEach((item) => {
      const img = item.querySelector(".item-thumb img");
      const title = item.querySelector(".item-title, .item-hover h4");
      const row = [];
      if (img) row.push(img);
      if (title) row.push(title);
      if (row.length) cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-lifestyle.js
  function parse8(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll(".swiper-slide");
    slides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (img) cells.push([img]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-lifestyle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-compare.js
  function parse9(element, { document }) {
    const cells = [];
    const vehicles = element.querySelectorAll(".pc-vehicle, .comparator-vehicle");
    if (vehicles.length >= 2) {
      const col1 = [];
      const col2 = [];
      vehicles.forEach((vehicle, i) => {
        const img = vehicle.querySelector("img");
        const name = vehicle.querySelector("select, .version-name, h3, h4");
        const col = i === 0 ? col1 : col2;
        if (img) col.push(img);
        if (name) {
          const p = document.createElement("p");
          p.textContent = name.textContent.trim() || name.value || "";
          col.push(p);
        }
      });
      if (col1.length || col2.length) cells.push([col1, col2]);
    }
    const specRows = element.querySelectorAll('.pc-table tr, .comparison-row, [class*="spec-row"]');
    specRows.forEach((row) => {
      const tds = row.querySelectorAll("td, .spec-value");
      if (tds.length >= 2) {
        cells.push([tds[0], tds[1]]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-compare", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/hyundai-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [".hyundai-loading"]);
      WebImporter.DOMUtils.remove(element, [".hyundai-header"]);
      WebImporter.DOMUtils.remove(element, [".hyundai-footer"]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".onetrust-pc-dark-filter"
      ]);
      if (element.style.overflow === "hidden") {
        element.setAttribute("style", "overflow: scroll;");
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "noscript",
        "link",
        "source"
      ]);
    }
  }

  // tools/importer/transformers/hyundai-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const template = payload && payload.template;
      if (!template || !template.sections || template.sections.length < 2) return;
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document: element };
      const doc = element.ownerDocument || document;
      const sections = template.sections;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const selector = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selector) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) continue;
        if (section.style) {
          const sectionMetaBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetaBlock);
        }
        if (i > 0) {
          const hr = doc.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-vehicle-detail-page.js
  var parsers = {
    "hero-product": parse,
    "tabs-design": parse2,
    "cards-feature": parse3,
    "carousel-gallery": parse4,
    "columns-media": parse5,
    "accordion-tech": parse6,
    "cards-gallery": parse7,
    "carousel-lifestyle": parse8,
    "columns-compare": parse9
  };
  var PAGE_TEMPLATE = {
    name: "vehicle-detail-page",
    description: "Vehicle detail page showcasing a specific Hyundai model with features, specs, gallery, and CTAs",
    urls: ["https://www.hyundai.com.br/veiculos/novo-hyundai-creta.html"],
    blocks: [
      { name: "hero-product", instances: [".product-banner"] },
      { name: "tabs-design", instances: [".product-design"] },
      { name: "cards-feature", instances: [".container-colors"] },
      { name: "carousel-gallery", instances: [".container-colors .product-carousel"] },
      { name: "columns-media", instances: ["#creta_potamalas"] },
      { name: "accordion-tech", instances: ["#tecnologia-e-conectividade .product-accordion"] },
      { name: "cards-gallery", instances: ["[id$='product_gallery']", "[id$='product_gallery_282470564']"] },
      { name: "carousel-lifestyle", instances: [".product-parallax"] },
      { name: "columns-compare", instances: [".product-comparator"] }
    ],
    sections: [
      { id: "section-1-hero-banner", name: "Hero Banner", selector: ".product-banner", style: null, blocks: ["hero-product"], defaultContent: [] },
      { id: "section-2-design", name: "Design", selector: ".product-design", style: null, blocks: ["tabs-design"], defaultContent: [] },
      { id: "section-3-performance-safety", name: "Performance and Safety", selector: ".container-colors", style: null, blocks: ["cards-feature", "carousel-gallery"], defaultContent: [".container-colors > .product-header"] },
      { id: "section-4-trunk-space", name: "Trunk Space", selector: "#creta_potamalas", style: "dark", blocks: ["columns-media"], defaultContent: [] },
      { id: "section-5-technology", name: "Technology", selector: "#tecnologia-e-conectividade", style: null, blocks: ["accordion-tech"], defaultContent: ["#tecnologia-e-conectividade > .product-header"] },
      { id: "section-6-comfort", name: "Comfort", selector: "[id$='product_gallery']:not([id$='product_gallery_282470564'])", style: null, blocks: ["cards-gallery"], defaultContent: ["[id$='product_gallery']:not([id$='product_gallery_282470564']) > .product-header"] },
      { id: "section-7-accessories", name: "Accessories", selector: "[id$='product_gallery_282470564']", style: null, blocks: ["cards-gallery"], defaultContent: ["[id$='product_gallery_282470564'] > .product-header"] },
      { id: "section-8-parallax", name: "Parallax Gallery", selector: ".product-parallax", style: null, blocks: ["carousel-lifestyle"], defaultContent: [] },
      { id: "section-9-cta", name: "Call to Action", selector: "#button_quote_add", style: "dark", blocks: [], defaultContent: ["#button_quote_add"] },
      { id: "section-10-comparator", name: "Version Comparator", selector: ".product-comparator", style: null, blocks: ["columns-compare"], defaultContent: [".product-comparator > .product-header"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    return pageBlocks;
  }
  var import_vehicle_detail_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_vehicle_detail_page_exports);
})();
