# Third-party integrations — reference (MediChannel JP)

Generated: 2026-04-01T19:44:19.293Z

This document explains **what each class of integration is**, how it is **configured** on MediChannel (where known from HTML/network scans), and **why it counts as third party** (or first party) from a browser and privacy perspective.

**MediChannel first-party origin:** `https://med.astrazeneca.co.jp/` — anything on **another hostname** is at least a **separate site** for cookies, storage, and CORS (even if the same legal entity).

**Scan method:** Post–HCP Playwright crawl documented in `backend-linkages-post-hcp-report.json`.

Regenerate this file after catalog edits: `node scan-post-hcp.mjs --reference-only` (reads last JSON).

---

## Tealium iQ Tag Management

- **Vendor:** Tealium, Inc.
- **Category:** Tag management / customer data platform orchestration

### Configuration (on MediChannel)

- Scripts: `utag.js` and `utag.sync.js` from profile path `//tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/` (bundles may load numbered chunks e.g. `utag.36.js`).
- Page template populates `window.utag_data` (UDO) before `utag.js` loads — page name, channel, login status, search terms, etc.
- Tealium then loads additional tags configured in the iQ profile (not visible in static HTML).
- Post-load calls often hit `collect.tealiumiq.com` and region visitor services (e.g. `visitor-service-*.tealiumiq.com`) for event and visitor profile APIs.

### Why this is third party (or not)

Requests are made to `tags.tiqcdn.com`, a Tealium-operated CDN outside AstraZeneca first-party infrastructure. Tealium can load arbitrary vendor scripts, set third-party cookies, and forward data to analytics or advertising endpoints per account configuration.

### Typical data flows

Browser → Tealium CDN → (configured) analytics, pixels, consent tools, A/B tools, etc. Exact destinations depend on the live Tealium profile.

### Observed after HCP confirmation (this crawl)

Matched hosts: `collect.tealiumiq.com`, `tags.tiqcdn.com`, `visitor-service-ap-east-1.tealiumiq.com`. Seen on **up to 106** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Adobe Experience Cloud / Analytics (data collection)

- **Vendor:** Adobe Inc.
- **Category:** Analytics / Experience Cloud data collection

### Configuration (on MediChannel)

- After Tealium loads Adobe tags, the browser may send beacons to Adobe-hosted data collection hosts (historically `*.omtrdc.net` / `2o7.net` naming).
- Adobe Audience Manager / ID sync often uses `*.demdex.net` (e.g. `dpm.demdex.net`, `astrazeneca.demdex.net`).
- Example observed: `astrazenecaeurope.d3.sc.omtrdc.net`.

### Why this is third party (or not)

Data is sent to Adobe-operated infrastructure, not to `med.astrazeneca.co.jp`. Adobe processes hits per the customer’s Analytics/Experience Cloud configuration.

### Typical data flows

Page views, props/eVars, and related analytics payloads to Adobe collection endpoints.

### Observed after HCP confirmation (this crawl)

Matched hosts: `astrazeneca.demdex.net`, `astrazenecaeurope.d3.sc.omtrdc.net`, `dpm.demdex.net`. Seen on **up to 105** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Evergage (Salesforce Interaction Studio)

- **Vendor:** Salesforce, Inc. (Evergage)
- **Category:** Personalization / real-time interaction

### Configuration (on MediChannel)

- Beacon script: `https://cdn.evgnet.com/beacon/astrazeneca/japan/scripts/evergage.min.js` (async).
- Template may stub or override `Evergage.hideSections` to avoid layout conflicts.

### Why this is third party (or not)

Assets and collection endpoints are served from Salesforce-controlled domains (`cdn.evgnet.com`, etc.), not from `med.astrazeneca.co.jp`. Behavior and data processing are governed by Salesforce.

### Typical data flows

Page views, segments, and personalization events are typically sent to Evergage/Interaction Studio backends for rules and content delivery.

### Observed after HCP confirmation (this crawl)

Matched hosts: `astrazeneca.germany-2.evergage.com`, `cdn.evgnet.com`. Seen on **up to 104** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Adobe Helix RUM (Real User Monitoring)

- **Vendor:** Adobe Inc.
- **Category:** Performance / observability

### Configuration (on MediChannel)

- Script: `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/rum-standalone.js` with `data-routing` attribute.

### Why this is third party (or not)

RUM beacons are sent to Adobe Helix/Edge Delivery monitoring infrastructure (`rum.hlx.page`), separate from the AEM publish origin.

### Typical data flows

Performance metrics, navigation timing, and related telemetry to Adobe-operated endpoints.

### Observed after HCP confirmation (this crawl)

Matched hosts: `rum.hlx.page`. Seen on **up to 106** page loads (per-host counts: `hostsAggregated` in JSON).

---

## SyncSearch (site search suggestions)

- **Vendor:** SyncSearch (third-party search UX vendor)
- **Category:** Site search / autocomplete

### Configuration (on MediChannel)

- Client script loaded from `//pro.syncsearch.jp/common/js/sync_suggest.js` (via `search.js` on MediChannel).
- Search results form posts to `https://medsearch.astrazeneca.co.jp/search` with fixed `site` id (e.g. `3LHU36IK`).
- Suggest API calls use SyncSearch roots (`ssl.syncsearch.jp` / `pro.syncsearch.jp`) per their JS.

### Why this is third party (or not)

Autocomplete infrastructure and JSON suggest endpoints run on SyncSearch-operated domains. Even though `medsearch.astrazeneca.co.jp` is AstraZeneca-branded, it is a **different hostname** from `med.astrazeneca.co.jp` and is treated as a separate origin for cookies and CORS.

### Typical data flows

Query strings typed in the search box may be sent to SyncSearch for suggestions; full search navigates to the medsearch host.

### Observed after HCP confirmation (this crawl)

Matched hosts: `pro.syncsearch.jp`. Seen on **up to 104** page loads (per-host counts: `hostsAggregated` in JSON).

---

## MedSearch (hosted search results)

- **Vendor:** AstraZeneca (dedicated search subdomain)
- **Category:** Site search results

### Configuration (on MediChannel)

- Form `action` rewritten in `search.js` to `https://medsearch.astrazeneca.co.jp/search` with parameters `site`, `charset`, `group`, `design`, `query`.

### Why this is third party (or not)

From the **MediChannel** page origin (`med.astrazeneca.co.jp`), `medsearch.astrazeneca.co.jp` is a **different site** (separate cookie jar, separate TLS cert context). It is not “foreign SaaS” in a legal sense, but it **is** a distinct backend/origin in integration and privacy assessments.

### Typical data flows

User search queries and result pages are served from the medsearch subdomain.

### Observed after HCP confirmation (this crawl)

Matched hosts: `medsearch.astrazeneca.co.jp`. Seen on **up to 104** page loads (per-host counts: `hostsAggregated` in JSON).

---

## AstraZeneca digital governance / statements (first-party bundle)

- **Vendor:** AstraZeneca (implementation on AEM)
- **Category:** Cookie / legal statement UI

### Configuration (on MediChannel)

- Scripts and CSS under `/etc/designs/code/astrazeneca/digitalgovernance/` (e.g. `digitalstatements.min.js`).
- Markup includes `#postFrm`, `#statementDisplay`, `hdCookie` — drives on-site banners and statements.

### Why this is third party (or not)

Not third-party: delivered from the same AEM publish host as the page. Listed for contrast with Tealium/consent vendors that *are* third-party.

### Typical data flows

Typically first-party only unless the bundle calls external APIs (verify in minified source if required).

### Observed after HCP confirmation (this crawl)

**First-party** AEM scripts under `/etc/designs/.../digitalgovernance/`; not expected as a separate third-party **network host**. Presence is inferred from HTML in the post-HCP page dump.

---

## Other AstraZeneca Japan web properties

- **Vendor:** AstraZeneca
- **Category:** Cross-site links / corporate content

### Configuration (on MediChannel)

- Examples: `www.astrazeneca.co.jp` (corporate, patients), `www2.astrazeneca.co.jp` (SSL forms).

### Why this is third party (or not)

Same company but **different origins** from `med.astrazeneca.co.jp`. Browsers enforce separate cookies, storage, and security context. Linking or redirecting to these hosts is a **cross-origin** integration.

### Typical data flows

Only when the user follows the link; no automatic data transfer unless additional scripts or query params are used.

### Observed after HCP confirmation (this crawl)

Matched hosts: `med2.astrazeneca.co.jp`, `medicalinformation.astrazeneca.co.jp`, `mic-chat.astrazeneca.co.jp`, `side-effect.astrazeneca.co.jp`, `www.astrazeneca.co.jp`, `www2.astrazeneca.co.jp`. Seen on **up to 106** page loads (per-host counts: `hostsAggregated` in JSON).

---

## MedPass (HCP authentication / identity)

- **Vendor:** MedPass (third-party identity / compliance service)
- **Category:** Authentication / registration

### Configuration (on MediChannel)

- Login-related pages reference `/bin/medpassopenidconnect` and link to `medpass.co.jp`, `medpass.jp` for service, company, compliance.

### Why this is third party (or not)

Identity and compliance content are served from MedPass-operated domains, outside the MediChannel AEM origin.

### Typical data flows

Registration and OpenID Connect flows involve redirects and tokens between MediChannel and MedPass.

### Observed after HCP confirmation (this crawl)

Matched hosts: `medpass.co.jp`, `medpass.jp`. Seen on **up to 3** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Veeva CRM (referenced servlet)

- **Vendor:** Veeva Systems
- **Category:** Life sciences CRM / engagement

### Configuration (on MediChannel)

- Login template may reference `/bin/veevaCrmRequest` (AEM servlet bridging to Veeva).

### Why this is third party (or not)

Servlet name implies server-side or client-initiated calls toward Veeva cloud; Veeva is a separate vendor from Adobe AEM.

### Typical data flows

Depends on servlet implementation — typically HCP or activity data for CRM alignment.

### Observed after HCP confirmation (this crawl)

No matching host in the aggregated **network** log for this catalog entry. It may still appear as **HTML-only** links, or load only on specific pages.

---

## Google (tags, fonts, or embeds)

- **Vendor:** Google LLC
- **Category:** Analytics / fonts / maps / embeds (context-dependent)

### Configuration (on MediChannel)

- O
- b
- s
- e
- r
- v
- e
- d
-  
- o
- n
- l
- y
-  
- i
- f
-  
- n
- e
- t
- w
- o
- r
- k
-  
- r
- e
- q
- u
- e
- s
- t
- s
-  
- a
- p
- p
- e
- a
- r
-  
- a
- f
- t
- e
- r
-  
- T
- e
- a
- l
- i
- u
- m
-  
- o
- r
-  
- e
- m
- b
- e
- d
- s
-  
- l
- o
- a
- d
- .

### Why this is third party (or not)

Any request to `google.com`, `gstatic.com`, or `googleapis.com` is to Google-operated infrastructure, not AstraZeneca first-party hosts.

### Typical data flows

Varies: GA4, Tag Manager, fonts, YouTube embeds, reCAPTCHA, etc.

### Observed after HCP confirmation (this crawl)

Matched hosts: `ajax.googleapis.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `policies.google.com`, `support.google.com`, `www.google.com`. Seen on **up to 31** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Yahoo Japan (e.g. opt-out)

- **Vendor:** LY Corporation (Yahoo Japan)
- **Category:** Linked compliance / advertising opt-out

### Configuration (on MediChannel)

- P
- o
- l
- i
- c
- y
-  
- p
- a
- g
- e
- s
-  
- m
- a
- y
-  
- l
- i
- n
- k
-  
- t
- o
-  
- `
- b
- t
- o
- p
- t
- o
- u
- t
- .
- y
- a
- h
- o
- o
- .
- c
- o
- .
- j
- p
- `
-  
- f
- o
- r
-  
- a
- d
- v
- e
- r
- t
- i
- s
- i
- n
- g
-  
- o
- p
- t
- -
- o
- u
- t
- .

### Why this is third party (or not)

Yahoo Japan operates the linked domain; requests to it are outside AstraZeneca control.

### Typical data flows

User navigates voluntarily via hyperlink.

### Observed after HCP confirmation (this crawl)

Matched hosts: `btoptout.yahoo.co.jp`. Seen on **up to 1** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Ultmarc (privacy / data use)

- **Vendor:** Ultmarc, Inc.
- **Category:** Privacy disclosures (linked)

### Configuration (on MediChannel)

- P
- r
- i
- v
- a
- c
- y
-  
- p
- o
- l
- i
- c
- y
-  
- m
- a
- y
-  
- r
- e
- f
- e
- r
- e
- n
- c
- e
-  
- `
- w
- w
- w
- .
- u
- l
- t
- m
- a
- r
- c
- .
- c
- o
- .
- j
- p
- /
- p
- r
- i
- v
- a
- c
- y
- /
- .
- .
- .
- `
-  
- f
- o
- r
-  
- s
- h
- a
- r
- e
- d
- -
- u
- s
- e
-  
- e
- x
- p
- l
- a
- n
- a
- t
- i
- o
- n
- s
- .

### Why this is third party (or not)

Ultmarc hosts the linked documentation on its own domain.

### Typical data flows

Reading linked pages; any analytics on Ultmarc side is separate from MediChannel.

### Observed after HCP confirmation (this crawl)

Matched hosts: `www.ultmarc.co.jp`. Seen on **up to 1** page loads (per-host counts: `hostsAggregated` in JSON).

---

## Amazon CloudFront (CDN edge)

- **Vendor:** Amazon Web Services, Inc.
- **Category:** CDN / edge caching

### Configuration (on MediChannel)

- M
- a
- y
-  
- a
- p
- p
- e
- a
- r
-  
- i
- n
-  
- r
- e
- s
- p
- o
- n
- s
- e
-  
- h
- e
- a
- d
- e
- r
- s
-  
- o
- r
-  
- r
- e
- d
- i
- r
- e
- c
- t
-  
- c
- h
- a
- i
- n
- s
-  
- f
- o
- r
-  
- b
- l
- o
- c
- k
- e
- d
- /
- b
- o
- t
-  
- r
- e
- q
- u
- e
- s
- t
- s
- .

### Why this is third party (or not)

AWS operates CloudFront; it is infrastructure distinct from the customer origin, though often used *by* the site owner.

### Typical data flows

Static and dynamic content delivery; access logs may be processed by AWS/customer.

### Observed after HCP confirmation (this crawl)

No matching host in the aggregated **network** log for this catalog entry. It may still appear as **HTML-only** links, or load only on specific pages.

---

## Additional hosts seen on the network (unmatched catalog entries)

These hostnames appeared in the post-HCP network capture but did not match a catalog `matchHost` rule above. They should be classified manually or by extending `integration-reference-catalog.mjs`.

### `about.fb.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `ag.innovid.com`
- **Page loads (count):** 1
- **Sample page paths:** /

### `aws.amazon.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `c.bing.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `c.clarity.ms`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `careers.astrazeneca.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `cdnjs.cloudflare.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `cf-images.ap-northeast-1.prod.boltdns.net`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `cm.everesttech.net`
- **Page loads (count):** 1
- **Sample page paths:** /

### `cms.analytics.yahoo.com`
- **Page loads (count):** 1
- **Sample page paths:** /

### `code.jquery.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `contactazmedical.astrazeneca.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/qa.html

### `do-not-sell-my-personal-information.astrazeneca.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/qa.html

### `easl.eu`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-imf_hcc.html, /product/brand-jdo_hcc.html

### `edge.api.brightcove.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `forms.office.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/qa.html

### `ganjoho.jp`
- **Page loads (count):** 3
- **Sample page paths:** /product/brand-imf_bt.html, /product/brand-imf_hcc.html, /product/brand-jdo_hcc.html

### `get.adobe.com`
- **Page loads (count):** 1
- **Sample page paths:** /information/faq.html

### `haigan-tomoni.jp`
- **Page loads (count):** 3
- **Sample page paths:** /safety/IMF.html, /safety/JDO.html, /safety/TAG.html

### `idsync.rlcdn.com`
- **Page loads (count):** 1
- **Sample page paths:** /

### `j.clarity.ms`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `jsgo.or.jp`
- **Page loads (count):** 2
- **Sample page paths:** /safety/IMF.html, /safety/LYN.html

### `manifest.prod.boltdns.net`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `match.adsrvr.org`
- **Page loads (count):** 1
- **Sample page paths:** /

### `medicalinformation.astrazeneca.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/qa.html

### `metrics.brightcove.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `p.typekit.net`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `players.brightcove.net`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `policy.cookiereports.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `privacy.microsoft.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `schema.org`
- **Page loads (count):** 3
- **Sample page paths:** /product/azport.html, /product/qa.html, /safety/side-effect.html

### `scripts.clarity.ms`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `servedby.flashtalking.com`
- **Page loads (count):** 1
- **Sample page paths:** /

### `support.apple.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `support.microsoft.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `support.mozilla.org`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `tealium.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `ups.analytics.yahoo.com`
- **Page loads (count):** 1
- **Sample page paths:** /

### `use.typekit.net`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `vjs.zencdn.net`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-lyn_oc.html, /safety/side-effect.html

### `www.adobe.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.amazon.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.asco.org`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-imf_hcc.html, /product/brand-jdo_hcc.html

### `www.astrazeneca.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.az-gynecologic-cancer.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/IMF.html

### `www.az-oncology.jp`
- **Page loads (count):** 6
- **Sample page paths:** /product/brand-imf_bt.html, /product/brand-imf_hcc.html, /product/brand-imf_uc.html, /product/brand-jdo_hcc.html, /safety/IMF.html …

### `www.clarity.ms`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.digitalcontrolroom.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.facebook.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.fasenra-az.jp`
- **Page loads (count):** 1
- **Sample page paths:** /product/brand-fsn.html

### `www.flashtalking.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.haigan.gr.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/TAG.html

### `www.i2jp.net`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.imfinzi.jp`
- **Page loads (count):** 6
- **Sample page paths:** /TA/immuno-oncology.html, /TA/lung-cancer.html, /product/brand-imf_bt.html, /product/brand-imf_hcc.html, /product/brand-imf_uc.html …

### `www.innovid.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.instagram.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.jbcs.gr.jp`
- **Page loads (count):** 2
- **Sample page paths:** /safety/LYN.html, /safety/TRQ.html

### `www.jds.or.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/TRQ.html

### `www.jsco.or.jp`
- **Page loads (count):** 3
- **Sample page paths:** /safety/LYN.html, /safety/TAG.html, /safety/TRQ.html

### `www.jsh.or.jp`
- **Page loads (count):** 4
- **Sample page paths:** /product/brand-imf_hcc.html, /product/brand-jdo_hcc.html, /safety/IMF.html, /safety/JDO.html

### `www.jshct.com`
- **Page loads (count):** 1
- **Sample page paths:** /safety/CAL.html

### `www.jshem.or.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/CAL.html

### `www.jsog.or.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/LYN.html

### `www.linkedin.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.mhlw.go.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/TAG.html

### `www.microsoft.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.msdconnect.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/LYN.html

### `www.naruhodo-zensoku.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/brand-brz.html

### `www.nccn.org`
- **Page loads (count):** 2
- **Sample page paths:** /product/brand-imf_hcc.html, /product/brand-jdo_hcc.html

### `www.pmda.go.jp`
- **Page loads (count):** 6
- **Sample page paths:** /safety/CAL.html, /safety/IMF.html, /safety/JDO.html, /safety/LYN.html, /safety/TAG.html …

### `www.rad-ar.or.jp`
- **Page loads (count):** 8
- **Sample page paths:** /product.html, /product/brand-brz.html, /safety/CAL.html, /safety/IMF.html, /safety/JDO.html …

### `www.ransogan.jp`
- **Page loads (count):** 1
- **Sample page paths:** /TA/gynecologic-oncology.html

### `www.sle-smile.jp`
- **Page loads (count):** 1
- **Sample page paths:** /product/brand-spn.html

### `www.tagrisso.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/TAG.html

### `www.urol.or.jp`
- **Page loads (count):** 1
- **Sample page paths:** /safety/IMF.html

### `www.vmware.com`
- **Page loads (count):** 2
- **Sample page paths:** /product/azport.html, /product/qa.html

### `www.youtube.com`
- **Page loads (count):** 1
- **Sample page paths:** /product/azport.html

### `www.zenritsusen.jp`
- **Page loads (count):** 1
- **Sample page paths:** /product/brand-zol.html

