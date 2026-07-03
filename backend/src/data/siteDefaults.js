/**
 * Seed defaults for the dynamic "siteSettings" content object. Mirrors the
 * frontend bundled defaults in frontend/src/data/site.js so the two never drift.
 * These are written to the store on first run (if empty) and also used as the
 * merge base by the public + admin site-settings endpoints, so the API never
 * returns a blank field.
 */
export const siteSettingsDefaults = {
  name: 'OzSecure Services',
  tagline: 'Trusted Protection. Powerful Presence.',
  serviceLine: 'Security / TC / Cleaning / Labour',
  entity: 'A project of KN Management Services Pty Ltd',
  mln: '000109419',
  abn: '64 665 739 971',
  yearsExperience: '15+',
  phonePrimary: '0450 717 765',
  phonePrimaryTel: '+61450717765',
  email: 'info@ozsecuresecurity.com.au',
  address: { line1: '3/39 Marion Street', line2: 'Parramatta, NSW 2144' },
  coverage: 'Sydney & Greater NSW',
  hours: '24/7 Operations',
};

/** Merge stored siteSettings over the defaults so no field is ever blank. */
export function mergeSiteSettings(stored) {
  if (!stored || typeof stored !== 'object') return { ...siteSettingsDefaults };
  return {
    ...siteSettingsDefaults,
    ...stored,
    address: { ...siteSettingsDefaults.address, ...(stored.address || {}) },
  };
}
