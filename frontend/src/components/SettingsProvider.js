'use client';
import { createContext, useContext } from 'react';
import { SETTINGS_DEFAULTS } from '@/data/siteSettings';

// Makes the server-fetched site settings available to CLIENT components
// (Header, Footer, Hero, …) via a hook. Server components should call
// getSiteSettings() directly instead. Falls back to bundled defaults.
const SettingsContext = createContext(SETTINGS_DEFAULTS);

export function SettingsProvider({ settings, children }) {
  return <SettingsContext.Provider value={settings || SETTINGS_DEFAULTS}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SettingsContext);
}
