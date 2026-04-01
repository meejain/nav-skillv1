/**
 * Authoritative reference entries for third-party integrations documentation.
 * `matchHost` returns true if a network hostname should be grouped under this entry.
 */

export const INTEGRATION_REFERENCE = [
  {
    id: 'tealium-iq',
    title: 'Tealium iQ Tag Management',
    matchHost: (h) => /(^|\.)tiqcdn\.com$/i.test(h) || /(^|\.)tealiumiq\.com$/i.test(h),
    vendor: 'Tealium, Inc.',
    category: 'Tag management / customer data platform orchestration',
    configuration: [
      'Scripts: `utag.js` and `utag.sync.js` from profile path `//tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/` (bundles may load numbered chunks e.g. `utag.36.js`).',
      'Page template populates `window.utag_data` (UDO) before `utag.js` loads — page name, channel, login status, search terms, etc.',
      'Tealium then loads additional tags configured in the iQ profile (not visible in static HTML).',
      'Post-load calls often hit `collect.tealiumiq.com` and region visitor services (e.g. `visitor-service-*.tealiumiq.com`) for event and visitor profile APIs.',
    ],
    whyThirdParty:
      'Requests are made to `tags.tiqcdn.com`, a Tealium-operated CDN outside AstraZeneca first-party infrastructure. Tealium can load arbitrary vendor scripts, set third-party cookies, and forward data to analytics or advertising endpoints per account configuration.',
    dataFlows:
      'Browser → Tealium CDN → (configured) analytics, pixels, consent tools, A/B tools, etc. Exact destinations depend on the live Tealium profile.',
  },
  {
    id: 'adobe-experience-cloud',
    title: 'Adobe Experience Cloud / Analytics (data collection)',
    matchHost: (h) => /omtrdc\.net$/i.test(h) || /\.2o7\.net$/i.test(h) || /demdex\.net$/i.test(h),
    vendor: 'Adobe Inc.',
    category: 'Analytics / Experience Cloud data collection',
    configuration: [
      'After Tealium loads Adobe tags, the browser may send beacons to Adobe-hosted data collection hosts (historically `*.omtrdc.net` / `2o7.net` naming).',
      'Adobe Audience Manager / ID sync often uses `*.demdex.net` (e.g. `dpm.demdex.net`, `astrazeneca.demdex.net`).',
      'Example observed: `astrazenecaeurope.d3.sc.omtrdc.net`.',
    ],
    whyThirdParty:
      'Data is sent to Adobe-operated infrastructure, not to `med.astrazeneca.co.jp`. Adobe processes hits per the customer’s Analytics/Experience Cloud configuration.',
    dataFlows: 'Page views, props/eVars, and related analytics payloads to Adobe collection endpoints.',
  },
  {
    id: 'evergage-salesforce',
    title: 'Evergage (Salesforce Interaction Studio)',
    matchHost: (h) => /(^|\.)evgnet\.com$/i.test(h) || /(^|\.)evergage\.com$/i.test(h),
    vendor: 'Salesforce, Inc. (Evergage)',
    category: 'Personalization / real-time interaction',
    configuration: [
      'Beacon script: `https://cdn.evgnet.com/beacon/astrazeneca/japan/scripts/evergage.min.js` (async).',
      'Template may stub or override `Evergage.hideSections` to avoid layout conflicts.',
    ],
    whyThirdParty:
      'Assets and collection endpoints are served from Salesforce-controlled domains (`cdn.evgnet.com`, etc.), not from `med.astrazeneca.co.jp`. Behavior and data processing are governed by Salesforce.',
    dataFlows:
      'Page views, segments, and personalization events are typically sent to Evergage/Interaction Studio backends for rules and content delivery.',
  },
  {
    id: 'adobe-helix-rum',
    title: 'Adobe Helix RUM (Real User Monitoring)',
    matchHost: (h) => /(^|\.)hlx\.page$/i.test(h) || /(^|\.)rum\.hlx\.page$/i.test(h),
    vendor: 'Adobe Inc.',
    category: 'Performance / observability',
    configuration: [
      'Script: `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/rum-standalone.js` with `data-routing` attribute.',
    ],
    whyThirdParty:
      'RUM beacons are sent to Adobe Helix/Edge Delivery monitoring infrastructure (`rum.hlx.page`), separate from the AEM publish origin.',
    dataFlows:
      'Performance metrics, navigation timing, and related telemetry to Adobe-operated endpoints.',
  },
  {
    id: 'syncsearch',
    title: 'SyncSearch (site search suggestions)',
    matchHost: (h) => /syncsearch\.jp$/i.test(h) || /(^|\.)syncsearch\./i.test(h),
    vendor: 'SyncSearch (third-party search UX vendor)',
    category: 'Site search / autocomplete',
    configuration: [
      'Client script loaded from `//pro.syncsearch.jp/common/js/sync_suggest.js` (via `search.js` on MediChannel).',
      'Search results form posts to `https://medsearch.astrazeneca.co.jp/search` with fixed `site` id (e.g. `3LHU36IK`).',
      'Suggest API calls use SyncSearch roots (`ssl.syncsearch.jp` / `pro.syncsearch.jp`) per their JS.',
    ],
    whyThirdParty:
      'Suggest/autocomplete is served from **SyncSearch-operated** domains (`pro.syncsearch.jp` / `ssl.syncsearch.jp`). That infrastructure is outside AstraZeneca’s AEM publish stack. (Search **result** pages may load from an AstraZeneca subdomain; those are treated as same-organisation routing in `integrations-vendors-and-proof.md`, not as a vendor integration.)',
    dataFlows:
      'Query text may be sent to SyncSearch for suggestions; submitting the form navigates to the configured search results URL.',
  },
  {
    id: 'medsearch-hosted',
    title: 'MedSearch (hosted search results)',
    matchHost: (h) => /^medsearch\.astrazeneca\.co\.jp$/i.test(h),
    vendor: 'AstraZeneca (dedicated search subdomain)',
    category: 'Site search results',
    configuration: [
      'Form `action` rewritten in `search.js` to `https://medsearch.astrazeneca.co.jp/search` with parameters `site`, `charset`, `group`, `design`, `query`.',
    ],
    whyThirdParty:
      'From the **MediChannel** page origin (`med.astrazeneca.co.jp`), `medsearch.astrazeneca.co.jp` is a **different site** (separate cookie jar, separate TLS cert context). It is not “foreign SaaS” in a legal sense, but it **is** a distinct backend/origin in integration and privacy assessments.',
    dataFlows: 'User search queries and result pages are served from the medsearch subdomain.',
  },
  {
    id: 'az-digital-governance',
    title: 'AstraZeneca digital governance / statements (first-party bundle)',
    matchHost: () => false,
    vendor: 'AstraZeneca (implementation on AEM)',
    category: 'Cookie / legal statement UI',
    configuration: [
      'Scripts and CSS under `/etc/designs/code/astrazeneca/digitalgovernance/` (e.g. `digitalstatements.min.js`).',
      'Markup includes `#postFrm`, `#statementDisplay`, `hdCookie` — drives on-site banners and statements.',
    ],
    whyThirdParty:
      'Not third-party: delivered from the same AEM publish host as the page. Listed for contrast with Tealium/consent vendors that *are* third-party.',
    dataFlows: 'Typically first-party only unless the bundle calls external APIs (verify in minified source if required).',
  },
  {
    id: 'az-corporate-www',
    title: 'Other AstraZeneca Japan web properties',
    matchHost: (h) => (
      /\.astrazeneca\.co\.jp$/i.test(h)
      && !/^med\.astrazeneca\.co\.jp$/i.test(h)
      && !/^medsearch\.astrazeneca\.co\.jp$/i.test(h)
    ),
    vendor: 'AstraZeneca',
    category: 'Cross-site links / corporate content',
    configuration: [
      'Examples: `www.astrazeneca.co.jp` (corporate, patients), `www2.astrazeneca.co.jp` (SSL forms).',
    ],
    whyThirdParty:
      'Same company but **different origins** from `med.astrazeneca.co.jp`. Browsers enforce separate cookies, storage, and security context. Linking or redirecting to these hosts is a **cross-origin** integration.',
    dataFlows: 'Only when the user follows the link; no automatic data transfer unless additional scripts or query params are used.',
  },
  {
    id: 'medpass',
    title: 'MedPass (HCP authentication / identity)',
    matchHost: (h) => /medpass\.(co\.jp|jp)$/i.test(h),
    vendor: 'MedPass (third-party identity / compliance service)',
    category: 'Authentication / registration',
    configuration: [
      'Login-related pages reference `/bin/medpassopenidconnect` and link to `medpass.co.jp`, `medpass.jp` for service, company, compliance.',
    ],
    whyThirdParty:
      'Identity and compliance content are served from MedPass-operated domains, outside the MediChannel AEM origin.',
    dataFlows: 'Registration and OpenID Connect flows involve redirects and tokens between MediChannel and MedPass.',
  },
  {
    id: 'veeva',
    title: 'Veeva CRM (referenced servlet)',
    matchHost: (h) => /veeva/i.test(h),
    vendor: 'Veeva Systems',
    category: 'Life sciences CRM / engagement',
    configuration: [
      'Login template may reference `/bin/veevaCrmRequest` (AEM servlet bridging to Veeva).',
    ],
    whyThirdParty:
      'Servlet name implies server-side or client-initiated calls toward Veeva cloud; Veeva is a separate vendor from Adobe AEM.',
    dataFlows: 'Depends on servlet implementation — typically HCP or activity data for CRM alignment.',
  },
  {
    id: 'google',
    title: 'Google (tags, fonts, or embeds)',
    matchHost: (h) => (
      /(^|\.)google\.(com|co\.jp)$/i.test(h)
      || /(^|\.)gstatic\.com$/i.test(h)
      || /(^|\.)googleapis\.com$/i.test(h)
    ),
    vendor: 'Google LLC',
    category: 'Analytics / fonts / maps / embeds (context-dependent)',
    configuration: 'Observed only if network requests appear after Tealium or embeds load.',
    whyThirdParty:
      'Any request to `google.com`, `gstatic.com`, or `googleapis.com` is to Google-operated infrastructure, not AstraZeneca first-party hosts.',
    dataFlows: 'Varies: GA4, Tag Manager, fonts, YouTube embeds, reCAPTCHA, etc.',
  },
  {
    id: 'yahoo-japan',
    title: 'Yahoo Japan (e.g. opt-out)',
    matchHost: (h) => /yahoo\.co\.jp$/i.test(h),
    vendor: 'LY Corporation (Yahoo Japan)',
    category: 'Linked compliance / advertising opt-out',
    configuration: 'Policy pages may link to `btoptout.yahoo.co.jp` for advertising opt-out.',
    whyThirdParty:
      'Yahoo Japan operates the linked domain; requests to it are outside AstraZeneca control.',
    dataFlows: 'User navigates voluntarily via hyperlink.',
  },
  {
    id: 'ultmarc',
    title: 'Ultmarc (privacy / data use)',
    matchHost: (h) => /ultmarc\.co\.jp$/i.test(h),
    vendor: 'Ultmarc, Inc.',
    category: 'Privacy disclosures (linked)',
    configuration: 'Privacy policy may reference `www.ultmarc.co.jp/privacy/...` for shared-use explanations.',
    whyThirdParty:
      'Ultmarc hosts the linked documentation on its own domain.',
    dataFlows: 'Reading linked pages; any analytics on Ultmarc side is separate from MediChannel.',
  },
  {
    id: 'cloudfront-cdn',
    title: 'Amazon CloudFront (CDN edge)',
    matchHost: (h) => /cloudfront\.net$/i.test(h),
    vendor: 'Amazon Web Services, Inc.',
    category: 'CDN / edge caching',
    configuration: 'May appear in response headers or redirect chains for blocked/bot requests.',
    whyThirdParty:
      'AWS operates CloudFront; it is infrastructure distinct from the customer origin, though often used *by* the site owner.',
    dataFlows: 'Static and dynamic content delivery; access logs may be processed by AWS/customer.',
  },
];

/**
 * @param {string} hostname
 * @returns {typeof INTEGRATION_REFERENCE[0] | null}
 */
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
