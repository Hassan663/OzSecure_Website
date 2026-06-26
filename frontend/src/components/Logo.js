import Image from 'next/image';

/**
 * Brand mark with a real light/dark pair:
 *  • light mode → full-colour /logo-trans.png
 *  • dark mode  → white knockout /logo-light.png
 *
 * Both render; CSS (`dark:` block/hidden) shows exactly one, so the swap is
 * instant with the theme — no flash, no layout shift (identical 1492×1023
 * intrinsic dimensions → correct aspect ratio, no distortion). Only the
 * displayed one is announced (the hidden one is display:none, ignored by AT).
 */
export default function Logo({ className = 'h-12 w-auto sm:h-16', priority = false }) {
  const common = { alt: 'OzSecure Services', width: 1492, height: 1023, priority, sizes: '200px' };
  return (
    <>
      <Image src="/logo-trans.png" {...common} className={`${className} block dark:hidden`} />
      <Image src="/logo-light.png" {...common} className={`${className} hidden dark:block`} />
    </>
  );
}
