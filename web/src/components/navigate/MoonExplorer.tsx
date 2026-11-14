import type { LunarSite } from "../../data/lunarSites";
import MoonCanvas from "./MoonCanvas";

interface MoonExplorerProps {
  selectedSite: LunarSite;
  sites: LunarSite[];
  onSelectSite: (id: string) => void;
}

export default function MoonExplorer({ selectedSite, sites, onSelectSite }: MoonExplorerProps) {
  return (
    <section id="surface" aria-labelledby="surface-title" className="relative overflow-hidden border-b border-white/10 bg-[#020202] px-6 py-20 text-white sm:px-10 sm:py-28 lg:px-[7.5vw]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:100px_100px]" />
      <div className="relative mx-auto grid max-w-[1600px] items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative z-10">
          <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Lunar surface / interactive model</p>
          <h2 id="surface-title" className="mt-5 max-w-lg font-['Michroma'] text-[clamp(38px,6vw,82px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            Read the<br />terrain.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">
            Explore the Moon through elevation, surface structure and mission location data.
          </p>
          <p className="mt-8 text-[8px] uppercase tracking-[2px] text-white/30">Drag to rotate · Touch enabled</p>
          <div className="mt-9 grid max-w-lg grid-cols-2 border-l border-t border-white/15">
            {[
              ["LATITUDE", selectedSite.latitude === null ? "—" : `${Math.abs(selectedSite.latitude).toFixed(3)}° ${selectedSite.latitude < 0 ? "S" : "N"}`],
              ["LONGITUDE", selectedSite.longitude === null ? "—" : `${Math.abs(selectedSite.longitude).toFixed(3)}° ${selectedSite.longitude < 0 ? "W" : "E"}`],
              ["ELEVATION", "LOLA DATA PENDING"],
              ["MISSION", selectedSite.name.toUpperCase()],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-r border-white/15 px-3 py-3 sm:px-4">
                <p className="text-[7px] tracking-[2px] text-white/35">{label}</p>
                <p className="mt-2 break-words text-[9px] tracking-[1px] text-white/80">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[340px] sm:min-h-[480px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.11),transparent_55%)]" />
          <div className="absolute inset-0">
            <MoonCanvas
              className="!h-full !w-full"
              selectedSite={selectedSite}
              sites={sites}
              onSelectSite={onSelectSite}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-px bg-white/10" />
          <div className="pointer-events-none absolute inset-y-[8%] left-1/2 w-px bg-white/10" />
          <div className="absolute bottom-3 right-2 text-right text-[7px] uppercase tracking-[2px] text-white/35">Mission markers · selectable</div>
        </div>
      </div>
    </section>
  );
}
