export default function NavigateCTA() {
  return (
    <section className="relative overflow-hidden bg-[#050505] px-6 py-24 text-white sm:px-10 sm:py-32 lg:px-[7.5vw]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(226,121,29,0.07),transparent_45%)]" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="text-[8px] uppercase tracking-[4px] text-[#ff3b12]">Next / terrain exploration</p>
        <h2 className="mt-6 max-w-5xl font-['Michroma'] text-[clamp(36px,7vw,100px)] font-light uppercase leading-[0.96] tracking-[-0.06em]">
          The Moon is not flat.<br /><span className="text-white/55">Terrain changes everything.</span>
        </h2>
        <p className="mt-7 max-w-xl text-sm leading-7 text-white/50">
          Go deeper into the lunar surface through high-resolution terrain data.
        </p>
        <a href="#surface" className="mt-9 inline-flex min-h-12 items-center bg-[#ff3b12] px-6 text-[9px] tracking-[1.5px] text-white transition-colors hover:bg-[#e2791d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          EXPLORE TERRAIN <span aria-hidden="true" className="ml-5">→</span>
        </a>
      </div>
    </section>
  );
}
