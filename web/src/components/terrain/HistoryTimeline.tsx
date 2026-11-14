import type { NavigateSite } from "../../pages/TerrainPage";

interface HistoryTimelineProps {
  year: number;
  sites: NavigateSite[];
  onYearChange: (
    year: number
  ) => void;
  onSelectSite: (
    site: NavigateSite
  ) => void;
  onClose: () => void;
}

export default function HistoryTimeline({
  year,
  sites,
  onYearChange,
  onSelectSite,
  onClose,
}: HistoryTimelineProps) {
  return (
    <div
      className="
        fixed
        inset-x-0
        bottom-0
        z-[95]
        max-h-[55dvh]
        overflow-y-auto
        overscroll-contain
        border-t
        border-white/15
        bg-[#050505]/95
        px-4
        py-4
        backdrop-blur-xl
        sm:px-6
        sm:py-5
        md:px-[7.5vw]
      "
    >

      <div
        className="
          mx-auto
          max-w-[1100px]
        "
      >

        <div
          className="
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-end
          "
        >

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="min-w-[230px]">

            <p
              className="
                text-[8px]
                uppercase
                tracking-[3px]
                text-white/35
              "
            >
              02 — HISTORY
            </p>

            <h2
              className="
                mt-2
                font-['Michroma']
                text-sm
              "
            >
              MOON EXPLORATION
            </h2>

            <p
              className="
                mt-1
                text-[9px]
                leading-[1.5]
                text-white/40
              "
            >
              Scrub through lunar exploration
              history and see which sites
              existed by each period.
            </p>

          </div>

          {/* =================================================
              SLIDER
          ================================================= */}

          <div className="flex-1">

            <div
              className="
                mb-2
                flex
                justify-between
                text-[8px]
                uppercase
                tracking-[2px]
                text-white/30
              "
            >

              <span>
                1969
              </span>

              <span
                className="
                  font-['Michroma']
                  text-[#ff3b12]
                "
              >
                {year}
              </span>

              <span>
                2027+
              </span>

            </div>

            <input
              aria-label="Lunar exploration year"
              className="
                w-full
                accent-[#ff3b12]
              "
              type="range"
              min={1969}
              max={2027}
              value={year}
              onChange={(event) =>
                onYearChange(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            {/* =================================================
                SITE EVENTS
            ================================================= */}

            <div
              className="
                mt-3
                flex
                flex-wrap
                gap-2
              "
            >

              {sites
                .slice(0, 8)
                .map((site) => (
                  <button
                    key={String(site.id)}
                    type="button"
                    onClick={() =>
                      onSelectSite(site)
                    }
                    className="
                      border
                      border-white/10
                      px-2
                      py-1
                      text-[7px]
                      uppercase
                      tracking-[1px]
                      text-white/45
                      transition
                      hover:border-[#ff3b12]
                      hover:text-white
                    "
                  >
                    {site.name ??
                      String(
                        site.id
                      )}
                  </button>
                ))}

            </div>
          </div>

          {/* =================================================
              CLOSE
          ================================================= */}

          <button
            type="button"
            onClick={onClose}
            className="
              border
              border-white/20
              px-4
              py-2
              text-[8px]
              uppercase
              tracking-[2px]
              transition
              hover:border-[#ff3b12]
            "
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
}