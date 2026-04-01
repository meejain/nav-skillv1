# AstraZeneca Italy (www.astrazeneca.it) — third-party vendor integrations (with proof)

Generated from post–banner scan: **2026-04-01T21:40:08.636Z** (`backend-linkages-post-hcp-report.json`).

## What counts as an integration here

- **Included:** External vendor hostnames from **network** or **HTML** after cookie/consent/banner dismissal.
- **Excluded:** **`*.astrazeneca.it`** and **`*.astrazeneca.com`** (other subdomains, PDFs, cross-links — same organisation, not SaaS integrations).
- **First-party:** **`https://www.astrazeneca.it/`**.

---

## Tealium iQ Tag Management

- **Vendor:** Tealium, Inc.
- **Role:** Tag management / customer data platform orchestration

### Details

- Scripts: `utag.js` / `utag.sync.js` from the AstraZeneca Italy profile under `tags.tiqcdn.com/utag/astrazeneca/...` (confirm path in crawl JSON).
- Page may populate `window.utag_data` before `utag.js` loads.
- Post-load (profile-dependent): `collect.tealiumiq.com`, `visitor-service-*.tealiumiq.com`, etc.

### Why this is a third-party integration

Tealium operates the CDN and tag delivery outside `www.astrazeneca.it`. It can load vendor scripts, cookies, and forward data per the iQ profile.

### Proof

**Observed hostnames:** `tags.tiqcdn.com`, `tealium.com`

**Proof (representative URLs — from crawl):**

- https://tags.tiqcdn.com/utag/astrazeneca/it-az-com/prod/utag.js
- https://tags.tiqcdn.com/utag/astrazeneca/it-az-com/prod/utag.sync.js
- https://tags.tiqcdn.com/utag/tiqapp/utag.v.js?…
- https://tealium.com/
- https://tealium.com/privacy/

---

## Adobe Helix RUM (Real User Monitoring)

- **Vendor:** Adobe Inc.
- **Role:** Performance / observability

### Details

- Script such as `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/micro.js` (confirm in network proof).

### Why this is a third-party integration

RUM to Adobe Helix / Edge Delivery monitoring, separate from the page origin.

### Proof

**Observed hostnames:** `rum.hlx.page`

**Proof (representative URLs — from crawl):**

- https://rum.hlx.page/.rum/@adobe/helix-rum-js@%5E2/dist/micro.js

---

## Cookie Reports (organisational consent / policy UI)

- **Vendor:** Cookie Reports (organisational vendor; confirm contract)
- **Role:** Consent / cookie banner tooling

### Details

- Scripts and policy panels served from `policy.cookiereports.com` (and related paths) as referenced from the site.

### Why this is a third-party integration

Served from a non-`astrazeneca.it` hostname; governs consent UI and related assets.

### Proof

**Observed hostnames:** `policy.cookiereports.com`

**Proof (representative URLs — from crawl):**

- https://policy.cookiereports.com/0acd08f0_panel-it.js
- https://policy.cookiereports.com/j/jquery.min.js
- https://policy.cookiereports.com/0acd08f0-it.html

---

## Adobe Fonts (Typekit)

- **Vendor:** Adobe Inc.
- **Role:** Fonts / typography CDN

### Details

- CSS and font files from `use.typekit.net`, `p.typekit.net`, etc.

### Why this is a third-party integration

Font delivery from Adobe-operated domains.

### Proof

**Observed hostnames:** `p.typekit.net`, `use.typekit.net`

**Proof (representative URLs — from crawl):**

- https://p.typekit.net/p.css?…
- https://use.typekit.net/af/0f2024/00000000000000007757659e/30/l?…
- https://use.typekit.net/af/2c24be/00000000000000007757659d/30/l?…
- https://use.typekit.net/af/2d2994/0000000000000000775765a2/30/l?…
- https://use.typekit.net/af/4a6cc0/0000000000000000775765a5/30/l?…

---

## Public JavaScript CDNs (jQuery, cdnjs)

- **Vendor:** jQuery / Cloudflare
- **Role:** JavaScript libraries

### Details

- Common AEM / tag bundles reference `code.jquery.com` and `cdnjs.cloudflare.com` for jQuery and migrate scripts.

### Why this is a third-party integration

Scripts are executed from third-party origins.

### Proof

**Observed hostnames:** `cdnjs.cloudflare.com`, `code.jquery.com`

**Proof (representative URLs — from crawl):**

- https://cdnjs.cloudflare.com/ajax/libs/jquery-migrate/3.2.0/jquery-migrate.min.js
- https://code.jquery.com/jquery-3.5.0.min.js

---

## Kaltura (video)

- **Vendor:** Kaltura, Inc.
- **Role:** Video hosting / player

### Details

- Embeds or player assets when video components reference Kaltura hosts.

### Why this is a third-party integration

Video platform outside `www.astrazeneca.it`.

### Proof

**Observed hostnames:** `www.kaltura.com`

**Proof (representative URLs — from crawl):**

- https://www.kaltura.com/p/432521/sp/43252100/embedIframeJs/uiconf_id/30358591/partner_id/432521

---

## Ad serving / measurement (Flashtalking, Innovid, Digital Control Room)

- **Vendor:** Multiple (Flashtalking, Innovid, Digital Control Room)
- **Role:** Advertising / campaign measurement

### Details

- Often reached via links or tags in marketing / campaign content; confirm paths in crawl proof.

### Why this is a third-party integration

Separate ad-tech vendors from the first-party origin.

### Proof

**Observed hostnames:** `www.digitalcontrolroom.com`, `www.flashtalking.com`, `www.innovid.com`

**Proof (representative URLs — from crawl):**

- https://www.digitalcontrolroom.com/
- https://www.digitalcontrolroom.com/privacy-policy/
- https://www.flashtalking.com/
- https://www.flashtalking.com/privacypolicy
- https://www.innovid.com/
- https://www.innovid.com/privacy-policy/

---

## Microsoft (privacy and support links)

- **Vendor:** Microsoft Corporation
- **Role:** Privacy documentation / support (cookie policy text)

### Details

- Linked from cookie / privacy copy (e.g. Edge cookie guidance, Microsoft privacy pages).

### Why this is a third-party integration

Content and assets on Microsoft-operated domains.

### Proof

**Observed hostnames:** `privacy.microsoft.com`, `support.microsoft.com`, `www.microsoft.com`

**Proof (representative URLs — from crawl):**

- https://privacy.microsoft.com/
- https://support.microsoft.com/it-it/windows/gestire-i-cookie-in-microsoft-edge-visualizzare-consentire-bloccare-eliminare-e-usare-168dab11-0753-043d-7c16-ede5947fc64d
- https://www.microsoft.com/

---

## Google

- **Vendor:** Google LLC
- **Role:** Analytics / fonts / embeds / support links

### Details

- May include `support.google.com` from cookie-help text; other Google hosts often arrive via Tealium-loaded tags.

### Why this is a third-party integration

Google-operated infrastructure.

### Proof

**Observed hostnames:** `support.google.com`

**Proof (representative URLs — from crawl):**

- https://support.google.com/chrome/answer/95647

---

## Browser vendor documentation (Apple, Mozilla)

- **Vendor:** Apple Inc. / Mozilla
- **Role:** Support / cookie documentation (links in policy copy)

### Details

- Linked from privacy or cookie notices (Safari / Firefox cookie guidance).

### Why this is a third-party integration

Documentation hosted on vendor domains.

### Proof

**Observed hostnames:** `support.apple.com`, `support.mozilla.org`

**Proof (representative URLs — from crawl):**

- https://support.apple.com/it-it/guide/safari/sfri11471/mac
- https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop

---

## Amazon (privacy / AWS policy links)

- **Vendor:** Amazon.com, Inc.
- **Role:** Linked policy / infrastructure documentation

### Details

- Often linked from cookie or privacy disclosures (e.g. load balancing / privacy pages).

### Why this is a third-party integration

Amazon-operated domains.

### Proof

**Observed hostnames:** `aws.amazon.com`, `www.amazon.com`

**Proof (representative URLs — from crawl):**

- https://aws.amazon.com/elasticloadbalancing/
- https://aws.amazon.com/privacy/
- https://www.amazon.com/
- https://www.amazon.com/privacy

---

## LinkedIn

- **Vendor:** LinkedIn / Microsoft
- **Role:** Social / professional (footer or content links)

### Details

- Company or campaign links to `www.linkedin.com`.

### Why this is a third-party integration

LinkedIn-operated domain.

### Proof

**Observed hostnames:** `www.linkedin.com`

**Proof (representative URLs — from crawl):**

- https://www.linkedin.com/company/astrazeneca/

---

## Meta (Facebook)

- **Vendor:** Meta Platforms, Inc.
- **Role:** Social (links or pixels)

### Details

- e.g. brand page links under `www.facebook.com`.

### Why this is a third-party integration

Meta-operated domain.

### Proof

**Observed hostnames:** `www.facebook.com`

**Proof (representative URLs — from crawl):**

- https://www.facebook.com/AstraZeneca/

---

## VMware (Broadcom)

- **Vendor:** VMware LLC (Broadcom)
- **Role:** Linked documentation / privacy

### Details

- May appear as privacy or technology links in policy copy.

### Why this is a third-party integration

Non-`astrazeneca.it` corporate domain.

### Proof

**Observed hostnames:** `www.vmware.com`

**Proof (representative URLs — from crawl):**

- https://www.vmware.com/
- https://www.vmware.com/help/privacy.html

---

## Schema.org (structured data vocabulary)

- **Vendor:** Schema.org community
- **Role:** Structured data identifiers

### Details

- JSON-LD or RDFa may reference `http(s)://schema.org/...` as vocabulary IRIs (not an API call).

### Why this is a third-party integration

Namespace is third-party; typically no script load from schema.org.

### Proof

**Observed hostnames:** `schema.org`

**Proof (representative URLs — from crawl):**

- http://schema.org
- http://schema.org/ImageObject
- http://schema.org/NewsArticle

---

## Additional vendor / ad-tech endpoints

| Host | Proof (example) |
|------|-----------------|
| `apacs-egpa.org` | https://apacs-egpa.org/ |
| `fondazionecuore.it` | https://fondazionecuore.it/ |
| `komen.it` | https://komen.it/ |
| `lampada-aladino.it` | https://lampada-aladino.it/ |
| `lotonlus.org` | https://lotonlus.org/ |
| `respiriamoinsieme.org` | https://respiriamoinsieme.org/ |
| `tesseraconsulting.it` | https://tesseraconsulting.it/ |
| `viveresenzastomaco.org` | https://viveresenzastomaco.org/ |
| `www.abrcadabra.it` | https://www.abrcadabra.it/ |
| `www.acto-italia.org` | https://www.acto-italia.org/acto-sicilia/acto-sicilia |
| `www.adobe.com` | https://www.adobe.com/ |
| `www.agenziafarmaco.gov.it` | http://www.agenziafarmaco.gov.it/ |
| `www.ail.it` | https://www.ail.it/ |
| `www.ailmessina.it` | https://www.ailmessina.it/ |
| `www.andosonlusnazionale.it` | https://www.andosonlusnazionale.it/ |
| `www.apicinfo.it` | https://www.apicinfo.it/ |
| `www.associazioneaisc.org` | https://www.associazioneaisc.org/ |
| `www.associazionepalinuro.com` | https://www.associazionepalinuro.com/ |
| `www.diabeteitalia.it` | https://www.diabeteitalia.it/ |
| `www.duecipromotion.com` | https://www.duecipromotion.com/ |
| `www.epac.it` | https://www.epac.it/ |
| `www.europadonna.it` | https://www.europadonna.it/ |
| `www.favo.it` | https://www.favo.it/ |
| `www.federdiabeticipuglia.it` | https://www.federdiabeticipuglia.it/ |
| `www.fmrweb.it` | https://www.fmrweb.it/ |
| `www.fondazioneitalianadelrene.org` | https://www.fondazioneitalianadelrene.org/ |
| `www.incontradonna.it` | https://www.incontradonna.it/index/ |
| `www.legatumori.mi.it` | https://www.legatumori.mi.it/ |
| `www.linfovita.it` | https://www.linfovita.it/ |
| `www.lupus-italy.org` | https://www.lupus-italy.org |
| `www.proformatcomunicazione.it` | https://www.proformatcomunicazione.it/ |
| `www.salutedonnaonlus.it` | https://www.salutedonnaonlus.it/ |
| `www.womenagainstlungcancer.org` | https://www.womenagainstlungcancer.org/ |

