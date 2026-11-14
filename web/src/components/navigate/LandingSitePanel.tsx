import type { LunarSite } from "../../data/lunarSites";
import GroundTab from "./GroundTab";
import HorizonTab from "./HorizonTab";
import SunEarthTab from "./SunEarthTab";

const tabs = [
  { id: "ground", label: "GROUND" },
  { id: "horizon", label: "SKY" },
  { id: "sun-earth", label: "SUN & EARTH" },
  { id: "facts", label: "FUN FACTS" },
] as const;

export type LandingSiteTab = (typeof tabs)[number]["id"];

interface LandingSitePanelProps {
  site: LunarSite;
  activeTab: LandingSiteTab;
  onTabChange: (tab: LandingSiteTab) => void;
  lunarDay: number;
  onLunarDayChange: (value: number) => void;
}

function formatCoordinate(value: number | null, positive: string, negative: string) {
  if (value === null) return "NOT AVAILABLE";
  return `${Math.abs(value).toFixed(3)}° ${value < 0 ? negative : positive}`;
}

export default function LandingSitePanel({ site, activeTab, onTabChange, lunarDay, onLunarDayChange }: LandingSitePanelProps) {
  return (
    <section id="selected-site" aria-labelledby="selected-site-title" className="border-b border-white/10 bg-[#020202] px-6 py-20 text-white sm:px-10 sm:py-24 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Selected landing site / {site.country} · {site.year}</p>
            <h2 id="selected-site-title" className="mt-4 font-['Michroma'] text-[clamp(34px,6vw,74px)] font-light uppercase leading-none tracking-[-0.05em]">{site.name}</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 text-[8px] tracking-[1.5px] text-white/45 sm:min-w-[300px]">
            <div><p className="text-white/30">LATITUDE</p><p className="mt-2 text-white/80">{formatCoordinate(site.latitude, "N", "S")}</p></div>
            <div><p className="text-white/30">LONGITUDE</p><p className="mt-2 text-white/80">{formatCoordinate(site.longitude, "E", "W")}</p></div>
          </div>
        </div>

        <div role="tablist" aria-label="Landing site information" className="mt-8 flex overflow-x-auto border-b border-white/15">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-12 shrink-0 border-b px-4 text-[8px] tracking-[1.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff3b12] sm:px-7 ${activeTab === tab.id ? "border-[#ff3b12] text-[#ff3b12]" : "border-transparent text-white/45 hover:text-white"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-8">
          {activeTab === "ground" && <GroundTab />}
          {activeTab === "horizon" && <HorizonTab />}
          {activeTab === "sun-earth" && <SunEarthTab lunarDay={lunarDay} onLunarDayChange={onLunarDayChange} />}
          {activeTab === "facts" && (
            <div role="tabpanel" id="panel-facts" aria-labelledby="tab-facts" className="min-h-60 max-w-3xl py-5">
              <p className="text-[8px] uppercase tracking-[3px] text-[#ff3b12]">Mission context / verified data only</p>
              <h3 className="mt-5 font-['Michroma'] text-2xl font-light uppercase">A place in lunar history</h3>
              <p className="mt-4 text-sm leading-7 text-white/50">
                {site.name} is a documented lunar landing mission. Mission-specific surface observations and verified site facts can be connected here as source data becomes available.
              </p>
              <p className="mt-5 text-[8px] uppercase tracking-[1.5px] text-white/30">{site.country} / {site.year} · No unsourced mission details shown</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
