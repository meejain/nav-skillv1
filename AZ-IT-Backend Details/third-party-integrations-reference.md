# Third-party integrations — reference (AstraZeneca Italy)

Generated: 2026-04-01T21:40:08.636Z

**Site:** AstraZeneca Italy (www.astrazeneca.it)

**First-party origin:** `https://www.astrazeneca.it/`

**Scan:** Post–banner Playwright crawl — `backend-linkages-post-hcp-report.json`.

Regenerate: `node scan-post-hcp.mjs --reference-only`.

---

## Tealium iQ Tag Management

- **Vendor:** Tealium, Inc.
- **Category:** Tag management / customer data platform orchestration

### Configuration

- Scripts: `utag.js` / `utag.sync.js` from the AstraZeneca Italy profile under `tags.tiqcdn.com/utag/astrazeneca/...` (confirm path in crawl JSON).
- Page may populate `window.utag_data` before `utag.js` loads.
- Post-load (profile-dependent): `collect.tealiumiq.com`, `visitor-service-*.tealiumiq.com`, etc.

### Why third party (or not)

Tealium operates the CDN and tag delivery outside `www.astrazeneca.it`. It can load vendor scripts, cookies, and forward data per the iQ profile.

### Typical data flows

Browser → Tealium → configured analytics, pixels, consent, and other tags (profile-specific).

### Observed (this crawl)

Hosts: `tags.tiqcdn.com`, `tealium.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Adobe Experience Cloud / Analytics (data collection)

- **Vendor:** Adobe Inc.
- **Category:** Analytics / Experience Cloud data collection

### Configuration

- Beacons to `*.omtrdc.net` / `2o7.net`-style Adobe collection hosts when the Tealium profile loads Adobe tags.
- Audience Manager / ID: `*.demdex.net` when configured.

### Why third party (or not)

Hits go to Adobe-operated infrastructure, not to `www.astrazeneca.it`.

### Typical data flows

Analytics and ID-sync payloads per Adobe configuration.

### Observed (this crawl)

No matching host in network aggregate.

---

## Adobe Helix RUM (Real User Monitoring)

- **Vendor:** Adobe Inc.
- **Category:** Performance / observability

### Configuration

- Script such as `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/micro.js` (confirm in network proof).

### Why third party (or not)

RUM to Adobe Helix / Edge Delivery monitoring, separate from the page origin.

### Typical data flows

Performance and navigation telemetry.

### Observed (this crawl)

Hosts: `rum.hlx.page`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Cookie Reports (organisational consent / policy UI)

- **Vendor:** Cookie Reports (organisational vendor; confirm contract)
- **Category:** Consent / cookie banner tooling

### Configuration

- Scripts and policy panels served from `policy.cookiereports.com` (and related paths) as referenced from the site.

### Why third party (or not)

Served from a non-`astrazeneca.it` hostname; governs consent UI and related assets.

### Typical data flows

Consent state, policy display, and any vendor-configured measurement tied to that product.

### Observed (this crawl)

Hosts: `policy.cookiereports.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Adobe Fonts (Typekit)

- **Vendor:** Adobe Inc.
- **Category:** Fonts / typography CDN

### Configuration

- CSS and font files from `use.typekit.net`, `p.typekit.net`, etc.

### Why third party (or not)

Font delivery from Adobe-operated domains.

### Typical data flows

Font requests; possible Adobe logging per their terms.

### Observed (this crawl)

Hosts: `p.typekit.net`, `use.typekit.net`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Public JavaScript CDNs (jQuery, cdnjs)

- **Vendor:** jQuery / Cloudflare
- **Category:** JavaScript libraries

### Configuration

- Common AEM / tag bundles reference `code.jquery.com` and `cdnjs.cloudflare.com` for jQuery and migrate scripts.

### Why third party (or not)

Scripts are executed from third-party origins.

### Typical data flows

Script delivery; CDN operator may log requests.

### Observed (this crawl)

Hosts: `cdnjs.cloudflare.com`, `code.jquery.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Kaltura (video)

- **Vendor:** Kaltura, Inc.
- **Category:** Video hosting / player

### Configuration

- Embeds or player assets when video components reference Kaltura hosts.

### Why third party (or not)

Video platform outside `www.astrazeneca.it`.

### Typical data flows

Streaming, analytics, and player events per Kaltura configuration.

### Observed (this crawl)

Hosts: `www.kaltura.com`. Up to **1** page loads per host (see JSON `hostsAggregated`).

---

## Ad serving / measurement (Flashtalking, Innovid, Digital Control Room)

- **Vendor:** Multiple (Flashtalking, Innovid, Digital Control Room)
- **Category:** Advertising / campaign measurement

### Configuration

- Often reached via links or tags in marketing / campaign content; confirm paths in crawl proof.

### Why third party (or not)

Separate ad-tech vendors from the first-party origin.

### Typical data flows

Campaign measurement, pixels, or redirects as configured.

### Observed (this crawl)

Hosts: `www.digitalcontrolroom.com`, `www.flashtalking.com`, `www.innovid.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Microsoft (privacy and support links)

- **Vendor:** Microsoft Corporation
- **Category:** Privacy documentation / support (cookie policy text)

### Configuration

- Linked from cookie / privacy copy (e.g. Edge cookie guidance, Microsoft privacy pages).

### Why third party (or not)

Content and assets on Microsoft-operated domains.

### Typical data flows

Typically navigation only unless embedded resources load.

### Observed (this crawl)

Hosts: `privacy.microsoft.com`, `support.microsoft.com`, `www.microsoft.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Google

- **Vendor:** Google LLC
- **Category:** Analytics / fonts / embeds / support links

### Configuration

- May include `support.google.com` from cookie-help text; other Google hosts often arrive via Tealium-loaded tags.

### Why third party (or not)

Google-operated infrastructure.

### Typical data flows

Varies by tag (analytics, fonts, embeds).

### Observed (this crawl)

Hosts: `support.google.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Browser vendor documentation (Apple, Mozilla)

- **Vendor:** Apple Inc. / Mozilla
- **Category:** Support / cookie documentation (links in policy copy)

### Configuration

- Linked from privacy or cookie notices (Safari / Firefox cookie guidance).

### Why third party (or not)

Documentation hosted on vendor domains.

### Typical data flows

Usually page navigation only.

### Observed (this crawl)

Hosts: `support.apple.com`, `support.mozilla.org`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Amazon (privacy / AWS policy links)

- **Vendor:** Amazon.com, Inc.
- **Category:** Linked policy / infrastructure documentation

### Configuration

- Often linked from cookie or privacy disclosures (e.g. load balancing / privacy pages).

### Why third party (or not)

Amazon-operated domains.

### Typical data flows

Typically link-out; no implied login stack on the Italy public site.

### Observed (this crawl)

Hosts: `aws.amazon.com`, `www.amazon.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## LinkedIn

- **Vendor:** LinkedIn / Microsoft
- **Category:** Social / professional (footer or content links)

### Configuration

- Company or campaign links to `www.linkedin.com`.

### Why third party (or not)

LinkedIn-operated domain.

### Typical data flows

Follows normal LinkedIn navigation / embed behaviour when linked.

### Observed (this crawl)

Hosts: `www.linkedin.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Meta (Facebook)

- **Vendor:** Meta Platforms, Inc.
- **Category:** Social (links or pixels)

### Configuration

- e.g. brand page links under `www.facebook.com`.

### Why third party (or not)

Meta-operated domain.

### Typical data flows

Depends on link vs pixel; confirm in crawl proof.

### Observed (this crawl)

Hosts: `www.facebook.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## VMware (Broadcom)

- **Vendor:** VMware LLC (Broadcom)
- **Category:** Linked documentation / privacy

### Configuration

- May appear as privacy or technology links in policy copy.

### Why third party (or not)

Non-`astrazeneca.it` corporate domain.

### Typical data flows

Usually navigation to documentation.

### Observed (this crawl)

Hosts: `www.vmware.com`. Up to **10** page loads per host (see JSON `hostsAggregated`).

---

## Schema.org (structured data vocabulary)

- **Vendor:** Schema.org community
- **Category:** Structured data identifiers

### Configuration

- JSON-LD or RDFa may reference `http(s)://schema.org/...` as vocabulary IRIs (not an API call).

### Why third party (or not)

Namespace is third-party; typically no script load from schema.org.

### Typical data flows

Identifiers in markup; optional fetches only if authors link assets (unusual).

### Observed (this crawl)

Hosts: `schema.org`. Up to **8** page loads per host (see JSON `hostsAggregated`).

---

## Amazon CloudFront

- **Vendor:** Amazon Web Services, Inc.
- **Category:** CDN

### Configuration

- Edge delivery when asset URLs use CloudFront hostnames.

### Why third party (or not)

AWS infrastructure.

### Typical data flows

CDN / access logs.

### Observed (this crawl)

No matching host in network aggregate.

---

## AstraZeneca digital governance (first-party bundle)

- **Vendor:** AstraZeneca (AEM)
- **Category:** Cookie / legal UI

### Configuration

- May use `/etc/designs/.../digitalgovernance/` on AEM (same origin).

### Why third party (or not)

First-party; not a vendor network host.

### Typical data flows

Typically same-origin.

### Observed (this crawl)

First-party bundle; not a separate vendor network host.

---

## Other AstraZeneca Italy properties (same organisation)

- **Vendor:** AstraZeneca
- **Category:** Cross-subdomain content (Italy)

### Configuration

- Other `*.astrazeneca.it` hosts (not `www`).

### Why third party (or not)

Different origin from `www.astrazeneca.it` but same org — excluded from vendor-only summary.

### Typical data flows

On navigation or embed only.

### Observed (this crawl)

No matching host in network aggregate.

---

## Additional hosts (unmatched catalog)

### `apacs-egpa.org`
- **Loads:** 1

### `fondazionecuore.it`
- **Loads:** 1

### `komen.it`
- **Loads:** 1

### `lampada-aladino.it`
- **Loads:** 1

### `lotonlus.org`
- **Loads:** 1

### `respiriamoinsieme.org`
- **Loads:** 1

### `tesseraconsulting.it`
- **Loads:** 1

### `viveresenzastomaco.org`
- **Loads:** 1

### `www.abrcadabra.it`
- **Loads:** 1

### `www.acto-italia.org`
- **Loads:** 1

### `www.adobe.com`
- **Loads:** 10

### `www.agenziafarmaco.gov.it`
- **Loads:** 1

### `www.ail.it`
- **Loads:** 1

### `www.ailmessina.it`
- **Loads:** 1

### `www.andosonlusnazionale.it`
- **Loads:** 1

### `www.apicinfo.it`
- **Loads:** 1

### `www.associazioneaisc.org`
- **Loads:** 1

### `www.associazionepalinuro.com`
- **Loads:** 1

### `www.diabeteitalia.it`
- **Loads:** 1

### `www.duecipromotion.com`
- **Loads:** 1

### `www.epac.it`
- **Loads:** 1

### `www.europadonna.it`
- **Loads:** 1

### `www.favo.it`
- **Loads:** 1

### `www.federdiabeticipuglia.it`
- **Loads:** 1

### `www.fmrweb.it`
- **Loads:** 1

### `www.fondazioneitalianadelrene.org`
- **Loads:** 1

### `www.incontradonna.it`
- **Loads:** 1

### `www.legatumori.mi.it`
- **Loads:** 1

### `www.linfovita.it`
- **Loads:** 1

### `www.lupus-italy.org`
- **Loads:** 1

### `www.proformatcomunicazione.it`
- **Loads:** 1

### `www.salutedonnaonlus.it`
- **Loads:** 1

### `www.womenagainstlungcancer.org`
- **Loads:** 1

