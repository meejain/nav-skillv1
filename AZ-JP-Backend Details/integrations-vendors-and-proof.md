# MediChannel JP — third-party vendor integrations (with proof)

Generated from post–HCP scan: **2026-04-01T19:44:19.293Z** (source JSON: `backend-linkages-post-hcp-report.json`).

## What counts as an integration here

- **Included:** Hostnames operated by **external vendors** (tag managers, analytics SaaS, ad/measurement networks, search UX providers, identity providers, etc.) observed in **network requests** or **HTML** after the HCP gate.
- **Excluded:** Any hostname under **`*.astrazeneca.co.jp`** or **`*.astrazeneca.com`** (e.g. `med2.astrazeneca.co.jp` PDFs, `medsearch.astrazeneca.co.jp`, `www.astrazeneca.co.jp`, `www2.astrazeneca.co.jp`). These are **same-organisation routing / content**, not third-party SaaS integrations, even though the browser treats them as another origin.
- **Site context:** Public pages are served from **`https://med.astrazeneca.co.jp/`**.

---

## Tealium iQ Tag Management

- **Vendor:** Tealium, Inc.
- **Role:** Tag management / customer data platform orchestration

### Details

- Scripts: `utag.js` and `utag.sync.js` from profile path `//tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/` (bundles may load numbered chunks e.g. `utag.36.js`).
- Page template populates `window.utag_data` (UDO) before `utag.js` loads — page name, channel, login status, search terms, etc.
- Tealium then loads additional tags configured in the iQ profile (not visible in static HTML).
- Post-load calls often hit `collect.tealiumiq.com` and region visitor services (e.g. `visitor-service-*.tealiumiq.com`) for event and visitor profile APIs.

### Why this is a third-party integration

Requests are made to `tags.tiqcdn.com`, a Tealium-operated CDN outside AstraZeneca first-party infrastructure. Tealium can load arbitrary vendor scripts, set third-party cookies, and forward data to analytics or advertising endpoints per account configuration.

### Proof

**Observed hostnames:** `collect.tealiumiq.com`, `tags.tiqcdn.com`, `visitor-service-ap-east-1.tealiumiq.com`

**Proof (representative URLs — from crawl):**

- https://collect.tealiumiq.com/astrazeneca/jp-med.astrazeneca/2/i.gif
- https://tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/utag.36.js?…
- https://tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/utag.41.js?…
- https://tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/utag.43.js?…
- https://tags.tiqcdn.com/utag/astrazeneca/jp-med.astrazeneca/prod/utag.js
- https://visitor-service-ap-east-1.tealiumiq.com/astrazeneca/jp-med.astrazeneca/019d4a69e1d1001e68dd11517bab00075007e06d007e8?…

---

## Adobe Experience Cloud / Analytics (data collection)

- **Vendor:** Adobe Inc.
- **Role:** Analytics / Experience Cloud data collection

### Details

- After Tealium loads Adobe tags, the browser may send beacons to Adobe-hosted data collection hosts (historically `*.omtrdc.net` / `2o7.net` naming).
- Adobe Audience Manager / ID sync often uses `*.demdex.net` (e.g. `dpm.demdex.net`, `astrazeneca.demdex.net`).
- Example observed: `astrazenecaeurope.d3.sc.omtrdc.net`.

### Why this is a third-party integration

Data is sent to Adobe-operated infrastructure, not to `med.astrazeneca.co.jp`. Adobe processes hits per the customer’s Analytics/Experience Cloud configuration.

### Proof

**Observed hostnames:** `astrazeneca.demdex.net`, `astrazenecaeurope.d3.sc.omtrdc.net`, `dpm.demdex.net`

**Proof (representative URLs — from crawl):**

- https://astrazeneca.demdex.net/dest5.html?…
- https://astrazenecaeurope.d3.sc.omtrdc.net/b/ss/azeglobalimprod/1/JS-2.9.0/s84614520180791
- https://astrazenecaeurope.d3.sc.omtrdc.net/b/ss/azeglobalimprod/1/JS-2.9.0/s88473952141837?…
- https://astrazenecaeurope.d3.sc.omtrdc.net/b/ss/azeglobalimprod/1/JS-2.9.0/s89872395248108?…
- https://astrazenecaeurope.d3.sc.omtrdc.net/b/ss/azejpmedichanneldesktopprod/1/JS-2.22.3/s83141103138532?…
- https://dpm.demdex.net/ibs:dpid=3047&dpuuid=6665917842B1A3&gdpr=0&gdpr_consent=
- https://dpm.demdex.net/ibs:dpid=411&dpuuid=ac1q-AAAALmFHAN8
- https://dpm.demdex.net/ibs:dpid=477&dpuuid=a2f6ad9be5d7e567278c1be7d243e3439c0139fa3c576f06c4603311499b1f36b0da87c99174965
- https://dpm.demdex.net/ibs:dpid=903&dpuuid=ff4bd307-09d0-4ae5-9041-1c3ee18f0ba9

---

## Evergage (Salesforce Interaction Studio)

- **Vendor:** Salesforce, Inc. (Evergage)
- **Role:** Personalization / real-time interaction

### Details

- Beacon script: `https://cdn.evgnet.com/beacon/astrazeneca/japan/scripts/evergage.min.js` (async).
- Template may stub or override `Evergage.hideSections` to avoid layout conflicts.

### Why this is a third-party integration

Assets and collection endpoints are served from Salesforce-controlled domains (`cdn.evgnet.com`, etc.), not from `med.astrazeneca.co.jp`. Behavior and data processing are governed by Salesforce.

### Proof

**Observed hostnames:** `astrazeneca.germany-2.evergage.com`, `cdn.evgnet.com`

**Proof (representative URLs — from crawl):**

- https://astrazeneca.germany-2.evergage.com/api2/event/japan?…
- https://astrazeneca.germany-2.evergage.com/msreceiver?…
- https://astrazeneca.germany-2.evergage.com/pr?…
- https://cdn.evgnet.com/beacon/astrazeneca/japan/scripts/evergage.min.js

---

## Adobe Helix RUM (Real User Monitoring)

- **Vendor:** Adobe Inc.
- **Role:** Performance / observability

### Details

- Script: `https://rum.hlx.page/.rum/@adobe/helix-rum-js@^2/dist/rum-standalone.js` with `data-routing` attribute.

### Why this is a third-party integration

RUM beacons are sent to Adobe Helix/Edge Delivery monitoring infrastructure (`rum.hlx.page`), separate from the AEM publish origin.

### Proof

**Observed hostnames:** `rum.hlx.page`

**Proof (representative URLs — from crawl):**

- https://rum.hlx.page/.rum/@adobe/helix-rum-js@%5E2/dist/rum-standalone.js
- https://rum.hlx.page/.rum/@adobe/helix-rum-js@%5E2/dist/micro.js
- https://rum.hlx.page/.rum/100?…
- https://rum.hlx.page/.rum/@adobe/helix-rum-enhancer@%5E2/src/index.js

---

## SyncSearch (site search suggestions)

- **Vendor:** SyncSearch (third-party search UX vendor)
- **Role:** Site search / autocomplete

### Details

- Client script loaded from `//pro.syncsearch.jp/common/js/sync_suggest.js` (via `search.js` on MediChannel).
- Search results form posts to `https://medsearch.astrazeneca.co.jp/search` with fixed `site` id (e.g. `3LHU36IK`).
- Suggest API calls use SyncSearch roots (`ssl.syncsearch.jp` / `pro.syncsearch.jp`) per their JS.

### Why this is a third-party integration

Suggest/autocomplete is served from **SyncSearch-operated** domains (`pro.syncsearch.jp` / `ssl.syncsearch.jp`). That infrastructure is outside AstraZeneca’s AEM publish stack. (Search **result** pages may load from an AstraZeneca subdomain; those are treated as same-organisation routing in `integrations-vendors-and-proof.md`, not as a vendor integration.)

### Proof

**Observed hostnames:** `pro.syncsearch.jp`

**Proof (representative URLs — from crawl):**

- https://pro.syncsearch.jp/common/js/sync_suggest.js

---

## MedPass (HCP authentication / identity)

- **Vendor:** MedPass (third-party identity / compliance service)
- **Role:** Authentication / registration

### Details

- Login-related pages reference `/bin/medpassopenidconnect` and link to `medpass.co.jp`, `medpass.jp` for service, company, compliance.

### Why this is a third-party integration

Identity and compliance content are served from MedPass-operated domains, outside the MediChannel AEM origin.

### Proof

**Observed hostnames:** `medpass.co.jp`, `medpass.jp`

**Proof (representative URLs — from crawl):**

- https://medpass.co.jp/company/
- https://medpass.co.jp/compliance/
- https://medpass.co.jp/service/
- https://medpass.jp/javax.faces.resource/components.css.html?…
- https://medpass.jp/javax.faces.resource/components.js.html?…
- https://medpass.jp/javax.faces.resource/core.js.html?…
- https://medpass.jp/javax.faces.resource/css/common/import.css.html
- https://medpass.jp

---

## Google (tags, fonts, or embeds)

- **Vendor:** Google LLC
- **Role:** Analytics / fonts / maps / embeds (context-dependent)

### Details

- Observed only if network requests appear after Tealium or embeds load.

### Why this is a third-party integration

Any request to `google.com`, `gstatic.com`, or `googleapis.com` is to Google-operated infrastructure, not AstraZeneca first-party hosts.

### Proof

**Observed hostnames:** `ajax.googleapis.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `policies.google.com`, `support.google.com`, `www.google.com`

**Proof (representative URLs — from crawl):**

- https://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js?…
- https://fonts.googleapis.com/css2?…
- https://fonts.gstatic.com/s/robotocondensed/v31/ieVo2ZhZI2eCN5jzbjEETS9weq8-_d6T_POl0fRJeyWyosBO5XxjLdSL17o.woff2
- https://fonts.gstatic.com/s/urbanist/v18/L0xjDF02iFML4hGCyOCpRdycFsGxSrqDLBkvEZmqacG1Koy1.woff2
- https://policies.google.com/privacy
- https://support.google.com/chrome/answer/95647
- https://www.google.com/
- https://www.google.com/recaptcha/api.js

---

## Yahoo Japan (e.g. opt-out)

- **Vendor:** LY Corporation (Yahoo Japan)
- **Role:** Linked compliance / advertising opt-out

### Details

- Policy pages may link to `btoptout.yahoo.co.jp` for advertising opt-out.

### Why this is a third-party integration

Yahoo Japan operates the linked domain; requests to it are outside AstraZeneca control.

### Proof

**Observed hostnames:** `btoptout.yahoo.co.jp`

**Proof (representative URLs — from crawl):**

- http://btoptout.yahoo.co.jp/optout/index.html

---

## Ultmarc (privacy / data use)

- **Vendor:** Ultmarc, Inc.
- **Role:** Privacy disclosures (linked)

### Details

- Privacy policy may reference `www.ultmarc.co.jp/privacy/...` for shared-use explanations.

### Why this is a third-party integration

Ultmarc hosts the linked documentation on its own domain.

### Proof

**Observed hostnames:** `www.ultmarc.co.jp`

**Proof (representative URLs — from crawl):**

- https://www.ultmarc.co.jp/privacy/shared_use/index.html
- https://www.ultmarc.co.jp/privacy/shared_use02/list/index.html

---

## Additional vendor / ad-tech endpoints

These hosts appeared in the crawl but are **not** mapped to a named section in `integration-reference-catalog.mjs`. They are typically loaded **via Tealium** or other tags.

| Host | Proof (example from crawl) |
|------|------------------------------|
| `about.fb.com` | https://about.fb.com/ |
| `ag.innovid.com` | https://ag.innovid.com/dv/sync?… |
| `aws.amazon.com` | https://aws.amazon.com/elasticloadbalancing/ |
| `c.bing.com` | https://c.bing.com/c.gif?… |
| `c.clarity.ms` | https://c.clarity.ms/c.gif |
| `cdnjs.cloudflare.com` | https://cdnjs.cloudflare.com/ajax/libs/jquery-migrate/3.2.0/jquery-migrate.min.js |
| `cf-images.ap-northeast-1.prod.boltdns.net` | https://cf-images.ap-northeast-1.prod.boltdns.net/v1/static/4863540656001/0ddfa929-26e0-4d36-b0ba-c662486edb58/6548a109-c48f-4f28-b3c1-b939a845d896/1 |
| `cm.everesttech.net` | https://cm.everesttech.net/cm/dd?… |
| `cms.analytics.yahoo.com` | https://cms.analytics.yahoo.com/cms?… |
| `code.jquery.com` | https://code.jquery.com/jquery-3.5.0.min.js |
| `easl.eu` | https://easl.eu/publications/clinical-practice-guidelines/ |
| `edge.api.brightcove.com` | https://edge.api.brightcove.com/playback/v1/accounts/4863540656001/videos/ref%3Alyn_oc_professional_surgery_01 |
| `forms.office.com` | https://forms.office.com/r/Wig7ckLFAV |
| `ganjoho.jp` | https://ganjoho.jp/public/index.html |
| `get.adobe.com` | https://get.adobe.com/jp/reader/ |
| `haigan-tomoni.jp` | http://haigan-tomoni.jp |
| `idsync.rlcdn.com` | https://idsync.rlcdn.com/1000.gif?… |
| `j.clarity.ms` | https://j.clarity.ms/collect |
| `jsgo.or.jp` | https://jsgo.or.jp/guideline/taiganguide2023.html |
| `manifest.prod.boltdns.net` | https://manifest.prod.boltdns.net/thumbnail/v1/4863540656001/0ddfa929-26e0-4d36-b0ba-c662486edb58/833a2fab-be83-4aac-9782-0ff03690f2d?… |
| `match.adsrvr.org` | https://match.adsrvr.org/track/cmb/generic?… |
| `metrics.brightcove.com` | https://metrics.brightcove.com/v2/tracker?… |
| `p.typekit.net` | https://p.typekit.net/p.css?… |
| `players.brightcove.net` | https://players.brightcove.net/4863540656001/HIZ7vb7Vh_default/index.min.js |
| `policy.cookiereports.com` | https://policy.cookiereports.com/0c243c56_panel-ja.js |
| `privacy.microsoft.com` | https://privacy.microsoft.com/ |
| `schema.org` | http://schema.org/ImageObject |
| `scripts.clarity.ms` | https://scripts.clarity.ms/0.8.59/clarity.js |
| `servedby.flashtalking.com` | https://servedby.flashtalking.com/map/?… |
| `support.apple.com` | https://support.apple.com/en-gb/guide/safari/sfri11471/mac |
| `support.microsoft.com` | https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d |
| `support.mozilla.org` | https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop |
| `tealium.com` | https://tealium.com/ |
| `ups.analytics.yahoo.com` | https://ups.analytics.yahoo.com/ups/58782/cms?… |
| `use.typekit.net` | https://use.typekit.net/af/2c24be/00000000000000007757659d/30/l?… |
| `vjs.zencdn.net` | https://vjs.zencdn.net/vttjs/0.12.5/vtt.global.min.js |
| `www.adobe.com` | https://www.adobe.com/ |
| `www.amazon.com` | https://www.amazon.com/ |
| `www.asco.org` | https://www.asco.org/guidelines |
| `www.az-gynecologic-cancer.jp` | https://www.az-gynecologic-cancer.jp/ |
| `www.az-oncology.jp` | https://www.az-oncology.jp/tandogan/ |
| `www.clarity.ms` | https://www.clarity.ms/tag/qq11i9ygel |
| `www.digitalcontrolroom.com` | https://www.digitalcontrolroom.com/ |
| `www.facebook.com` | https://www.facebook.com/AstraZeneca.Japan/ |
| `www.fasenra-az.jp` | https://www.fasenra-az.jp/ |
| `www.flashtalking.com` | https://www.flashtalking.com/ |
| `www.haigan.gr.jp` | https://www.haigan.gr.jp/ |
| `www.i2jp.net` | https://www.i2jp.net/ |
| `www.imfinzi.jp` | http://www.imfinzi.jp/ |
| `www.innovid.com` | https://www.innovid.com/ |
| `www.instagram.com` | https://www.instagram.com/astrazenecajapan/ |
| `www.jbcs.gr.jp` | https://www.jbcs.gr.jp |
| `www.jds.or.jp` | https://www.jds.or.jp/modules/important/index.php |
| `www.jsco.or.jp` | https://www.jsco.or.jp |
| `www.jsh.or.jp` | https://www.jsh.or.jp/medical/guidelines/jsh_guidlines/medical/ |
| `www.jshct.com` | https://www.jshct.com |
| `www.jshem.or.jp` | http://www.jshem.or.jp |
| `www.jsog.or.jp` | https://www.jsog.or.jp |
| `www.linkedin.com` | https://www.linkedin.com/company/astrazeneca/ |
| `www.mhlw.go.jp` | https://www.mhlw.go.jp/content/11120000/000484135.pdf |
| `www.microsoft.com` | https://www.microsoft.com/ |
| `www.msdconnect.jp` | https://www.msdconnect.jp/lynparza-interim-report-202306/ |
| `www.naruhodo-zensoku.com` | https://www.naruhodo-zensoku.com/sekitanikigire/copd_treatment/checkcopd.html |
| `www.nccn.org` | https://www.nccn.org/guidelines/guidelines-detail |
| `www.pmda.go.jp` | https://www.pmda.go.jp/PmdaSearch/iyakuDetail/GeneralList/42910E4 |
| `www.rad-ar.or.jp` | https://www.rad-ar.or.jp/siori/search/result |
| `www.ransogan.jp` | http://www.ransogan.jp/ |
| `www.sle-smile.jp` | https://www.sle-smile.jp/ |
| `www.tagrisso.jp` | http://www.tagrisso.jp/ |
| `www.urol.or.jp` | https://www.urol.or.jp/other/guideline/ |
| `www.vmware.com` | https://www.vmware.com/ |
| `www.youtube.com` | https://www.youtube.com/@astrazenecajapan |
| `www.zenritsusen.jp` | http://www.zenritsusen.jp/ |

