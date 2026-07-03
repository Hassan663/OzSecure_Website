/**
 * Faint Southern Cross motif (SVG). Inherits its line/star colour from
 * `currentColor` (so callers set `text-muted/25` etc. for a subtle, theme-aware
 * tone), with one fixed red accent star. Purely decorative.
 */
const PTS = [
  { x: 96, y: 16, r: 2.4 },
  { x: 84, y: 196, r: 3.4, accent: true },
  { x: 18, y: 92, r: 2.4 },
  { x: 150, y: 70, r: 2.4 },
  { x: 70, y: 132, r: 1.6 },
];

export default function Constellation({ className = '' }) {
  return (
    <svg viewBox="0 0 168 212" className={className} fill="none" aria-hidden="true">
      <line x1={PTS[0].x} y1={PTS[0].y} x2={PTS[1].x} y2={PTS[1].y} stroke="currentColor" strokeWidth="1" />
      <line x1={PTS[2].x} y1={PTS[2].y} x2={PTS[3].x} y2={PTS[3].y} stroke="currentColor" strokeWidth="1" />
      {PTS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.accent ? 'rgb(var(--accent))' : 'currentColor'} />
      ))}
    </svg>
  );
}
