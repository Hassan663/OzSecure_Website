import Image from 'next/image';

/**
 * Brand mark with a real light/dark pair:
 *  • light mode → full-colour /logo-trans.png  (714×665, navy lion + red shield + wordmark)
 *  • dark mode  → reverse /logo-light.png       (714×665, white knockout, red shield)
 *
 * Both render; CSS (`dark:` block/hidden) shows exactly one, so the swap is
 * instant with the theme — no flash. Each Image carries its OWN intrinsic
 * width/height so next/image reproduces the correct aspect ratio (no stretch).
 * Callers size by height (`h-16 w-auto` etc.) → width scales from the true
 * aspect ratio. Both files are cut from the same master at identical
 * dimensions, so switching theme causes no width jump / layout shift. The
 * artwork is cropped tight to the ink — no baked-in padding — so `h-24` is
 * 24 units of *logo*, not whitespace. Only the visible image is
 * announced (the hidden one is display:none, ignored by assistive tech).
 */
export default function Logo({ className = 'h-14 w-auto sm:h-20', priority = false, reverse = false }) {
  // sizes covers the largest render (~120px wide at h-28, the header) on 3x displays.
  const common = { alt: 'OzSecure Services', priority, sizes: '420px' };
  // `reverse` forces the white knockout logo regardless of theme — for use on a
  // dark surface (e.g. the navy admin sidebar) in both light and dark mode.
  if (reverse) {
    return <Image src="/logo-light.png" width={714} height={665} {...common} className={className} />;
  }
  return (
    <>
      <Image src="/logo-trans.png" width={714} height={665} {...common} className={`${className} block dark:hidden`} />
      <Image src="/logo-light.png" width={714} height={665} {...common} className={`${className} hidden dark:block`} />
    </>
  );
}
