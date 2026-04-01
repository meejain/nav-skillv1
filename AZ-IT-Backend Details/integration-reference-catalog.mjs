/**
 * Reference entries for www.astrazeneca.it (Italy public site).
 *
 * This catalog is scoped to the Italian corporate / patient site — not Japan MediChannel,
 * not JP-only search/login stacks. Entries are either observed on IT crawls or standard
 * AEM/analytics stack that may load via Tealium without appearing as a direct network host.
 */
export const INTEGRATION_REFERENCE = [
  {
    id: 'tealium-iq',
    title: 'Tealium iQ Tag Management',
    matchHost: (h) =>
      /(^|\.)tiqcdn\.com$/i.test(h)
      || /(^|\.)tealiumiq\.com$/i.test(h)
      || /^tealium\.com$/i.test(h)
      || h.endsWith('.tealium.com'),
    vendor: 'Tealium, Inc.',
    category: 'Tag management / customer data platform orchestration',
    configuration: [
      'Scripts: `utag.js` / `utag.sync.js` from the AstraZeneca Italy profile under `tags.tiqcdn.com/utag/astrazeneca/...` (confirm path in crawl JSON).',
      'Page may populate `window.utag_data` before `utag.js` loads.',
      'Post-load (profile-dependent): `collect.tealiumiq.com`, `visitor-service-*.tealiumiq.com`, etc.',
    ],
    whyThirdParty:
      'Tealium operates the CDN and tag delivery outside `www.astrazeneca.it`. It can load vendor scripts, cookies, and forward data per the iQ profile.',
    dataFlows:
      'Browser → Tealium → configured analytics, pixels, consent, and other tags (profile-specific).',
  },
  {
    id: 'adobe-experience-cloud',
    title: 'Adobe Experience Cloud / Analytics (data collection)',
    matchHost: (h) => /omtrdc\.net$/i.test(h) || /\.2o7\.net$/i.test(h) || /demdex\.net$/i.test(h),
    vendor: 'Adobe Inc.',
    category: 'Analytics / Experience Cloud data collection',
    configuration: [
      'Beacons to `*.omtrdc.net` / `2o7.net`-style Adobe collection hosts when the Tealium profile loads Adobe tags.',
      'Audience Manager / ID: `*.demdex.net` when configured.',
    ],
    whyThirdParty:
      'Hits go to Adobe-operated infrastructure, not to `www.astrazeneca.it`.',
    dataFlows: 'Analytics and ID-sync payloads per Adobe configuration.',
  },
  {
    id: 'adobe-helix-rum',
    title: 'Adobe Helix RUM (Real User Monitoring)',
    matchHost: (h) => /(^|\.)hlx\.page$/i.test(h) || /(^|\.)rum\.hlx\.page$/i.test(h),
    vendor: 'Adobe Inc.',
    category: 'Performance / observability',
    configuration: [
      'Script such as `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/micro.js` (confirm in network proof).',
    ],
    whyThirdParty:
      'RUM to Adobe Helix / Edge Delivery monitoring, separate from the page origin.',
    dataFlows: 'Performance and navigation telemetry.',
  },
  {
    id: 'cookie-cookiereports',
    title: 'Cookie Reports (organisational consent / policy UI)',
    matchHost: (h) => /(^|\.)cookiereports\.com$/i.test(h),
    vendor: 'Cookie Reports (organisational vendor; confirm contract)',
    category: 'Consent / cookie banner tooling',
    configuration: [
      'Scripts and policy panels served from `policy.cookiereports.com` (and related paths) as referenced from the site.',
    ],
    whyThirdParty:
      'Served from a non-`astrazeneca.it` hostname; governs consent UI and related assets.',
    dataFlows: 'Consent state, policy display, and any vendor-configured measurement tied to that product.',
  },
  {
    id: 'adobe-typekit',
    title: 'Adobe Fonts (Typekit)',
    matchHost: (h) => /(^|\.)typekit\.net$/i.test(h),
    vendor: 'Adobe Inc.',
    category: 'Fonts / typography CDN',
    configuration: ['CSS and font files from `use.typekit.net`, `p.typekit.net`, etc.'],
    whyThirdParty: 'Font delivery from Adobe-operated domains.',
    dataFlows: 'Font requests; possible Adobe logging per their terms.',
  },
  {
    id: 'public-js-cdn',
    title: 'Public JavaScript CDNs (jQuery, cdnjs)',
    matchHost: (h) => /^code\.jquery\.com$/i.test(h) || /^cdnjs\.cloudflare\.com$/i.test(h),
    vendor: 'jQuery / Cloudflare',
    category: 'JavaScript libraries',
    configuration: [
      'Common AEM / tag bundles reference `code.jquery.com` and `cdnjs.cloudflare.com` for jQuery and migrate scripts.',
    ],
    whyThirdParty: 'Scripts are executed from third-party origins.',
    dataFlows: 'Script delivery; CDN operator may log requests.',
  },
  {
    id: 'kaltura',
    title: 'Kaltura (video)',
    matchHost: (h) => /(^|\.)kaltura\.com$/i.test(h),
    vendor: 'Kaltura, Inc.',
    category: 'Video hosting / player',
    configuration: ['Embeds or player assets when video components reference Kaltura hosts.'],
    whyThirdParty: 'Video platform outside `www.astrazeneca.it`.',
    dataFlows: 'Streaming, analytics, and player events per Kaltura configuration.',
  },
  {
    id: 'ad-tech-display',
    title: 'Ad serving / measurement (Flashtalking, Innovid, Digital Control Room)',
    matchHost: (h) =>
      /(^|\.)flashtalking\.com$/i.test(h)
      || /(^|\.)innovid\.com$/i.test(h)
      || /(^|\.)digitalcontrolroom\.com$/i.test(h),
    vendor: 'Multiple (Flashtalking, Innovid, Digital Control Room)',
    category: 'Advertising / campaign measurement',
    configuration: [
      'Often reached via links or tags in marketing / campaign content; confirm paths in crawl proof.',
    ],
    whyThirdParty: 'Separate ad-tech vendors from the first-party origin.',
    dataFlows: 'Campaign measurement, pixels, or redirects as configured.',
  },
  {
    id: 'microsoft-privacy-support',
    title: 'Microsoft (privacy and support links)',
    matchHost: (h) =>
      /^privacy\.microsoft\.com$/i.test(h)
      || /^support\.microsoft\.com$/i.test(h)
      || /^www\.microsoft\.com$/i.test(h),
    vendor: 'Microsoft Corporation',
    category: 'Privacy documentation / support (cookie policy text)',
    configuration: [
      'Linked from cookie / privacy copy (e.g. Edge cookie guidance, Microsoft privacy pages).',
    ],
    whyThirdParty: 'Content and assets on Microsoft-operated domains.',
    dataFlows: 'Typically navigation only unless embedded resources load.',
  },
  {
    id: 'google',
    title: 'Google',
    matchHost: (h) => (
      /(^|\.)google\.(com|it)$/i.test(h)
      || /^support\.google\.com$/i.test(h)
      || /(^|\.)gstatic\.com$/i.test(h)
      || /(^|\.)googleapis\.com$/i.test(h)
    ),
    vendor: 'Google LLC',
    category: 'Analytics / fonts / embeds / support links',
    configuration: [
      'May include `support.google.com` from cookie-help text; other Google hosts often arrive via Tealium-loaded tags.',
    ],
    whyThirdParty: 'Google-operated infrastructure.',
    dataFlows: 'Varies by tag (analytics, fonts, embeds).',
  },
  {
    id: 'browser-vendor-support',
    title: 'Browser vendor documentation (Apple, Mozilla)',
    matchHost: (h) => /^support\.apple\.com$/i.test(h) || /^support\.mozilla\.org$/i.test(h),
    vendor: 'Apple Inc. / Mozilla',
    category: 'Support / cookie documentation (links in policy copy)',
    configuration: ['Linked from privacy or cookie notices (Safari / Firefox cookie guidance).'],
    whyThirdParty: 'Documentation hosted on vendor domains.',
    dataFlows: 'Usually page navigation only.',
  },
  {
    id: 'amazon-privacy-links',
    title: 'Amazon (privacy / AWS policy links)',
    matchHost: (h) => /^aws\.amazon\.com$/i.test(h) || /^www\.amazon\.com$/i.test(h),
    vendor: 'Amazon.com, Inc.',
    category: 'Linked policy / infrastructure documentation',
    configuration: ['Often linked from cookie or privacy disclosures (e.g. load balancing / privacy pages).'],
    whyThirdParty: 'Amazon-operated domains.',
    dataFlows: 'Typically link-out; no implied login stack on the Italy public site.',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    matchHost: (h) => /(^|\.)linkedin\.com$/i.test(h),
    vendor: 'LinkedIn / Microsoft',
    category: 'Social / professional (footer or content links)',
    configuration: ['Company or campaign links to `www.linkedin.com`.'],
    whyThirdParty: 'LinkedIn-operated domain.',
    dataFlows: 'Follows normal LinkedIn navigation / embed behaviour when linked.',
  },
  {
    id: 'meta-facebook',
    title: 'Meta (Facebook)',
    matchHost: (h) => /(^|\.)facebook\.com$/i.test(h),
    vendor: 'Meta Platforms, Inc.',
    category: 'Social (links or pixels)',
    configuration: ['e.g. brand page links under `www.facebook.com`.'],
    whyThirdParty: 'Meta-operated domain.',
    dataFlows: 'Depends on link vs pixel; confirm in crawl proof.',
  },
  {
    id: 'vmware',
    title: 'VMware (Broadcom)',
    matchHost: (h) => /(^|\.)vmware\.com$/i.test(h),
    vendor: 'VMware LLC (Broadcom)',
    category: 'Linked documentation / privacy',
    configuration: ['May appear as privacy or technology links in policy copy.'],
    whyThirdParty: 'Non-`astrazeneca.it` corporate domain.',
    dataFlows: 'Usually navigation to documentation.',
  },
  {
    id: 'schema-org',
    title: 'Schema.org (structured data vocabulary)',
    matchHost: (h) => /^schema\.org$/i.test(h),
    vendor: 'Schema.org community',
    category: 'Structured data identifiers',
    configuration: ['JSON-LD or RDFa may reference `http(s)://schema.org/...` as vocabulary IRIs (not an API call).'],
    whyThirdParty: 'Namespace is third-party; typically no script load from schema.org.',
    dataFlows: 'Identifiers in markup; optional fetches only if authors link assets (unusual).',
  },
  {
    id: 'cloudfront-cdn',
    title: 'Amazon CloudFront',
    matchHost: (h) => /cloudfront\.net$/i.test(h),
    vendor: 'Amazon Web Services, Inc.',
    category: 'CDN',
    configuration: ['Edge delivery when asset URLs use CloudFront hostnames.'],
    whyThirdParty: 'AWS infrastructure.',
    dataFlows: 'CDN / access logs.',
  },
  {
    id: 'az-digital-governance',
    title: 'AstraZeneca digital governance (first-party bundle)',
    matchHost: () => false,
    vendor: 'AstraZeneca (AEM)',
    category: 'Cookie / legal UI',
    configuration: ['May use `/etc/designs/.../digitalgovernance/` on AEM (same origin).'],
    whyThirdParty: 'First-party; not a vendor network host.',
    dataFlows: 'Typically same-origin.',
  },
  {
    id: 'az-corporate-other',
    title: 'Other AstraZeneca Italy properties (same organisation)',
    matchHost: (h) => {
      const x = h.toLowerCase();
      return x.endsWith('.astrazeneca.it') && x !== 'www.astrazeneca.it';
    },
    vendor: 'AstraZeneca',
    category: 'Cross-subdomain content (Italy)',
    configuration: ['Other `*.astrazeneca.it` hosts (not `www`).'],
    whyThirdParty:
      'Different origin from `www.astrazeneca.it` but same org — excluded from vendor-only summary.',
    dataFlows: 'On navigation or embed only.',
  },
];

export function matchReferenceEntry(hostname) {
  const found = INTEGRATION_REFERENCE.find((entry) => {
    try {
      return entry.matchHost(hostname);
    } catch {
      return false;
    }
  });
  return found || null;
}
