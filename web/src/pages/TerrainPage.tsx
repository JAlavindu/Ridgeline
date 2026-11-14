import { useMemo, useState } from "react";
import { lunarSites } from "../data/lunarSites";
import type { LunarSite } from "../data/lunarSites";

import HistoryTimeline from "../components/terrain/HistoryTimeline";
import NavigateMoon from "../components/terrain/NavigateMoon";
import OrbitalAction from "../components/terrain/OrbitalAction";
import SiteDrawer from "../components/terrain/SiteDrawer";
import SkyPanel from "../components/terrain/SkyPanel";

type TerrainMode = "default" | "select" | "history" | "sky";

const latestMissionYear = Math.max(...lunarSites.map((site) => site.year));

export default function TerrainPage() {
  const [mode, setMode] = useState<TerrainMode>("default");
  const [selectedSite, setSelectedSite] = useState<LunarSite | null>(null);
  const [historyYear, setHistoryYear] = useState(latestMissionYear);

  const visibleSites = useMemo(
    () =>
      mode === "history"
        ? lunarSites.filter((site) => site.year <= historyYear)
        : lunarSites,
    [historyYear, mode],
  );

  const selectSite = (site: LunarSite) => {
    setSelectedSite(site);
    setMode("select");
  };

  const closeSelection = () => {
    setSelectedSite(null);
    setMode("default");
  };

  const toggleMode = (nextMode: "select" | "history" | "sky") => {
    if (mode === nextMode) {
      setMode("default");
      if (nextMode === "select") setSelectedSite(null);
      return;
    }

    setSelectedSite(null);
    setMode(nextMode);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,255,255,0.07),transparent_44%),radial-gradient(ellipse_at_50%_100%,rgba(255,59,18,0.05),transparent_55%)]"
      />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-[7.5vw]">
        <a
          href="/"
          className="font-['Michroma'] text-[11px] tracking-[2px] text-white/85"
        >
          LUNA <span className="text-white/35">SPACE</span>
        </a>
        <div className="hidden items-center gap-3 text-[8px] uppercase tracking-[3px] text-white/40 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b12] shadow-[0_0_10px_rgba(255,59,18,0.7)]" />
          LUNAR TERRAIN EXPLORER
        </div>
        <a
          href="/"
          className="border border-white/20 px-3 py-2 text-[8px] uppercase tracking-[2px] text-white/60 transition hover:border-[#ff3b12] hover:text-white sm:px-4"
        >
          Exit
        </a>
      </header>

      <section className="relative z-20 px-5 pt-5 text-center sm:pt-8">
        <p className="mb-3 text-[8px] uppercase tracking-[4px] text-white/35">
          LUNAR SURFACE · INTERACTIVE GLOBE
        </p>
        <h1 className="font-['Michroma'] text-[clamp(28px,5vw,58px)] font-light uppercase leading-tight tracking-[-1.5px]">
          Explore the <span className="text-[#ff3b12]">Moon</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[500px] text-[10px] leading-[1.7] text-white/45 sm:text-[11px]">
          Drag to turn the Moon. Choose a marked mission site to learn more.
        </p>
      </section>

      {mode === "select" && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-10 bg-black/20 backdrop-blur-[1px]"
        />
      )}

      <section
        aria-label="Interactive Moon and explorer controls"
        className="relative z-20 mx-auto mt-6 h-[760px] w-full max-w-[1280px] px-4 sm:h-[820px] lg:mt-2 lg:h-[670px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[25%] h-[min(82vw,380px)] w-[min(82vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] sm:h-[min(65vw,460px)] sm:w-[min(65vw,460px)] lg:top-1/2 lg:h-[590px] lg:w-[590px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[25%] h-[min(64vw,300px)] w-[min(64vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.08] lg:top-1/2 lg:h-[400px] lg:w-[400px]"
        />

        <NavigateMoon
          sites={visibleSites}
          selectionMode={mode === "select"}
          selectedSite={selectedSite}
          onSelectSite={selectSite}
        />

        <OrbitalAction
          position="top"
          number="01"
          label={mode === "select" ? "EXIT SELECTION" : "SELECT SITE"}
          detail={mode === "select" ? "Return to the Moon" : "Choose a mission site"}
          active={mode === "select"}
          onClick={() =>
            mode === "select"
              ? closeSelection()
              : toggleMode("select")
          }
        />
        <OrbitalAction
          position="left"
          number="02"
          label="HISTORY"
          detail="Explore missions by year"
          active={mode === "history"}
          onClick={() => toggleMode("history")}
        />
        <OrbitalAction
          position="right"
          number="03"
          label="SUN & EARTH"
          detail="Learn about the lunar sky"
          active={mode === "sky"}
          onClick={() => toggleMode("sky")}
        />
      </section>

      {mode === "select" && !selectedSite && (
        <section
          aria-label="Choose a mission site"
          className="relative z-20 mx-auto -mt-24 max-w-[1000px] px-4 pb-8 sm:-mt-20 lg:-mt-16"
        >
          <p className="mb-2 text-center text-[8px] uppercase tracking-[2px] text-white/40">
            Tap a Moon marker or choose a site
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lunarSites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => selectSite(site)}
                className="shrink-0 border border-white/15 bg-black/70 px-3 py-2 text-left transition hover:border-[#ff3b12]"
              >
                <span className="block text-[9px] text-white/80">
                  {site.name}
                </span>
                <span className="mt-1 block text-[7px] text-white/35">
                  {site.year} · {site.latitude === null ? "NO COORDINATES" : site.country}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {mode === "history" && (
        <HistoryTimeline
          year={historyYear}
          sites={lunarSites}
          onYearChange={setHistoryYear}
          onSelectSite={selectSite}
          onClose={() => setMode("default")}
        />
      )}

      {mode === "sky" && (
        <SkyPanel onClose={() => setMode("default")} />
      )}

      {selectedSite && mode === "select" && (
        <SiteDrawer site={selectedSite} onClose={closeSelection} />
      )}

      <footer className="relative z-20 px-6 pb-8 text-center text-[7px] uppercase tracking-[3px] text-white/20">
        Lunar surface explorer · mission sites from the project dataset
      </footer>
    </main>
  );
}
