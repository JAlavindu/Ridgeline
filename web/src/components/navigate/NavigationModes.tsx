const modes = [
  { number: "01", label: "OVERVIEW", target: "surface" },
  { number: "02", label: "LANDING SITES", target: "missions" },
  { number: "03", label: "MISSION TIMELINE", target: "timeline" },
  { number: "04", label: "SUN & EARTH", target: "selected-site" },
];

interface NavigationModesProps {
  activeMode: string;
  onSelect: (mode: string, target: string) => void;
}

export default function NavigationModes({ activeMode, onSelect }: NavigationModesProps) {
  return (
    <section aria-labelledby="mode-title" className="border-b border-white/10 bg-[#050505] px-6 py-9 sm:px-10 lg:px-[7.5vw]">
      <div className="mx-auto max-w-[1600px]">
        <h2 id="mode-title" className="mb-5 text-[8px] uppercase tracking-[4px] text-white/40">Choose your view</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode) => {
            const active = activeMode === mode.label;
            return (
              <button
                type="button"
                key={mode.label}
                aria-pressed={active}
                onClick={() => onSelect(mode.label, mode.target)}
                className={`group flex min-h-16 items-center gap-4 border-t px-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff3b12] sm:px-4 lg:border-l lg:first:border-l-0 ${active ? "border-[#ff3b12] text-[#ff3b12]" : "border-white/20 text-white/55 hover:border-white/50 hover:text-white"}`}
              >
                <span className="font-['Michroma'] text-xs">{mode.number}</span>
                <span className="text-[9px] tracking-[1.5px]">{mode.label}</span>
                {active && <span className="ml-auto h-1 w-1 bg-[#ff3b12] shadow-[0_0_10px_#ff3b12]" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
