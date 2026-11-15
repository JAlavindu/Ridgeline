import type { LunarSite } from "../../data/lunarSites";

interface HistoryTimelineProps {
  year: number;
  sites: LunarSite[];
  onYearChange: (year: number) => void;
  onSelectSite: (site: LunarSite) => void;
  onClose: () => void;
}

export default function HistoryTimeline({
  year,
  sites,
  onYearChange,
  onSelectSite,
  onClose,
}: HistoryTimelineProps) {
  const years = [...new Set(sites.map((site) => site.year))].sort((a, b) => a - b);
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const span = Math.max(1, lastYear - firstYear);

  /**
   * Position of a year along the axis, matching where the range input's
   * thumb sits (the 16px thumb's centre runs from 8px to width-8px).
   */
  const at = (y: number) => `calc(8px + (100% - 16px) * ${(y - firstYear) / span})`;

  const landedSoFar = sites.filter((site) => site.year <= year);
  const thisYear = sites.filter((site) => site.year === year);

  // The mission the Moon is turned toward: latest one with coordinates
  const currentFocus = [...landedSoFar]
    .filter((site) => site.latitude !== null && site.longitude !== null)
    .sort((a, b) => b.year - a.year || String(a.id).localeCompare(String(b.id)))[0];

  // Longest stretch with no landings, shown on the axis (only if it is long)
  let gap: { from: number; to: number } | null = null;
  for (let i = 1; i < years.length; i++) {
    const length = years[i] - years[i - 1];
    if (length > 10 && (!gap || length > gap.to - gap.from)) {
      gap = { from: years[i - 1], to: years[i] };
    }
  }

  // Year labels under the axis: first, last, and any year well clear of its neighbours
  const labelled: number[] = [];
  for (const y of years) {
    const clearOfPrevious = labelled.length === 0 || y - labelled[labelled.length - 1] >= 5;
    const clearOfLast = lastYear - y >= 5 || y === lastYear;
    if (clearOfPrevious && clearOfLast) labelled.push(y);
  }

  return (
    <section
      aria-label="Mission history"
      className="
        history-panel
        fixed
        inset-x-3
        bottom-3
        z-[95]
        flex
        h-[44dvh]
        flex-col
        overflow-hidden
        rounded-[20px]
        border
        border-white/[0.08]
        bg-[#0a0a0a]
        sm:h-[260px]
      "
    >
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8">
        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-['Michroma'] text-[18px] uppercase leading-tight text-white">
              Mission history
            </h2>
            <p className="mt-1 text-[12px] text-white/45">
              Drag through the years. The Moon turns toward the latest landing.
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-4">
            {currentFocus && (
              <div className="hidden text-right sm:block">
                <p className="text-[11px] text-white/40">Moon is facing</p>
                <p className="mt-0.5 text-[14px] text-white">
                  {currentFocus.name}
                  <span className="text-white/40">
                    {" "}
                    · {currentFocus.country} · {currentFocus.year}
                  </span>
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mission history"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[20px] leading-none text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* ================= AXIS ================= */}
        <div className="mt-6 flex items-center gap-4">
          <span className="w-12 shrink-0 font-['Michroma'] text-[18px] tabular-nums text-[#ff3b12]">
            {year}
          </span>

          <div className="relative h-10 min-w-0 flex-1">
            {/* track */}
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
            {/* progress up to the chosen year */}
            <div
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-white/60"
              style={{ width: at(year) }}
            />

            {/* the long gap with no landings */}
            {gap && (
              <span
                className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/30"
                style={{ left: at((gap.from + gap.to) / 2) }}
              >
                {gap.to - gap.from - 1} years without a landing in this dataset
              </span>
            )}

            {/* one dot per landing year */}
            {years.map((y) => {
              const isFocusYear = currentFocus?.year === y;
              return (
                <span
                  key={y}
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isFocusYear ? "bg-[#ff3b12]" : y <= year ? "bg-white/80" : "bg-white/20"
                  }`}
                  style={{ left: at(y) }}
                />
              );
            })}

            {/* year labels */}
            {labelled.map((y) => (
              <span
                key={y}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-6px] -translate-x-1/2 text-[11px] tabular-nums text-white/40"
                style={{ left: at(y) }}
              >
                {y}
              </span>
            ))}

            {/* the real control: a range input laid over the axis */}
            <input
              type="range"
              aria-label="Year"
              min={firstYear}
              max={lastYear}
              step={1}
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="history-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
            />
          </div>
        </div>

        {/* ================= MISSIONS IN THIS YEAR ================= */}
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="text-[12px] font-medium text-white/50">
            {thisYear.length === 0
              ? `No landings in ${year}`
              : `${thisYear.length} landing${thisYear.length > 1 ? "s" : ""} in ${year}`}
          </h3>
          <span className="text-[12px] tabular-nums text-white/35">
            {landedSoFar.length} by {year}
          </span>
        </div>

        {thisYear.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {thisYear.map((site) => {
              const isFocused = currentFocus?.id === site.id;
              return (
                <li key={String(site.id)}>
                  <button
                    type="button"
                    onClick={() => onSelectSite(site)}
                    className="group flex items-center gap-2 text-[14px] text-white/75 transition hover:text-white"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${isFocused ? "bg-[#ff3b12]" : "bg-white/30"}`}
                    />
                    {site.name}
                    <span
                      aria-hidden="true"
                      className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
