/**
 * Per-route entrance. CSS-only (no JS animation library) — replays on each
 * navigation because Next remounts the template. Reduced motion disables it in
 * globals.css.
 */
export default function Template({ children }) {
  return <div className="route-fade">{children}</div>;
}
