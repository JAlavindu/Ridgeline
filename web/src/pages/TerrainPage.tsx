import {
  useMemo,
  useState,
} from "react";

import {
  lunarSites,
} from "../data/lunarSites";

import type {
  LunarSite,
} from "../data/lunarSites";

import HistoryTimeline from "../components/terrain/HistoryTimeline";
import NavigateMoon from "../components/terrain/NavigateMoon";
import OrbitalAction from "../components/terrain/OrbitalAction";
import SiteDrawer from "../components/terrain/SiteDrawer";
import SkyPanel from "../components/terrain/SkyPanel";

type TerrainMode =
  | "default"
  | "select"
  | "history"
  | "sky";

const latestMissionYear =
  Math.max(
    ...lunarSites.map(
      (site) => site.year
    )
  );

export default function TerrainPage() {
  const [
    mode,
    setMode,
  ] = useState<TerrainMode>(
    "default"
  );

  const [
    selectedSite,
    setSelectedSite,
  ] = useState<LunarSite | null>(
    null
  );

  /*
   * The site the Moon should currently
   * rotate toward.
   */
  const [
    focusedSite,
    setFocusedSite,
  ] = useState<LunarSite | null>(
    null
  );

  const [
    historyYear,
    setHistoryYear,
  ] = useState(
    latestMissionYear
  );

  /*
   * =========================================================
   * VISIBLE SITES
   * =========================================================
   */

  const visibleSites = useMemo(
    () => {
      if (
        mode !== "history"
      ) {
        return lunarSites;
      }

      return lunarSites.filter(
        (site) =>
          site.year <=
          historyYear
      );
    },
    [
      historyYear,
      mode,
    ]
  );

  /*
   * =========================================================
   * FIND HISTORY FOCUS
   * =========================================================
   *
   * We want the most recent mission that:
   *
   * 1. happened before/equal to the current year
   * 2. has actual coordinates
   *
   * This prevents a mission with no coordinates from
   * trying to rotate the globe to an impossible location.
   */
  const getHistoryFocusSite = (
    year: number
  ): LunarSite | null => {
    const candidates =
      lunarSites
        .filter(
          (site) =>
            site.year <= year &&
            site.latitude !== null &&
            site.longitude !== null
        )
        .sort(
          (a, b) => {
            /*
             * Most recent year first.
             */
            if (
              a.year !== b.year
            ) {
              return (
                b.year -
                a.year
              );
            }

            /*
             * Deterministic order when multiple
             * missions happened in the same year.
             */
            return String(
              a.id
            ).localeCompare(
              String(b.id)
            );
          }
        );

    return (
      candidates[0] ??
      null
    );
  };

  /*
   * =========================================================
   * HISTORY SLIDER
   * =========================================================
   */

  const handleHistoryYearChange =
    (year: number) => {
      setHistoryYear(year);

      /*
       * Find the latest mission available
       * at this point in history.
       */
      const nextFocus =
        getHistoryFocusSite(
          year
        );

      setFocusedSite(
        nextFocus
      );

      /*
       * Timeline controls the Moon,
       * so close any previous drawer.
       */
      setSelectedSite(
        null
      );
    };

  /*
   * =========================================================
   * SELECT SITE
   * =========================================================
   */

  const selectSite = (
    site: LunarSite
  ) => {
    setSelectedSite(
      site
    );

    /*
     * Selecting a site also makes the Moon
     * rotate toward that site.
     */
    setFocusedSite(
      site
    );

    setMode("select");
  };

  /*
   * =========================================================
   * CLOSE SITE
   * =========================================================
   */

  const closeSelection =
    () => {
      setSelectedSite(
        null
      );

      setFocusedSite(
        null
      );

      setMode("default");
    };

  /*
   * =========================================================
   * MODE SWITCH
   * =========================================================
   */

  const toggleMode = (
    nextMode:
      | "select"
      | "history"
      | "sky"
  ) => {
    /*
     * Clicking the current mode closes it.
     */
    if (
      mode === nextMode
    ) {
      setMode("default");

      setSelectedSite(
        null
      );

      setFocusedSite(
        null
      );

      return;
    }

    /*
     * Remove selected drawer when
     * switching modes.
     */
    setSelectedSite(
      null
    );

    /*
     * HISTORY
     *
     * Immediately focus the latest mission
     * available for the current year.
     */
    if (
      nextMode === "history"
    ) {
      const focus =
        getHistoryFocusSite(
          historyYear
        );

      setFocusedSite(
        focus
      );
    } else {
      setFocusedSite(
        null
      );
    }

    setMode(
      nextMode
    );
  };

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#020202]
        text-white
      "
    >

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,255,255,0.07),transparent_44%),radial-gradient(ellipse_at_50%_100%,rgba(255,59,18,0.05),transparent_55%)]
        "
      />

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header
        className="
          relative
          z-20
          flex
          items-center
          justify-between
          px-6
          py-5
          sm:px-10
          lg:px-[7.5vw]
        "
      >
        <a
          href="/"
          className="
            font-['Michroma']
            text-[11px]
            tracking-[2px]
            text-white/85
          "
        >
          LUNA{" "}
          <span className="text-white/35">
            SPACE
          </span>
        </a>

        <div
          className="
            hidden
            items-center
            gap-3
            text-[8px]
            uppercase
            tracking-[3px]
            text-white/40
            sm:flex
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-[#ff3b12]
              shadow-[0_0_10px_rgba(255,59,18,0.7)]
            "
          />

          LUNAR TERRAIN EXPLORER
        </div>

        <a
          href="/"
          className="
            border
            border-white/20
            px-3
            py-2
            text-[8px]
            uppercase
            tracking-[2px]
            text-white/60
            transition
            hover:border-[#ff3b12]
            hover:text-white
            sm:px-4
          "
        >
          Exit
        </a>
      </header>

      {/* =====================================================
          TITLE
          ===================================================== */}

      <section
        className="
          relative
          z-20
          px-5
          pt-5
          text-center
          sm:pt-8
        "
      >
        <p
          className="
            mb-3
            text-[8px]
            uppercase
            tracking-[4px]
            text-white/35
          "
        >
          LUNAR SURFACE · INTERACTIVE GLOBE
        </p>

        <h1
          className="
            font-['Michroma']
            text-[clamp(28px,5vw,58px)]
            font-light
            uppercase
            leading-tight
            tracking-[-1.5px]
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
            mt-3
            max-w-[500px]
            text-[10px]
            leading-[1.7]
            text-white/45
            sm:text-[11px]
          "
        >
          Drag to turn the Moon. Explore
          mission history and discover
          important lunar landing sites.
        </p>
      </section>

      {/* =====================================================
          SELECTION OVERLAY
          ===================================================== */}

      {mode === "select" && (
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            fixed
            inset-0
            z-10
            bg-black/20
            backdrop-blur-[1px]
          "
        />
      )}

      {/* =====================================================
          MOON EXPLORER
          ===================================================== */}

      <section
        aria-label="
          Interactive Moon and explorer controls
        "
        className="
          relative
          z-20
          mx-auto
          mt-6
          h-[760px]
          w-full
          max-w-[1280px]
          px-4
          sm:h-[820px]
          lg:mt-2
          lg:h-[670px]
        "
      >

        {/* OUTER ORBIT */}

        <div
          aria-hidden="true"
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
            border-white/[0.07]
            sm:h-[min(65vw,460px)]
            sm:w-[min(65vw,460px)]
            lg:top-1/2
            lg:h-[590px]
            lg:w-[590px]
          "
        />

        {/* INNER ORBIT */}

        <div
          aria-hidden="true"
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

        {/* MOON */}

        <NavigateMoon
          sites={
            visibleSites
          }
          selectionMode={
            mode === "select"
          }
          historyMode={
            mode === "history"
          }
          selectedSite={
            selectedSite
          }
          focusedSite={
            focusedSite
          }
          onSelectSite={
            selectSite
          }
        />

        {/* =================================================
            SELECT
            ================================================= */}

        <OrbitalAction
          position="top"
          number="01"
          label={
            mode === "select"
              ? "EXIT SELECTION"
              : "SELECT SITE"
          }
          detail={
            mode === "select"
              ? "Return to the Moon"
              : "Choose a mission site"
          }
          active={
            mode === "select"
          }
          onClick={() =>
            mode === "select"
              ? closeSelection()
              : toggleMode(
                  "select"
                )
          }
        />

        {/* =================================================
            HISTORY
            ================================================= */}

        <OrbitalAction
          position="left"
          number="02"
          label="HISTORY"
          detail="Explore missions by year"
          active={
            mode === "history"
          }
          onClick={() =>
            toggleMode(
              "history"
            )
          }
        />

        {/* =================================================
            SUN & EARTH
            ================================================= */}

        <OrbitalAction
          position="right"
          number="03"
          label="SUN & EARTH"
          detail="Learn about the lunar sky"
          active={
            mode === "sky"
          }
          onClick={() =>
            toggleMode("sky")
          }
        />
      </section>

      {/* =====================================================
          SWIPEABLE SITE STRIP (visible when SELECT SITE is active)
          ===================================================== */}

      {mode === "select" &&
        !selectedSite && (
          <section
            aria-label="
              Choose a mission site
            "
            className="
              relative
              z-20
              mx-auto
              -mt-24
              max-w-[1100px]
              px-4
              pb-8
              sm:-mt-20
              lg:-mt-16
            "
          >
            <p
              className="
                mb-3
                text-center
                text-[8px]
                uppercase
                tracking-[2px]
                text-white/40
              "
            >
              Tap a Moon marker or swipe to choose a site
            </p>

            <div
              className="
                -mx-4
                flex
                snap-x
                snap-mandatory
                gap-2.5
                overflow-x-auto
                scroll-smooth
                px-4
                pb-3
                scrollbar-none

                [&::-webkit-scrollbar]:hidden
                [-ms-overflow-style:none]
                [scrollbar-width:none]
              "
            >
              {[...lunarSites]
                .sort((a, b) => a.year - b.year || String(a.id).localeCompare(String(b.id)))
                .map(
                (site) => {
                  const isActive =
                    selectedSite?.id === site.id;

                  return (
                    <button
                      key={String(
                        site.id
                      )}
                      type="button"
                      onClick={() =>
                        selectSite(
                          site
                        )
                      }
                      className={`
                        snap-start
                        shrink-0
                        border
                        rounded
                        bg-black/70
                        backdrop-blur-sm
                        px-4
                        py-2.5
                        text-left
                        transition-all
                        duration-200
                        min-w-[130px]

                        ${
                          isActive
                            ? "border-[#ff3b12] bg-[#ff3b12]/10 shadow-[0_0_20px_rgba(255,59,18,0.12)]"
                            : "border-white/15 hover:border-[#ff3b12]/60 hover:bg-white/[0.03]"
                        }
                      `}
                    >
                      <span
                        className={`
                          block
                          text-[9px]
                          font-medium
                          uppercase
                          tracking-[0.5px]
                          ${isActive ? "text-[#ff3b12]" : "text-white/80"}
                        `}
                      >
                        {site.name}
                      </span>

                      <span
                        className="
                          mt-1.5
                          flex
                          items-center
                          gap-1.5
                          text-[7px]
                          text-white/35
                        "
                      >
                        <span
                          className={`
                            inline-block
                            h-1
                            w-1
                            rounded-full
                            ${isActive ? "bg-[#ff3b12]" : "bg-white/25"}
                          `}
                        />
                        {site.country} · {site.year}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Scroll hint arrows */}
            <div
              className="
                mt-1
                flex
                items-center
                justify-center
                gap-2
                text-[7px]
                text-white/20
              "
            >
              <span>←</span>
              <span className="uppercase tracking-[2px]">
                swipe
              </span>
              <span>→</span>
            </div>
          </section>
        )}

      {/* =====================================================
          HISTORY TIMELINE
          ===================================================== */}

      {mode === "history" && (
        <HistoryTimeline
          year={
            historyYear
          }
          sites={
            lunarSites
          }
          onYearChange={
            handleHistoryYearChange
          }
          onSelectSite={
            selectSite
          }
          onClose={() => {
            setMode(
              "default"
            );

            setFocusedSite(
              null
            );
          }}
        />
      )}

      {/* =====================================================
          SKY
          ===================================================== */}

      {mode === "sky" && (
        <SkyPanel
          onClose={() =>
            setMode("default")
          }
        />
      )}

      {/* =====================================================
          SITE DRAWER
          ===================================================== */}

      {selectedSite &&
        mode === "select" && (
          <SiteDrawer
            site={
              selectedSite
            }
            onClose={
              closeSelection
            }
          />
        )}

      {/* =====================================================
          FOOTER LABEL
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
        Lunar surface explorer ·
        mission sites from the
        project dataset
      </footer>

    </main>
  );
}