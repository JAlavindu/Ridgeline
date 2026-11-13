import { useState } from "react";
import Footer from "../../components/Footer";
import { lunarSites } from "../../data/lunarSites";
import LandingSitePanel from "./LandingSitePanel";
import type { LandingSiteTab } from "./LandingSitePanel";
import LandingSites from "./LandingSites";
import MissionTimeline from "./MissionTimeline";
import MoonExplorer from "./MoonExplorer";
import NavigateCTA from "./NavigateCTA";
import NavigateHero from "./NavigateHero";
import NavigationModes from "./NavigationModes";
import TerrainScience from "./TerrainScience";

export default function NavigatePage() {
  const [selectedId, setSelectedId] = useState(lunarSites[0].id);
  const [activeMode, setActiveMode] = useState("OVERVIEW");
  const [activeTab, setActiveTab] = useState<LandingSiteTab>("ground");
  const [lunarDay, setLunarDay] = useState(0);
  const selectedSite = lunarSites.find((site) => site.id === selectedId) ?? lunarSites[0];

  const selectSite = (id: string) => {
    setSelectedId(id);
    setActiveMode("LANDING SITES");
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
      <MoonExplorer selectedSite={selectedSite} sites={lunarSites} onSelectSite={selectSite} />
      <LandingSites sites={lunarSites} selectedId={selectedId} onSelect={selectSite} />
      <LandingSitePanel site={selectedSite} activeTab={activeTab} onTabChange={setActiveTab} lunarDay={lunarDay} onLunarDayChange={setLunarDay} />
      <MissionTimeline sites={lunarSites} selectedId={selectedId} onSelect={selectSite} />
      <TerrainScience />
      <NavigateCTA />
      <Footer />
    </main>
  );
}
