interface SunEarthTabProps {
  lunarDay: number;
  onLunarDayChange: (value: number) => void;
}

export default function SunEarthTab({ lunarDay, onLunarDayChange }: SunEarthTabProps) {
  return (
    <div role="tabpanel" id="panel-sun-earth" aria-labelledby="tab-sun-earth">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <h3 className="font-['Michroma'] text-2xl font-light uppercase tracking-[-1px] sm:text-3xl">Sun &amp; Earth</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
            Explore the changing lunar day. Local illumination and Earth visibility depend on the selected site and ephemeris data.
          </p>
          <div className="mt-7 grid grid-cols-1 border-l border-t border-white/15 sm:grid-cols-3">
            {["SUN ELEVATION", "EARTH VISIBILITY", "LOCAL TIME"].map((label) => (
              <div key={label} className="border-b border-r border-white/15 px-3 py-4">
                <p className="text-[7px] tracking-[1.5px] text-white/35">{label}</p>
                <p className="mt-3 text-[9px] tracking-[1px] text-white/65">EPHEMERIS PENDING</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-white/15 bg-black/60 p-5 sm:p-8">
          <div className="relative flex h-36 items-center justify-center">
            <div className="absolute left-[12%] top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#E2791D]/10 ring-1 ring-[#E2791D]/70">
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] tracking-[2px] text-white/50">SUN</span>
            </div>
            <div className="absolute left-[35%] right-[22%] top-1/2 h-px -translate-y-1/2 bg-white/25" />
            <div className="absolute left-[53%] top-1/2 h-14 w-14 -translate-y-1/2 rounded-full border border-white/40 bg-[radial-gradient(circle_at_35%_35%,#9a9a9a,#222_65%)] shadow-[0_0_35px_rgba(255,255,255,0.12)]" />
            <div className="absolute right-[8%] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border border-white/40 bg-white/5">
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[7px] tracking-[2px] text-white/50">EARTH</span>
            </div>
            <span className="absolute left-1/2 top-[18%] text-[7px] tracking-[2px] text-white/30">MOON</span>
          </div>
          <label htmlFor="lunar-day" className="mt-8 flex justify-between text-[8px] uppercase tracking-[2px] text-white/45">
            <span>Lunar day phase</span><span>{lunarDay}%</span>
          </label>
          <input
            id="lunar-day"
            type="range"
            min="0"
            max="100"
            value={lunarDay}
            onChange={(event) => onLunarDayChange(Number(event.target.value))}
            className="mt-4 h-1 w-full cursor-pointer accent-[#E2791D]"
          />
          <div className="mt-2 flex justify-between text-[7px] tracking-[1px] text-white/30"><span>DAWN</span><span>NOON</span><span>DUSK</span><span>NIGHT</span></div>
        </div>
      </div>
    </div>
  );
}
