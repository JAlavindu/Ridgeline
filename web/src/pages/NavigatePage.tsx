import { useState } from "react";
import Footer from "../components/Footer";
import { lunarSites } from "../data/lunarSites";
import LandingSitePanel from "../components/navigate/LandingSitePanel";
import type { LandingSiteTab } from "../components/navigate/LandingSitePanel";
import LandingSites from "../components/navigate/LandingSites";
import MissionTimeline from "../components/navigate/MissionTimeline";
import MoonExplorer from "../components/navigate/MoonExplorer";
import NavigateCTA from "../components/navigate/NavigateCTA";
import NavigateHero from "../components/navigate/NavigateHero";
import NavigationModes from "../components/navigate/NavigationModes";
import TerrainScience from "../components/navigate/TerrainScience";

export default function NavigatePage() {
  const [selectedId, setSelectedId] = useState(lunarSites[0].id);
  const [activeMode, setActiveMode] = useState("OVERVIEW");
  const [activeTab, setActiveTab] = useState<LandingSiteTab>("ground");
  const [lunarDay, setLunarDay] = useState(0);
  const selectedSite = lunarSites.find((site) => site.id === selectedId) ?? lunarSites[0];

  const selectSite = (id: string, mode = "LANDING SITES") => {
    setSelectedId(id);
    setActiveMode(mode);
  };

  const selectMode = (mode: string, target: string) => {
    setActiveMode(mode);
    if (mode === "SUN & EARTH") setActiveTab("sun-earth");
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="overflow-hidden bg-[#020202] text-white">
      <NavigateHero />
      <NavigationModes activeMode={activeMode} onSelect={selectMode} />
      <MoonExplorer selectedSite={selectedSite} sites={lunarSites} onSelectSite={(id) => selectSite(id, "OVERVIEW")} />
      <LandingSites sites={lunarSites} selectedId={selectedId} onSelect={selectSite} />
      <LandingSitePanel site={selectedSite} activeTab={activeTab} onTabChange={setActiveTab} lunarDay={lunarDay} onLunarDayChange={setLunarDay} />
      <MissionTimeline sites={lunarSites} selectedId={selectedId} onSelect={(id) => selectSite(id, "MISSION TIMELINE")} />
      <TerrainScience />
      <NavigateCTA />
      <Footer />
    </main>
  );
}
