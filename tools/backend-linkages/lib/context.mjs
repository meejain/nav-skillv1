/**
 * Build scan context from a page URL (first-party = URL hostname unless overridden).
 * @param {string} pageUrl
 * @param {string} [firstPartyHostOverride]
 */
export function createScanContext(pageUrl, firstPartyHostOverride) {
  const u = new URL(pageUrl);
  const HOST = (firstPartyHostOverride || u.hostname).toLowerCase();
  const origin = `${u.protocol}//${u.host}`;
  const SITE_LABEL = `${HOST} (${origin})`;
  const REFERENCE_DOC_TITLE = `Third-party integrations — reference (${HOST})`;
  const POST_HCP_REPORT_TITLE = `${HOST} — backend linkages (post-consent)`;

  /** @param {string} hostname */
  function isOrgRoutingHost(hostname) {
    if (!hostname) return false;
    const h = hostname.toLowerCase();
    return h === HOST || h.endsWith(`.${HOST}`);
  }

  /** @param {string} hostname */
  function isThirdPartyHost(hostname) {
    if (!hostname) return false;
    const h = hostname.toLowerCase();
    if (h === HOST) return false;
    if (isOrgRoutingHost(h)) return false;
    return true;
  }

  return {
    pageUrl: u.href.split('#')[0],
    HOST,
    origin,
    SITE_LABEL,
    REFERENCE_DOC_TITLE,
    POST_HCP_REPORT_TITLE,
    isOrgRoutingHost,
    isThirdPartyHost,
  };
}
