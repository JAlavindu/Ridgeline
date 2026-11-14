import { useMemo, useState } from "react";
import type { LunarSite } from "../../src/data/lunarSites";

import NavigateMoon from "../components/terrain/NavigateMoon";
import OrbitalAction from "../components/terrain/OrbitalAction";
import HistoryTimeline from "../components/terrain/HistoryTimeline";
import SiteDrawer from "../components/terrain/SiteDrawer";
import SkyPanel from "../components/terrain/SkyPanel";

export type NavigateSite = LunarSite & {
  name?: string;
  latitude?: number;
  longitude?: number;
  year?: number;
  country?: string;
  mission?: string;
  description?: string;
  status?: string;
};

type NavigateMode =
  | "default"
  | "select"
  | "history"
  | "sky"
  | "delay"
  | "compare"
  | "days"
  | "proof";

interface NavigatePageProps {
  sites: LunarSite[];
}

export default function NavigatePage({
  sites,
}: NavigatePageProps) {
  // =========================================================
  // STATE
  // =========================================================

  const [mode, setMode] = useState<NavigateMode>("default");

  const [selectedSite, setSelectedSite] =
    useState<NavigateSite | null>(null);

  const [historyYear, setHistoryYear] =
    useState(2025);

  const [delayDays, setDelayDays] =
    useState(0);

  const [compareIds, setCompareIds] =
    useState<string[]>([]);

  // =========================================================
  // NORMALISE SITE DATA
  // =========================================================

  const normalizedSites = useMemo(
    () =>
      (sites as NavigateSite[]).filter(
        Boolean
      ),
    [sites]
  );

  // =========================================================
  // HISTORY FILTER
  // =========================================================

  const visibleSites = useMemo(() => {
    if (mode !== "history") {
      return normalizedSites;
    }

    return normalizedSites.filter((site) => {
      const year = Number(site.year);

      if (!Number.isFinite(year)) {
        return true;
      }

      return year <= historyYear;
    });
  }, [
    normalizedSites,
    historyYear,
    mode,
  ]);

  // =========================================================
  // OPEN / CLOSE MODES
  // =========================================================

  const openMode = (
    next:
      | "select"
      | "history"
      | "sky"
      | "delay"
      | "compare"
      | "days"
      | "proof"
  ) => {
    setMode((current) =>
      current === next
        ? "default"
        : next
    );
  };

  // =========================================================
  // SITE SELECTION
  // =========================================================

  const selectSite = (
    site: NavigateSite
  ) => {
    setSelectedSite(site);
    setMode("select");
  };

  // =========================================================
  // CLOSE SITE
  // =========================================================

  const closeSite = () => {
    setSelectedSite(null);
    setMode("default");
  };

  // =========================================================
  // COMPARE
  // =========================================================

  const toggleCompare = (
    site: NavigateSite
  ) => {
    const id = String(site.id);

    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (item) => item !== id
        );
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, id];
    });
  };

  const compareSites =
    normalizedSites.filter((site) =>
      compareIds.includes(
        String(site.id)
      )
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-white">

      {/* =====================================================
          SPACE BACKGROUND
      ===================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          bg-cover
          bg-center
          bg-no-repeat
          opacity-55
        "
        style={{
          backgroundImage:
            "url('/images/space-background.jpg')",
        }}
      />

      {/* DARK OVERLAY */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[1]
          bg-black/65
        "
      />

      {/* TECHNICAL GRID */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[2]
          opacity-[0.10]
          bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)]
          bg-[size:110px_110px]
        "
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="
          relative
          z-[80]
          flex
          items-center
          justify-between
          px-[7.5vw]
          py-6
        "
      >

        {/* LOGO */}

        <div
          className="
            font-['Michroma']
            text-[13px]
            tracking-[2px]
          "
        >
          LUNA{" "}
          <span className="text-white/35">
            SPACE
          </span>
        </div>

        {/* CENTER STATUS */}

        <div
          className="
            hidden
            items-center
            gap-3
            text-[8px]
            uppercase
            tracking-[3px]
            text-white/40
            md:flex
          "
        >
          <span
            className="
              h-2
              w-2
              rounded-full
              bg-[#ff3b12]
              shadow-[0_0_10px_rgba(255,59,18,0.7)]
            "
          />

          LUNAR NAVIGATOR
        </div>

        {/* EXIT */}

        <button
          type="button"
          onClick={() =>
            setMode("default")
          }
          className="
            border
            border-white/30
            px-4
            py-2
            text-[9px]
            uppercase
            tracking-[2px]
            transition
            hover:border-[#ff3b12]
            hover:bg-[#ff3b12]
            hover:text-white
          "
        >
          Exit
        </button>
      </header>

      {/* =====================================================
          PAGE INTRO
      ===================================================== */}

      <section
        className="
          relative
          z-20
          px-6
          pt-8
          text-center
          md:pt-10
        "
      >

        <p
          className="
            mb-3
            text-[8px]
            uppercase
            tracking-[5px]
            text-white/35
          "
        >
          03 — LUNAR NAVIGATION
        </p>

        <h1
          className="
            font-['Michroma']
            text-[clamp(30px,4vw,62px)]
            font-light
            uppercase
            leading-none
            tracking-[-2px]
          "
        >
          Explore the{" "}
          <span className="text-[#ff3b12]">
            Moon
          </span>
        </h1>

        <p
          className="
            mx-auto
            mt-4
            max-w-[530px]
            text-[10px]
            leading-[1.7]
            text-white/45
            md:text-[11px]
          "
        >
          Explore missions, landing sites,
          sunlight and terrain through one
          simple interactive Moon. Choose a
          tool around the globe to begin.
        </p>
      </section>

      {/* =====================================================
          MAIN NAVIGATION AREA
      ===================================================== */}

      <section
        className="
          relative
          z-20
          mx-auto
          mt-8
          h-[920px]
          w-full
          max-w-[1280px]
          px-4
          sm:h-[980px]
          lg:mt-2
          lg:h-[670px]
        "
      >

        {/* ===================================================
            OUTER ORBIT
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[25%]
            h-[min(82vw,380px)]
            w-[min(82vw,380px)]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-white/[0.08]
            sm:h-[min(65vw,460px)]
            sm:w-[min(65vw,460px)]
            lg:top-1/2
            lg:h-[590px]
            lg:w-[590px]
          "
        />

        {/* ===================================================
            INNER ORBIT
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[25%]
            h-[min(64vw,300px)]
            w-[min(64vw,300px)]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-dashed
            border-white/[0.08]
            lg:top-1/2
            lg:h-[400px]
            lg:w-[400px]
          "
        />

        {/* ===================================================
            ORBITAL CROSSHAIR
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-10
            hidden
            h-[640px]
            w-px
            -translate-y-1/2
            bg-white/[0.035]
            lg:block
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-10
            hidden
            h-px
            w-[640px]
            -translate-x-1/2
            bg-white/[0.035]
            lg:block
          "
        />

        {/* ===================================================
            MOON
        =================================================== */}

        <NavigateMoon
          sites={visibleSites}
          selectionMode={
            mode === "select"
          }
          selectedSite={selectedSite}
          onSelectSite={selectSite}
        />

        {/* ===================================================
            ORBITAL ACTION 01
        =================================================== */}

        <OrbitalAction
          position="top"
          number="01"
          label="SELECT SITE"
          detail="Rotate the Moon"
          active={mode === "select"}
          onClick={() =>
            openMode("select")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 02
        =================================================== */}

        <OrbitalAction
          position="left"
          number="02"
          label="HISTORY"
          detail="Explore lunar missions"
          active={mode === "history"}
          onClick={() =>
            openMode("history")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 03
        =================================================== */}

        <OrbitalAction
          position="right"
          number="03"
          label="SUN & EARTH"
          detail="See the lunar sky"
          active={mode === "sky"}
          onClick={() =>
            openMode("sky")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 04
        =================================================== */}

        <OrbitalAction
          position="bottom-left"
          number="04"
          label="LAUNCH DELAY"
          detail="Test a mission slip"
          active={mode === "delay"}
          onClick={() =>
            openMode("delay")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 05
        =================================================== */}

        <OrbitalAction
          position="bottom-right"
          number="05"
          label="COMPARE"
          detail={`${compareSites.length}/4 sites`}
          active={mode === "compare"}
          onClick={() =>
            openMode("compare")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 06
        =================================================== */}

        <OrbitalAction
          position="far-left"
          number="06"
          label="BEST DAYS"
          detail="Find landing windows"
          active={mode === "days"}
          onClick={() =>
            openMode("days")
          }
        />

        {/* ===================================================
            ORBITAL ACTION 07
        =================================================== */}

        <OrbitalAction
          position="far-right"
          number="07"
          label="NASA PROOF"
          detail="Validation & sources"
          active={mode === "proof"}
          onClick={() =>
            openMode("proof")
          }
        />
      </section>

      {/* =====================================================
          HISTORY TIMELINE
      ===================================================== */}

      {mode === "history" && (
        <HistoryTimeline
          year={historyYear}
          sites={visibleSites}
          onYearChange={
            setHistoryYear
          }
          onSelectSite={
            selectSite
          }
          onClose={() =>
            setMode("default")
          }
        />
      )}

      {/* =====================================================
          SUN + EARTH PANEL
      ===================================================== */}

      {mode === "sky" && (
        <SkyPanel
          onClose={() =>
            setMode("default")
          }
        />
      )}

      {/* =====================================================
          LAUNCH DELAY
      ===================================================== */}

      {mode === "delay" && (
        <div
          className="
            fixed
            inset-x-0
            bottom-0
            z-[95]
            border-t
            border-white/15
            bg-[#050505]/95
            px-6
            py-5
            backdrop-blur-xl
            md:px-[7.5vw]
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1000px]
              flex-col
              gap-4
              md:flex-row
              md:items-center
            "
          >

            <div className="min-w-[220px]">

              <p
                className="
                  text-[8px]
                  uppercase
                  tracking-[3px]
                  text-white/35
                "
              >
                04 — LAUNCH DELAY
              </p>

              <h2
                className="
                  mt-2
                  font-['Michroma']
                  text-sm
                "
              >
                MISSION SLIP
              </h2>

              <p
                className="
                  mt-1
                  text-[9px]
                  text-white/40
                "
              >
                Move the mission date within
                the supported ±60-day
                planning range.
              </p>
            </div>

            <input
              aria-label="Launch delay in days"
              type="range"
              min={-60}
              max={60}
              value={delayDays}
              onChange={(event) =>
                setDelayDays(
                  Number(
                    event.target.value
                  )
                )
              }
              className="
                w-full
                accent-[#ff3b12]
              "
            />

            <div
              className="
                w-24
                text-right
                font-['Michroma']
                text-xl
              "
            >
              {delayDays > 0
                ? "+"
                : ""}
              {delayDays}

              <span
                className="
                  ml-1
                  text-[8px]
                  text-white/35
                "
              >
                DAYS
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setMode("default")
              }
              className="
                border
                border-white/20
                px-4
                py-2
                text-[8px]
                uppercase
                tracking-[2px]
                hover:border-[#ff3b12]
              "
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          COMPARE SITES
      ===================================================== */}

      {mode === "compare" && (
        <div
          className="
            fixed
            inset-x-0
            bottom-0
            z-[95]
            border-t
            border-white/15
            bg-[#050505]/95
            px-6
            py-5
            backdrop-blur-xl
            md:px-[7.5vw]
          "
        >
          <div className="mx-auto max-w-[1100px]">

            <div
              className="
                mb-4
                flex
                items-end
                justify-between
              "
            >

              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[3px]
                    text-white/35
                  "
                >
                  05 — COMPARE SITES
                </p>

                <h2
                  className="
                    mt-2
                    font-['Michroma']
                    text-sm
                  "
                >
                  SCENARIO BOARD
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMode("default")
                }
                className="
                  text-[9px]
                  text-white/45
                  hover:text-white
                "
              >
                CLOSE ×
              </button>
            </div>

            <div
              className="
                grid
                grid-cols-2
                gap-2
                md:grid-cols-4
              "
            >
              {normalizedSites
                .slice(0, 8)
                .map((site) => {
                  const id =
                    String(site.id);

                  const checked =
                    compareIds.includes(
                      id
                    );

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        toggleCompare(site)
                      }
                      className={`
                        border
                        p-3
                        text-left
                        transition
                        ${
                          checked
                            ? "border-[#ff3b12] bg-[#ff3b12]/10"
                            : "border-white/10 hover:border-white/30"
                        }
                      `}
                    >
                      <div
                        className="
                          text-[8px]
                          uppercase
                          tracking-[2px]
                          text-white/35
                        "
                      >
                        {site.country ??
                          "SITE"}
                      </div>

                      <div
                        className="
                          mt-2
                          font-['Michroma']
                          text-[10px]
                        "
                      >
                        {site.name ??
                          id}
                      </div>
                    </button>
                  );
                })}
            </div>

            <p
              className="
                mt-3
                text-[8px]
                text-white/30
              "
            >
              Scientific comparison values
              should be populated from the
              validated M5 scenario engine.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          BEST LANDING DAYS
      ===================================================== */}

      {mode === "days" && (
        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-end
            justify-center
            bg-black/60
            p-4
            backdrop-blur-sm
            md:items-center
          "
        >
          <div
            className="
              w-full
              max-w-[720px]
              border
              border-white/15
              bg-[#050505]
              p-6
              md:p-8
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[3px]
                    text-white/35
                  "
                >
                  06 — BEST LANDING DAYS
                </p>

                <h2
                  className="
                    mt-2
                    font-['Michroma']
                    text-lg
                  "
                >
                  WINDOW FINDER
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMode("default")
                }
                className="
                  text-white/45
                  hover:text-white
                "
              >
                ×
              </button>
            </div>

            <div
              className="
                mt-7
                grid
                grid-cols-7
                gap-1
              "
            >
              {Array.from(
                { length: 28 },
                (_, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square
                      border
                      p-2
                      ${
                        index % 5 === 0
                          ? "border-[#ff3b12] bg-[#ff3b12]/10"
                          : "border-white/10"
                      }
                    `}
                  >
                    <span
                      className="
                        text-[8px]
                        text-white/45
                      "
                    >
                      {index + 1}
                    </span>
                  </div>
                )
              )}
            </div>

            <p
              className="
                mt-5
                text-[9px]
                leading-[1.6]
                text-white/40
              "
            >
              This calendar is a visual
              shell. Connect the M5
              window-finder calculations
              before presenting a day as
              scientifically optimal.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          NASA PROOF
      ===================================================== */}

      {mode === "proof" && (
        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-end
            justify-center
            bg-black/60
            p-4
            backdrop-blur-sm
            md:items-center
          "
        >
          <div
            className="
              w-full
              max-w-[720px]
              border
              border-white/15
              bg-[#050505]
              p-6
              md:p-8
            "
          >

            <div
              className="
                flex
                justify-between
              "
            >

              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[3px]
                    text-white/35
                  "
                >
                  07 — NASA PROOF
                </p>

                <h2
                  className="
                    mt-2
                    font-['Michroma']
                    text-lg
                  "
                >
                  VALIDATION SUITE
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMode("default")
                }
                className="
                  text-white/45
                  hover:text-white
                "
              >
                ×
              </button>
            </div>

            <div
              className="
                mt-7
                grid
                gap-3
                md:grid-cols-3
              "
            >
              {[
                [
                  "JPL HORIZONS",
                  "VECTOR CHECK",
                  "Pending live data",
                ],
                [
                  "PGDA 69",
                  "MAP CHECK",
                  "Pending terrain data",
                ],
                [
                  "MOON vs EARTH",
                  "PRIMER",
                  "Reference explainer",
                ],
              ].map(
                ([title, metric, source]) => (
                  <div
                    key={title}
                    className="
                      border
                      border-white/10
                      p-4
                    "
                  >
                    <div
                      className="
                        text-[8px]
                        tracking-[2px]
                        text-white/35
                      "
                    >
                      {title}
                    </div>

                    <div
                      className="
                        mt-3
                        font-['Michroma']
                        text-[10px]
                      "
                    >
                      {metric}
                    </div>

                    <div
                      className="
                        mt-2
                        text-[8px]
                        text-white/35
                      "
                    >
                      {source}
                    </div>
                  </div>
                )
              )}
            </div>

            <p
              className="
                mt-6
                text-[9px]
                leading-[1.6]
                text-white/40
              "
            >
              The supplied architecture
              specifies validation against
              JPL Horizons vectors and PGDA
              69 maps. Replace the pending
              states with the actual validation
              suite results.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SITE DRAWER
      ===================================================== */}

      {selectedSite &&
        mode === "select" && (
          <SiteDrawer
            site={selectedSite}
            onClose={closeSite}
          />
        )}

      {/* =====================================================
          FOOT NOTE
      ===================================================== */}

      <footer
        className="
          relative
          z-20
          px-6
          pb-8
          text-center
          text-[7px]
          uppercase
          tracking-[3px]
          text-white/20
        "
      >
        NASA DATA → TERRAIN → LIGHT → DECISION
      </footer>
    </main>
  );
}