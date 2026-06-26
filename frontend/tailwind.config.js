/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- theme-aware semantic tokens (flip on .dark via CSS vars) ----
        // RGB triplets so Tailwind opacity modifiers (e.g. text-ink/70) work.
        bg: 'rgb(var(--bg) / <alpha-value>)', // page background
        surface: 'rgb(var(--surface) / <alpha-value>)', // alternating / subtle sections
        panel: 'rgb(var(--panel) / <alpha-value>)', // cards / raised
        ink: 'rgb(var(--ink) / <alpha-value>)', // primary text
        heading: 'rgb(var(--heading) / <alpha-value>)', // headings / structure
        muted: 'rgb(var(--muted) / <alpha-value>)', // secondary text
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
        },
        // hairline needs per-theme alpha baked in → full color var (no /opacity)
        hairline: 'var(--hairline)',

        // ---- backward-compat tokens, remapped to theme vars where sensible ----
        steel: 'rgb(var(--muted) / <alpha-value>)',
        paper: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface) / <alpha-value>)',
        },
        line: { DEFAULT: 'var(--hairline)', dark: 'var(--hairline)' },
        // fixed brand tokens (used by panels not yet migrated; retired in later phases)
        navy: { DEFAULT: '#0F2340', deep: '#0A1830', soft: '#1A2F50' },
        red: { brand: '#C8102E', dark: '#9E0C24', glow: '#FF6B7E' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'], // Space Grotesk
        body: ['var(--font-body)', 'sans-serif'], // Inter
        label: ['var(--font-body)', 'sans-serif'], // alias → Inter
      },
      maxWidth: { shell: '1200px' },
      boxShadow: {
        soft: '0 10px 40px -24px rgba(15,35,64,.18)',
        card: '0 18px 50px -30px rgba(15,35,64,.22)',
      },
      letterSpacing: { label: '0.18em' },
    },
  },
  plugins: [],
};
