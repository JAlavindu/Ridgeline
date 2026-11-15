import { useMemo, useState, type MouseEvent } from "react";

import { timelineRows, type Series } from "../../engine";

const W = 640;
const BAND = 16;
const GAP = 10;
const LABEL_W = 92;
const TOP = 4;
const MAX_COLUMNS = 600;

const BANDS = [
  { key: "sun", label: "Sunlight" },
  { key: "earth", label: "Earth in view" },
  { key: "both", label: "Power + contact" },
] as const;

/** Three bands over the mission: how much Sun, whether Earth is up, and both together. Times are UTC. */
export default function Timeline({ series }: { series: Series }) {
  const rows = useMemo(() => timelineRows(series, Math.max(1, Math.ceil(series.tdb.length / MAX_COLUMNS))), [series]);
  const [hover, setHover] = useState<number | null>(null);

  if (rows.length === 0) return null;
  const plotW = W - LABEL_W;
  const colW = plotW / rows.length;
  const height = TOP + BANDS.length * (BAND + GAP) + 18;

  // a tick wherever the date changes between columns (on long missions a column spans hours, so it rarely
  // lands exactly on midnight), thinned so labels never crowd
  const dayStarts = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => (i === 0 ? r.time_utc.slice(11, 16) === "00:00" : r.time_utc.slice(0, 10) !== rows[i - 1].time_utc.slice(0, 10)));
  const every = Math.max(1, Math.ceil(dayStarts.length / 8));
  const ticks = dayStarts.filter((_, k) => k % every === 0);

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const xView = ((e.clientX - box.left) / box.width) * W;
    const i = Math.floor((xView - LABEL_W) / colW);
    setHover(i >= 0 && i < rows.length ? i : null);
  };

  const h = hover !== null ? rows[hover] : null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[16px] font-medium text-white">Over the mission</h3>
        <p className="text-[13px] text-white/40">Times in UTC · hover or tap for values</p>
      </div>
      {/* on a phone the chart keeps a readable width and scrolls sideways inside its panel */}
      <div className="mt-3 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label="Timeline of sunlight, Earth visibility and both over the mission"
        className="block h-auto w-full min-w-[560px] touch-pan-x"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={onMove}
      >
        {BANDS.map((band, b) => {
          const y = TOP + b * (BAND + GAP);
          return (
            <g key={band.key}>
              <text x={0} y={y + BAND - 4} fontSize="12" fill="#fff" fillOpacity="0.5">{band.label}</text>
              <rect x={LABEL_W} y={y} width={plotW} height={BAND} fill="#fff" fillOpacity="0.04" />
              {rows.map((r, i) => {
                let fill: string | null = null;
                let opacity = 1;
                if (band.key === "sun") {
                  if (r.is_eclipse) { fill = "#38bdf8"; opacity = 0.55; }
                  else if (r.sun_fraction > 0) { fill = "#f2c14e"; opacity = 0.25 + 0.75 * r.sun_fraction; }
                } else if (band.key === "earth") {
                  if (r.is_earth_visible) { fill = "#38bdf8"; opacity = 0.8; }
                } else if (r.is_both) {
                  fill = "#ffffff"; opacity = 0.75;
                }
                return fill ? (
                  <rect key={i} x={LABEL_W + i * colW} y={y} width={colW + 0.3} height={BAND} fill={fill} fillOpacity={opacity} />
                ) : null;
              })}
            </g>
          );
        })}
        {ticks.map(({ r, i }) => (
          <g key={i}>
            <line x1={LABEL_W + i * colW} x2={LABEL_W + i * colW} y1={TOP} y2={height - 16} stroke="#fff" strokeOpacity="0.12" />
            <text x={LABEL_W + i * colW} y={height - 4} fontSize="12" fill="#fff" fillOpacity="0.4" textAnchor="middle">
              {r.time_utc.slice(5, 10)}
            </text>
          </g>
        ))}
        {hover !== null && (
          <line x1={LABEL_W + (hover + 0.5) * colW} x2={LABEL_W + (hover + 0.5) * colW} y1={TOP} y2={height - 16} stroke="#ff3b12" strokeWidth="1.2" />
        )}
      </svg>
      </div>
      <p className="mt-1 text-[12px] text-white/35 sm:hidden">Swipe the chart sideways to see all of it →</p>

      <p className="mt-2 min-h-[18px] text-[13px] tabular-nums text-white/60">
        {h
          ? `${h.time_utc.slice(0, 16).replace("T", " ")} UTC · Sun ${h.sun_el.toFixed(1)}° high, ${Math.round(100 * h.sun_fraction)}% of disc visible${h.is_eclipse ? " (Earth in front of the Sun)" : ""} · Earth ${h.earth_el.toFixed(1)}° ${h.is_earth_visible ? "in view" : "hidden"}`
          : <span className="text-white/35"><span className="mr-1 inline-block h-2 w-3 bg-[#f2c14e]/80 align-middle" />Sun (brighter = more of the disc) <span className="mx-1 inline-block h-2 w-3 bg-sky-400/60 align-middle" />Earth in view, or an eclipse in the Sun band</span>}
      </p>
    </div>
  );
}
