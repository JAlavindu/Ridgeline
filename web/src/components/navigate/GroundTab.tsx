export default function GroundTab() {
  return (
    <div role="tabpanel" id="panel-ground" aria-labelledby="tab-ground">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[8px] uppercase tracking-[3px] text-[#ff3b12]">Terrain profile / illustrative placeholder</p>
          <div className="mt-5 border border-white/15 bg-black p-3 sm:p-5">
            <div className="relative h-52 overflow-hidden border-b border-l border-white/25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]">
              <svg role="img" aria-label="Illustrative terrain profile placeholder; no LOLA data is connected" viewBox="0 0 700 180" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path d="M0 145 L55 132 L100 139 L148 98 L191 116 L240 88 L288 105 L330 61 L368 99 L414 75 L458 112 L505 60 L548 89 L598 54 L642 82 L700 47" fill="none" stroke="#E2791D" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M0 145 L55 132 L100 139 L148 98 L191 116 L240 88 L288 105 L330 61 L368 99 L414 75 L458 112 L505 60 L548 89 L598 54 L642 82 L700 47 L700 180 L0 180 Z" fill="rgba(226,121,29,0.08)" />
              </svg>
              <span className="absolute left-2 top-2 text-[7px] tracking-[1px] text-white/40">ELEVATION / DATA NOT CONNECTED</span>
              <span className="absolute bottom-2 right-2 text-[7px] tracking-[1px] text-white/40">DISTANCE →</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-['Michroma'] text-2xl font-light uppercase tracking-[-1px] sm:text-3xl">The ground</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
            Terrain determines how a landing site is approached, accessed and understood.
          </p>
          <div className="mt-7 grid grid-cols-1 border-l border-t border-white/15 sm:grid-cols-3">
            {["MIN ELEVATION", "MAX ELEVATION", "ELEVATION RANGE"].map((label) => (
              <div key={label} className="border-b border-r border-white/15 px-3 py-4">
                <p className="text-[7px] tracking-[1.5px] text-white/35">{label}</p>
                <p className="mt-3 font-['Michroma'] text-sm text-white/60">—</p>
                <p className="mt-1 text-[7px] text-white/30">Awaiting LOLA data</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
