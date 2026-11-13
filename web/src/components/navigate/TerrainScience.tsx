const features = [
  { number: "01", title: "ELEVATION", text: "Understand lunar relief through elevation data and surface profiles." },
  { number: "02", title: "HORIZON", text: "Explore how nearby terrain shapes visibility and local horizons." },
  { number: "03", title: "ILLUMINATION", text: "Study changing light conditions across the lunar surface." },
];

export default function TerrainScience() {
  return (
    <section id="terrain" aria-labelledby="terrain-title" className="relative overflow-hidden border-b border-white/10 bg-[#020202] px-6 py-20 text-white sm:px-10 sm:py-28 lg:px-[7.5vw]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_35%,rgba(226,121,29,0.06),transparent_35%)]" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Surface science / lunar environment</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <h2 id="terrain-title" className="font-['Michroma'] text-[clamp(38px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.06em]">Terrain changes<br className="hidden sm:block" /> everything.</h2>
          <p className="max-w-lg pb-2 text-sm leading-7 text-white/50">
            Elevation, slope, horizon obstruction and illumination can influence how lunar environments are understood and explored.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 border-l border-t border-white/15 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="min-h-44 border-b border-r border-white/15 p-5 sm:p-7">
              <p className="flex items-center gap-3 text-[8px] tracking-[2px] text-[#ff3b12]"><span>{feature.number}</span><span className="h-px w-8 bg-[#ff3b12]/60" /></p>
              <h3 className="mt-7 font-['Michroma'] text-lg font-light tracking-[1px]">{feature.title}</h3>
              <p className="mt-3 max-w-xs text-xs leading-6 text-white/45">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
