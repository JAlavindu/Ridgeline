import type { LunarSite } from "../../data/lunarSites";

interface HistoryTimelineProps {
  year: number;

  sites: LunarSite[];

  onYearChange: (
    year: number
  ) => void;

  onSelectSite: (
    site: LunarSite
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
  const firstYear =
    Math.min(
      ...sites.map(
        (site) => site.year
      )
    );

  const lastYear =
    Math.max(
      ...sites.map(
        (site) => site.year
      )
    );

  /*
   * All missions that have happened by this year.
   */
  const visibleSites =
    sites.filter(
      (site) =>
        site.year <= year
    );

  /*
   * Missions that happened EXACTLY
   * at the current slider year.
   */
  const currentYearSites =
    sites.filter(
      (site) =>
        site.year === year
    );

  /*
   * Most recent mission available.
   *
   * This corresponds to the Moon's
   * current focus.
   */
  const currentFocus =
    [...visibleSites]
      .filter(
        (site) =>
          site.latitude !== null &&
          site.longitude !== null
      )
      .sort(
        (a, b) => {
          if (
            a.year !== b.year
          ) {
            return (
              b.year -
              a.year
            );
          }

          return String(
            a.id
          ).localeCompare(
            String(b.id)
          );
        }
      )[0];

  return (
    <div
      className="
        fixed
        inset-x-0
        bottom-0
        z-[95]
        max-h-[34dvh]
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
          max-w-[1200px]
        "
      >

        {/* =================================================
            TOP AREA
            ================================================= */}

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

          <div
            className="
              min-w-[230px]
              md:max-w-[260px]
            "
          >
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
              Move through the years.
              The Moon automatically
              turns toward the latest
              mission available.
            </p>

            {/* CURRENT FOCUS */}

            {currentFocus && (
              <div
                className="
                  mt-4
                  border-l
                  border-[#ff3b12]
                  pl-3
                "
              >
                <p
                  className="
                    text-[7px]
                    uppercase
                    tracking-[2px]
                    text-[#ff3b12]
                  "
                >
                  MOON FOCUS
                </p>

                <p
                  className="
                    mt-1
                    font-['Michroma']
                    text-[9px]
                    uppercase
                  "
                >
                  {currentFocus.name}
                </p>

                <p
                  className="
                    mt-1
                    text-[7px]
                    text-white/35
                  "
                >
                  {currentFocus.country}
                  {" · "}
                  {currentFocus.year}
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              SLIDER
              ================================================= */}

          <div
            className="
              min-w-0
              flex-1
            "
          >

            {/* YEAR LABELS */}

            <div
              className="
                mb-2
                flex
                items-center
                justify-between
                text-[8px]
                uppercase
                tracking-[2px]
                text-white/30
              "
            >
              <span>
                {firstYear}
              </span>

              <span
                className="
                  rounded-sm
                  border
                  border-[#ff3b12]/30
                  bg-[#ff3b12]/5
                  px-2
                  py-1
                  font-['Michroma']
                  text-[#ff3b12]
                "
              >
                {year}
              </span>

              <span>
                {lastYear}
              </span>
            </div>

            {/* RANGE */}

            <input
              aria-label="
                Lunar exploration year
              "
              className="
                h-1
                w-full
                cursor-pointer
                accent-[#ff3b12]
              "
              type="range"
              min={firstYear}
              max={lastYear}
              value={year}
              onChange={(
                event
              ) =>
                onYearChange(
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />

            {/* =================================================
                CURRENT YEAR EVENTS
                ================================================= */}

            {currentYearSites.length >
              0 && (
              <div
                className="
                  mt-3
                  flex
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    shrink-0
                    text-[7px]
                    uppercase
                    tracking-[2px]
                    text-[#ff3b12]
                  "
                >
                  {year}
                </span>

                <div
                  className="
                    h-px
                    w-5
                    bg-[#ff3b12]/40
                  "
                />

                <span
                  className="
                    text-[7px]
                    uppercase
                    tracking-[1.5px]
                    text-white/35
                  "
                >
                  NEW MISSION
                  {currentYearSites.length >
                  1
                    ? "S"
                    : ""}
                </span>
              </div>
            )}

            {/* =================================================
                SITE EVENTS
                ================================================= */}

            <div
              className="
                mt-3
                flex
                max-h-[100px]
                flex-wrap
                gap-2
                overflow-y-auto
              "
            >
              {visibleSites.map(
                (site) => {
                  const isCurrentYear =
                    site.year ===
                    year;

                  const isFocused =
                    currentFocus?.id ===
                    site.id;

                  return (
                    <button
                      key={String(
                        site.id
                      )}
                      type="button"
                      onClick={() =>
                        onSelectSite(
                          site
                        )
                      }
                      className={`
                        group
                        relative
                        border
                        px-2.5
                        py-1.5
                        text-left
                        transition-all
                        duration-300

                        ${
                          isFocused
                            ? `
                              border-[#ff3b12]
                              bg-[#ff3b12]/10
                              text-white
                              shadow-[0_0_20px_rgba(255,59,18,0.08)]
                            `
                            : isCurrentYear
                              ? `
                                border-white/25
                                bg-white/[0.04]
                                text-white/80
                              `
                              : `
                                border-white/10
                                text-white/40
                                hover:border-white/30
                                hover:text-white
                              `
                        }
                      `}
                    >

                      {/* CURRENT INDICATOR */}

                      {isFocused && (
                        <span
                          className="
                            absolute
                            -left-px
                            top-1/2
                            h-5
                            w-px
                            -translate-y-1/2
                            bg-[#ff3b12]
                            shadow-[0_0_10px_rgba(255,59,18,0.8)]
                          "
                        />
                      )}

                      {/* YEAR */}

                      <span
                        className={`
                          block
                          text-[6px]
                          uppercase
                          tracking-[1px]
                          ${
                            isFocused
                              ? "text-[#ff3b12]"
                              : "text-white/30"
                          }
                        `}
                      >
                        {site.year}
                      </span>

                      {/* NAME */}

                      <span
                        className="
                          mt-0.5
                          block
                          max-w-[150px]
                          truncate
                          text-[7px]
                          uppercase
                          tracking-[0.8px]
                        "
                      >
                        {site.name ??
                          String(
                            site.id
                          )}
                      </span>

                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* =================================================
              CLOSE
              ================================================= */}

          <button
            type="button"
            onClick={onClose}
            className="
              shrink-0
              border
              border-white/20
              px-4
              py-2
              text-[8px]
              uppercase
              tracking-[2px]
              transition
              hover:border-[#ff3b12]
              hover:text-white
            "
          >
            Close
          </button>
        </div>

        {/* =================================================
            FOOTER INFO
            ================================================= */}

        <div
          className="
            mt-4
            flex
            items-center
            justify-between
            border-t
            border-white/5
            pt-3
            text-[6px]
            uppercase
            tracking-[1.5px]
            text-white/20
          "
        >
          <span>
            {visibleSites.length}{" "}
            MISSION
            {visibleSites.length !==
            1
              ? "S"
              : ""}{" "}
            AVAILABLE
          </span>

          <span className="hidden sm:block">
            DRAG TIMELINE · MOON FOLLOWS
            MISSION HISTORY
          </span>
        </div>

      </div>
    </div>
  );
}