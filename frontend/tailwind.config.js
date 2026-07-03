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
        // ---- official OzSecure brand tokens ----
        // Patriot Blue navy: base #0D1B3D, with deep (darker) + soft (lighter) derived
        navy: { DEFAULT: '#0D1B3D', deep: '#081027', soft: '#16264E' },
        // Crimson Red accent: brand #D72626, dark (hover) + glow (lightened) derived
        red: { brand: '#D72626', dark: '#B01E1E', glow: '#F56363' },
        charcoal: '#1A1A1A', // darkest surface / dark-mode base
        silver: '#F1F1F1', // light section background
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'], // Poppins
        body: ['var(--font-body)', 'sans-serif'], // Montserrat
        label: ['var(--font-body)', 'sans-serif'], // alias → Montserrat
      },
      maxWidth: { shell: '1200px' },
      boxShadow: {
        soft: '0 10px 40px -24px rgba(13,27,61,.18)',
        card: '0 18px 50px -30px rgba(13,27,61,.22)',
      },
      letterSpacing: { label: '0.18em' },
    },
  },
  plugins: [],
};
