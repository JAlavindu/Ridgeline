export default function HorizonTab() {
  return (
    <div role="tabpanel" id="panel-horizon" aria-labelledby="tab-horizon">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[8px] uppercase tracking-[3px] text-[#ff3b12]">Horizon profile / illustrative placeholder</p>
          <div className="mt-5 border border-white/15 bg-black p-3 sm:p-5">
            <div className="relative h-52 overflow-hidden border-b border-l border-white/25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]">
              <svg role="img" aria-label="Illustrative horizon profile placeholder; no horizon data is connected" viewBox="0 0 700 180" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path d="M0 127 Q80 123 135 118 T250 112 Q310 110 348 86 T430 61 Q492 61 530 89 T620 107 Q660 110 700 105" fill="none" stroke="#E2791D" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0 145 H700" fill="none" stroke="rgba(255,255,255,0.5)" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="absolute left-2 top-2 text-[7px] tracking-[1px] text-white/40">ANGULAR ELEVATION / NOT TO SCALE</span>
              <span className="absolute bottom-2 right-2 text-[7px] tracking-[1px] text-white/40">AZIMUTH →</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-['Michroma'] text-2xl font-light uppercase tracking-[-1px] sm:text-3xl">The sky</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
            Local terrain can obstruct the horizon and change what is visible from the lunar surface.
          </p>
          <div className="mt-7 grid grid-cols-1 border-l border-t border-white/15 sm:grid-cols-3">
            {["HORIZON ELEVATION", "MAX OBSTRUCTION", "VISIBILITY"].map((label) => (
              <div key={label} className="border-b border-r border-white/15 px-3 py-4">
                <p className="text-[7px] tracking-[1.5px] text-white/35">{label}</p>
                <p className="mt-3 font-['Michroma'] text-sm text-white/60">—</p>
                <p className="mt-1 text-[7px] text-white/30">Model pending</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
