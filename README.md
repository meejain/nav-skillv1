# Backend linkages scanner

Node tool that loads one or more URLs, extracts third-party references from HTML, runs **Playwright** (headless Chromium) to capture network requests after optional consent clicks, and writes JSON + Markdown under `site-urls/`.

**Full behavior (for humans or AI agents):** [docs/BACKEND_LINKAGES_AI_AGENT.md](docs/BACKEND_LINKAGES_AI_AGENT.md)

## Setup

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
npm run scan -- --url "https://example.com/page"
```

Optional flags (see `tools/backend-linkages/scan.mjs` header):

- `--out site-urls/my-run` — default is `site-urls/<slug-from-url>/`
- `--first-party-host hostname` — treat extra hosts as first-party
- `--skip-fetch` / `--skip-playwright` — run only one phase
- `--reference-only --out <dir>` — regenerate MD from existing `backend-linkages-post-hcp-report.json`

## Outputs

Typical bundle:

- `backend-linkages-report.json` / `.md` — static fetch
- `backend-linkages-post-hcp-report.json` / `.md` — Playwright + network
- `third-party-hosts-inventory.md` — all third-party hostnames
- `third-party-integrations-reference.md`, `integrations-vendors-and-proof.md`
- `urls-all.json`

Playwright must run outside overly restrictive sandboxes if the browser fails to launch.

## License

See [LICENSE](LICENSE) (Apache 2.0, inherited from upstream template).
