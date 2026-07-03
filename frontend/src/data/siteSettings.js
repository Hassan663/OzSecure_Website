// Pure, framework-free settings defaults + merge (safe to import from BOTH
// server and client components). The bundled fallback is the static `site`
// object — so the site renders correctly even if the API is empty/unreachable.
import { site } from './site';

export const SETTINGS_DEFAULTS = {
  name: site.name,
  tagline: site.tagline,
  serviceLine: site.serviceLine,
  entity: site.entity,
  mln: site.mln,
  abn: site.abn,
  yearsExperience: site.yearsExperience,
  phonePrimary: site.phonePrimary,
  phonePrimaryTel: site.phonePrimaryTel,
  email: site.email,
  address: { line1: site.address.line1, line2: site.address.line2 },
  coverage: site.coverage,
  hours: site.hours || '24/7 Operations',
};

/** Merge stored settings over defaults so no field is ever blank. */
export function mergeSettings(stored) {
  if (!stored || typeof stored !== 'object') return SETTINGS_DEFAULTS;
  return {
    ...SETTINGS_DEFAULTS,
    ...stored,
    address: { ...SETTINGS_DEFAULTS.address, ...(stored.address || {}) },
  };
}
