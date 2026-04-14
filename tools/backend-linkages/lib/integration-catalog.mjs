/**
 * Optional vendor taxonomy for reference markdown (titles, vendor names, prose).
 * Discovery of third-party hosts and URLs comes from fetch HTML + Playwright network
 * (see JSON and `third-party-hosts-inventory.md`); this file only groups known hosts
 * into narrative sections. Hosts not listed here still appear in inventory and reports.
 * @param {string} HOST
 */
export function getIntegrationCatalog(HOST) {
  const INTEGRATION_REFERENCE = [
    {
      id: 'first-party-note',
      title: 'First-party origin (scanned host)',
      matchHost: () => false,
      vendor: 'Site operator',
      category: 'Same-origin content',
      configuration: [
        `HTML, CSS, APIs, and app paths served from \`https://${HOST}/\` and subdomains of \`${HOST}\`.`,
      ],
      whyThirdParty: 'Not third party — documented for scope clarity.',
      dataFlows: 'N/A',
    },
    {
      id: 'tealium-iq',
      title: 'Tealium iQ Tag Management',
      matchHost: (h) =>
        /(^|\.)tiqcdn\.com$/i.test(h)
        || /(^|\.)tealiumiq\.com$/i.test(h)
        || /^tealium\.com$/i.test(h)
        || h.endsWith('.tealium.com'),
      vendor: 'Tealium, Inc.',
      category: 'Tag management / CDP orchestration',
      configuration: ['`utag.js` / related Tealium hosts per profile; confirm paths in crawl JSON.'],
      whyThirdParty: 'Tag delivery and orchestration outside the first-party origin.',
      dataFlows: 'Browser → Tealium → configured tags per profile.',
    },
    {
      id: 'google',
      title: 'Google (tags, fonts, APIs, YouTube)',
      matchHost: (h) => (
        /(^|\.)google\.com$/i.test(h)
        || /(^|\.)googleapis\.com$/i.test(h)
        || /(^|\.)gstatic\.com$/i.test(h)
        || /(^|\.)googletagmanager\.com$/i.test(h)
        || /(^|\.)google-analytics\.com$/i.test(h)
        || /(^|\.)googleadservices\.com$/i.test(h)
        || /(^|\.)doubleclick\.net$/i.test(h)
        || /^support\.google\.com$/i.test(h)
      ),
      vendor: 'Google LLC',
      category: 'Analytics / ads / fonts / embeds',
      configuration: ['GTM, GA4, Ads, YouTube, Fonts, or Maps depending on page.'],
      whyThirdParty: 'Google-operated domains.',
      dataFlows: 'Varies by product (analytics, ads, video).',
    },
    {
      id: 'youtube',
      title: 'YouTube (Google)',
      matchHost: (h) =>
        /(^|\.)youtube\.com$/i.test(h)
        || /(^|\.)youtu\.be$/i.test(h)
        || /(^|\.)ytimg\.com$/i.test(h)
        || /(^|\.)googlevideo\.com$/i.test(h),
      vendor: 'Google LLC',
      category: 'Video embed',
      configuration: ['Player and CDN when video components reference YouTube.'],
      whyThirdParty: 'YouTube-operated infrastructure.',
      dataFlows: 'Playback and measurement per Google.',
    },
    {
      id: 'adobe-experience-cloud',
      title: 'Adobe Experience Cloud / Analytics',
      matchHost: (h) => /omtrdc\.net$/i.test(h) || /\.2o7\.net$/i.test(h) || /demdex\.net$/i.test(h),
      vendor: 'Adobe Inc.',
      category: 'Analytics / data collection',
      configuration: ['Adobe Analytics / Experience Cloud beacons when tags load Adobe collection.'],
      whyThirdParty: 'Hits to Adobe-operated collection hosts.',
      dataFlows: 'Analytics and ID sync per Adobe configuration.',
    },
    {
      id: 'adobe-helix-rum',
      title: 'Adobe Helix RUM',
      matchHost: (h) => /(^|\.)hlx\.page$/i.test(h) || /(^|\.)rum\.hlx\.page$/i.test(h),
      vendor: 'Adobe Inc.',
      category: 'Performance monitoring',
      configuration: ['`rum.hlx.page` scripts when Edge Delivery / Helix RUM is enabled.'],
      whyThirdParty: 'Telemetry to Adobe-operated RUM.',
      dataFlows: 'Performance beacons.',
    },
    {
      id: 'salesforce-evergage',
      title: 'Salesforce Interaction Studio (Evergage)',
      matchHost: (h) => /(^|\.)evgnet\.com$/i.test(h),
      vendor: 'Salesforce, Inc.',
      category: 'Personalisation / behavioural analytics',
      configuration: ['`cdn.evgnet.com` beacon and script paths.'],
      whyThirdParty: 'Evergage assets are not served from the page origin.',
      dataFlows: 'Behavioural events per Salesforce configuration.',
    },
    {
      id: 'onetrust',
      title: 'OneTrust / Optanon',
      matchHost: (h) =>
        /(^|\.)onetrust\.com$/i.test(h)
        || /(^|\.)cookielaw\.org$/i.test(h)
        || /(^|\.)optanon\.com$/i.test(h),
      vendor: 'OneTrust LLC',
      category: 'Consent management',
      configuration: ['Cookie banners and preference centre assets.'],
      whyThirdParty: 'Consent platform outside the page origin.',
      dataFlows: 'Consent state and configuration fetches.',
    },
    {
      id: 'cookiebot',
      title: 'Cookiebot',
      matchHost: (h) => /(^|\.)cookiebot\.com$/i.test(h) || /(^|\.)cybot\.com$/i.test(h),
      vendor: 'Usercentrics / Cookiebot',
      category: 'Consent management',
      configuration: ['Cookiebot script and API hosts when used.'],
      whyThirdParty: 'Third-party consent product.',
      dataFlows: 'Consent banner and API traffic.',
    },
    {
      id: 'medpass-iam',
      title: 'Identity & Access Management (login workflow / HCP gate) — MedPass',
      matchHost: (h) => /(^|\.)medpass\.co\.jp$/i.test(h),
      vendor: 'MedPass (confirm vendor / contract for your market)',
      category: 'HCP authentication, registration, and compliance',
      configuration: [
        'AEM OpenID Connect servlet path such as `/bin/medpassopenidconnect` when present.',
        'MedPass service and registration endpoints under `https://medpass.co.jp/` linked from login or HCP flows.',
      ],
      whyThirdParty:
        'Identity and compliance services are delivered from `medpass.co.jp`, outside the scanned MediChannel hostname.',
      dataFlows: 'Authentication, registration, and policy flows per MedPass / AZ configuration.',
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      matchHost: (h) => /(^|\.)linkedin\.com$/i.test(h) || /(^|\.)licdn\.com$/i.test(h),
      vendor: 'LinkedIn / Microsoft',
      category: 'Social / ads / Insight Tag',
      configuration: ['Company links, Insight Tag, or ads pixels.'],
      whyThirdParty: 'LinkedIn-operated domains.',
      dataFlows: 'Varies by embed vs pixel.',
    },
    {
      id: 'meta-facebook',
      title: 'Meta (Facebook)',
      matchHost: (h) => /(^|\.)facebook\.com$/i.test(h) || /(^|\.)fbcdn\.net$/i.test(h),
      vendor: 'Meta Platforms, Inc.',
      category: 'Social / pixels',
      configuration: ['Facebook SDK, pixels, or social links.'],
      whyThirdParty: 'Meta-operated domains.',
      dataFlows: 'Depends on pixel vs navigation.',
    },
    {
      id: 'twitter-x',
      title: 'X (Twitter)',
      matchHost: (h) => /(^|\.)twitter\.com$/i.test(h) || /(^|\.)twimg\.com$/i.test(h) || /(^|\.)x\.com$/i.test(h),
      vendor: 'X Corp.',
      category: 'Social widgets / links',
      configuration: ['Embeds or widgets referencing Twitter/X assets.'],
      whyThirdParty: 'X-operated domains.',
      dataFlows: 'Widget load and optional tracking.',
    },
    {
      id: 'tiktok',
      title: 'TikTok',
      matchHost: (h) => /(^|\.)tiktok\.com$/i.test(h) || /(^|\.)tiktokv\.com$/i.test(h),
      vendor: 'TikTok / ByteDance',
      category: 'Social / pixels',
      configuration: ['Links or pixels referencing TikTok.'],
      whyThirdParty: 'TikTok-operated domains.',
      dataFlows: 'Varies by implementation.',
    },
    {
      id: 'reddit',
      title: 'Reddit',
      matchHost: (h) => /(^|\.)reddit\.com$/i.test(h) || /(^|\.)redditstatic\.com$/i.test(h),
      vendor: 'Reddit, Inc.',
      category: 'Social / pixels',
      configuration: ['Reddit embeds or advertising pixels.'],
      whyThirdParty: 'Reddit-operated domains.',
      dataFlows: 'Pixel or embed traffic per Reddit.',
    },
    {
      id: 'vimeo',
      title: 'Vimeo',
      matchHost: (h) => /(^|\.)vimeo\.com$/i.test(h) || /(^|\.)vimeocdn\.com$/i.test(h),
      vendor: 'Vimeo, Inc.',
      category: 'Video embed',
      configuration: ['Player and CDN when Vimeo is embedded.'],
      whyThirdParty: 'Vimeo-operated infrastructure.',
      dataFlows: 'Streaming and player analytics.',
    },
    {
      id: 'brightcove',
      title: 'Brightcove',
      matchHost: (h) => /(^|\.)brightcove\.com$/i.test(h) || /boltdns\.net$/i.test(h),
      vendor: 'Brightcove Inc.',
      category: 'Video hosting / player',
      configuration: ['Player, images, or metrics under Brightcove / Bolt CDN.'],
      whyThirdParty: 'Video platform outside the first-party origin.',
      dataFlows: 'Streaming and analytics per Brightcove.',
    },
    {
      id: 'mapbox',
      title: 'Mapbox',
      matchHost: (h) => /(^|\.)mapbox\.com$/i.test(h),
      vendor: 'Mapbox, Inc.',
      category: 'Maps / tiles',
      configuration: ['Mapbox GL, tiles, or styles.'],
      whyThirdParty: 'Map data and scripts are not served from the page origin.',
      dataFlows: 'Map views and telemetry per Mapbox terms.',
    },
    {
      id: 'siteimprove',
      title: 'Siteimprove',
      matchHost: (h) => /\.siteimprove(analytics)?\.(com|io)$/i.test(h),
      vendor: 'Siteimprove A/S',
      category: 'Analytics / QA',
      configuration: ['Analytics or content quality scripts.'],
      whyThirdParty: 'Siteimprove-operated infrastructure.',
      dataFlows: 'Measurement per Siteimprove configuration.',
    },
    {
      id: 'microsoft-clarity',
      title: 'Microsoft Clarity',
      matchHost: (h) => /(^|\.)clarity\.ms$/i.test(h),
      vendor: 'Microsoft Corporation',
      category: 'Session replay / heatmaps',
      configuration: ['`clarity.ms` scripts or beacons.'],
      whyThirdParty: 'Microsoft-operated analytics.',
      dataFlows: 'Behavioural telemetry per Clarity terms.',
    },
    {
      id: 'cloudflare',
      title: 'Cloudflare',
      matchHost: (h) => /(^|\.)cloudflare\.com$/i.test(h) || /cloudflareinsights\.com$/i.test(h),
      vendor: 'Cloudflare, Inc.',
      category: 'CDN / security / analytics',
      configuration: ['`cdnjs.cloudflare.com`, Web Analytics, or other Cloudflare endpoints.'],
      whyThirdParty: 'Cloudflare edge infrastructure.',
      dataFlows: 'CDN delivery; optional analytics.',
    },
    {
      id: 'cloudfront-cdn',
      title: 'Amazon CloudFront',
      matchHost: (h) => /cloudfront\.net$/i.test(h),
      vendor: 'Amazon Web Services, Inc.',
      category: 'CDN',
      configuration: ['Asset delivery via CloudFront hostnames.'],
      whyThirdParty: 'AWS edge infrastructure.',
      dataFlows: 'CDN / access logs.',
    },
    {
      id: 'jsdelivr',
      title: 'jsDelivr',
      matchHost: (h) => /(^|\.)jsdelivr\.net$/i.test(h),
      vendor: 'jsDelivr / Prospect One',
      category: 'Public CDN',
      configuration: ['Open-source package delivery.'],
      whyThirdParty: 'Third-party CDN.',
      dataFlows: 'Asset requests.',
    },
    {
      id: 'ad-tech',
      title: 'Ad / measurement platforms',
      matchHost: (h) =>
        /(^|\.)quantserve\.com$/i.test(h)
        || /(^|\.)adsrvr\.org$/i.test(h)
        || /(^|\.)flashtalking\.com$/i.test(h)
        || /(^|\.)innovid\.com$/i.test(h)
        || /(^|\.)creativecdn\.com$/i.test(h)
        || /(^|\.)everesttech\.net$/i.test(h)
        || /(^|\.)rlcdn\.com$/i.test(h)
        || /(^|\.)yahoo\.com$/i.test(h)
        || /(^|\.)analytics\.yahoo\.com$/i.test(h)
        || /(^|\.)casalemedia\.com$/i.test(h)
        || /(^|\.)pubmatic\.com$/i.test(h)
        || /(^|\.)rubiconproject\.com$/i.test(h)
        || /(^|\.)adnxs\.com$/i.test(h)
        || /(^|\.)bidswitch\.net$/i.test(h),
      vendor: 'Multiple',
      category: 'Advertising / measurement',
      configuration: ['Pixels and ad servers reached via marketing tags.'],
      whyThirdParty: 'Non–first-party measurement and ad hosts.',
      dataFlows: 'Campaign and audience measurement per vendor.',
    },
    {
      id: 'same-site-subdomain',
      title: `Other subdomains of ${HOST}`,
      matchHost: (h) => {
        const x = h.toLowerCase();
        return x.endsWith(`.${HOST}`) && x !== HOST;
      },
      vendor: 'Same registrable site',
      category: 'Cross-subdomain routing',
      configuration: [`Hosts under \`*.${HOST}\` (not identical to \`${HOST}\`).`],
      whyThirdParty:
        `Different origin from \`${HOST}\` but same hostname family — typically excluded from vendor-only summaries.`,
      dataFlows: 'Navigation or embed only.',
    },
  ];

  function matchReferenceEntry(hostname) {
    const found = INTEGRATION_REFERENCE.find((entry) => {
      try {
        return entry.matchHost(hostname);
      } catch {
        return false;
      }
    });
    return found || null;
  }

  return { INTEGRATION_REFERENCE, matchReferenceEntry };
}
