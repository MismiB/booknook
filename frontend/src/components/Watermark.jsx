import './Watermark.css';

const BASE_SPINES = [
  { x: 20, w: 55, h: 170 },
  { x: 83, w: 42, h: 210 },
  { x: 133, w: 62, h: 150 },
  { x: 203, w: 38, h: 195 },
  { x: 249, w: 52, h: 165 },
  { x: 309, w: 46, h: 220 },
  { x: 363, w: 58, h: 140 },
  { x: 429, w: 40, h: 185 },
  { x: 477, w: 54, h: 160 },
  { x: 539, w: 44, h: 200 },
];
const CYCLE_WIDTH = 600;
const REPEATS = 6; // wide enough to cover very large / ultrawide viewports without stretching
const BASELINE = 380;
const VIEWBOX_WIDTH = CYCLE_WIDTH * REPEATS;

const SPINES = Array.from({ length: REPEATS }, (_, cycle) =>
  BASE_SPINES.map((s) => ({ ...s, x: s.x + cycle * CYCLE_WIDTH }))
).flat();

export default function Watermark() {
  return (
    <svg
      className="watermark"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${BASELINE}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="var(--watermark-color, var(--brass))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {SPINES.map((s, i) => (
          <rect key={i} x={s.x} y={BASELINE - s.h} width={s.w} height={s.h} rx="7" />
        ))}
      </g>
    </svg>
  );
}
