/** Per-site settings for www.astrazeneca.it scans. */

export const HOST = 'www.astrazeneca.it';

export const SITE_LABEL = 'AstraZeneca Italy (www.astrazeneca.it)';

export const REFERENCE_DOC_TITLE = 'Third-party integrations — reference (AstraZeneca Italy)';

export const POST_HCP_REPORT_TITLE = 'AstraZeneca Italy — backend linkages (post-banner / consent)';

/** Same-organisation hostnames: not counted as vendor integrations in clear reports. */
export function isAstraZenecaOrgRoutingHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return h.endsWith('.astrazeneca.it') || h.endsWith('.astrazeneca.com');
}
