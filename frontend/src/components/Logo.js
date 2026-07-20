import Image from 'next/image';

/**
 * Brand mark with a real light/dark pair:
 *  • light mode → full-colour /logo-trans.png  (2402×2219, navy lion + red shield + wordmark)
 *  • dark mode  → reverse /logo-light.png       (930×858, white text, red/white shield)
 *
 * Both render; CSS (`dark:` block/hidden) shows exactly one, so the swap is
 * instant with the theme — no flash. Each Image carries its OWN intrinsic
 * width/height so next/image reproduces the correct aspect ratio (no stretch).
 * Callers size by height (`h-16 w-auto` etc.) → width scales from the true
 * aspect ratio. The two files' ratios are near-identical (≈1.083), so switching
 * theme causes no width jump / layout shift. Only the visible image is
 * announced (the hidden one is display:none, ignored by assistive tech).
 */
export default function Logo({ className = 'h-12 w-auto sm:h-16', priority = false, reverse = false }) {
  // sizes covers the largest render (~87px wide at h-20) on 3x displays.
  const common = { alt: 'OzSecure Services', priority, sizes: '280px' };
  // `reverse` forces the white knockout logo regardless of theme — for use on a
  // dark surface (e.g. the navy admin sidebar) in both light and dark mode.
  if (reverse) {
    return <Image src="/logo-light.png" width={930} height={858} {...common} className={className} />;
  }
  return (
    <>
      <Image src="/logo-trans.png" width={2402} height={2219} {...common} className={`${className} block dark:hidden`} />
      <Image src="/logo-light.png" width={930} height={858} {...common} className={`${className} hidden dark:block`} />
    </>
  );
}
