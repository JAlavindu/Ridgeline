import type { LunarSite } from "../../data/lunarSites";

interface LandingSitesProps {
  sites: LunarSite[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function LandingSites({ sites, selectedId, onSelect }: LandingSitesProps) {
  return (
    <section id="missions" aria-labelledby="missions-title" className="border-b border-white/10 bg-[#050505] px-6 py-20 text-white sm:px-10 sm:py-24 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Mission locations / surface record</p>
            <h2 id="missions-title" className="mt-5 max-w-2xl font-['Michroma'] text-[clamp(36px,5.5vw,76px)] font-light uppercase leading-[0.96] tracking-[-0.05em]">
              Where humans<br className="hidden sm:block" /> have reached
            </h2>
          </div>
          <p className="max-w-xl pb-1 text-sm leading-7 text-white/50">
            Explore historic and recent lunar landing locations and compare their terrain and mission context.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 border-l border-t border-white/15 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site, index) => {
            const active = site.id === selectedId;
            return (
              <button
                key={site.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(site.id)}
                className={`group flex min-h-24 items-center justify-between gap-4 border-b border-r border-white/15 px-4 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#ff3b12] sm:px-5 ${active ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
              >
                <span className="flex items-center gap-4">
                  <span className={`font-['Michroma'] text-[10px] ${active ? "text-[#ff3b12]" : "text-white/30"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className={`block text-[11px] uppercase tracking-[1px] ${active ? "text-white" : "text-white/75 group-hover:text-white"}`}>{site.name}</span>
                    <span className="mt-2 block text-[8px] uppercase tracking-[1.5px] text-white/35">{site.country} / {site.year}</span>
                  </span>
                </span>
                <span aria-hidden="true" className={`text-sm transition-transform group-hover:translate-x-1 ${active ? "text-[#ff3b12]" : "text-white/30"}`}>↗</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[8px] leading-5 text-white/30">Coordinates are approximate published landing-site locations; mission markers in the model are illustrative, not geographic positions.</p>
      </div>
    </section>
  );
}
