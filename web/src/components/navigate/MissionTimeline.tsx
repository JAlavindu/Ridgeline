import type { LunarSite } from "../../data/lunarSites";

interface MissionTimelineProps {
  sites: LunarSite[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function MissionTimeline({ sites, selectedId, onSelect }: MissionTimelineProps) {
  return (
    <section id="timeline" aria-labelledby="timeline-title" className="overflow-hidden border-b border-white/10 bg-[#050505] px-6 py-20 text-white sm:px-10 sm:py-24 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1600px]">
        <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Recorded lunar landings / 1969—2025</p>
        <h2 id="timeline-title" className="mt-5 font-['Michroma'] text-[clamp(34px,5.5vw,76px)] font-light uppercase leading-none tracking-[-0.05em]">From Apollo to today</h2>
        <div className="relative mt-12 ml-2 border-l border-white/20 md:ml-0 md:border-l-0 md:border-t">
          <div className="grid grid-cols-1 gap-y-1 md:grid-cols-4 md:gap-x-5 md:gap-y-10 xl:grid-cols-6">
            {sites.map((site) => (
              <button
                key={site.id}
                type="button"
                aria-pressed={selectedId === site.id}
                onClick={() => onSelect(site.id)}
                className={`relative flex min-h-16 items-center gap-4 pl-6 text-left transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff3b12] md:min-h-28 md:flex-col md:items-start md:gap-4 md:pl-0 md:pt-6 ${selectedId === site.id ? "text-[#ff3b12]" : "text-white/60"}`}
              >
                <span className={`absolute -left-[5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border md:left-0 md:top-0 md:translate-y-[-50%] ${selectedId === site.id ? "border-[#ff3b12] bg-[#ff3b12] shadow-[0_0_12px_#ff3b12]" : "border-white/50 bg-[#050505]"}`} />
                <span className="font-['Michroma'] text-[10px]">{site.year}</span>
                <span className="text-[8px] uppercase tracking-[1px]">{site.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
