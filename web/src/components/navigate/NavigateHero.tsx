import MoonCanvas from "./MoonCanvas";

export default function NavigateHero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative isolate min-h-[720px] overflow-hidden border-b border-white/10 bg-[#020202] text-white sm:min-h-[780px]">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:120px_120px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_48%,rgba(255,255,255,0.12),transparent_35%)]" />

      <header className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-[7.5vw]">
        <a href="/" className="font-['Michroma'] text-sm tracking-[2px] focus-visible:outline focus-visible:outline-[#ff3b12]">
          LUNA <span className="text-white/45">SPACE</span>
        </a>
        <nav aria-label="Navigate page" className="flex items-center gap-6 text-[9px] uppercase tracking-[2px] text-white/55 sm:gap-9">
          <a className="transition-colors hover:text-white focus-visible:text-white" href="#surface">Surface</a>
          <a className="transition-colors hover:text-white focus-visible:text-white" href="#missions">Missions</a>
          <a className="transition-colors hover:text-white focus-visible:text-white" href="#terrain">Terrain</a>
        </nav>
      </header>

      <div className="relative mx-auto flex min-h-[570px] max-w-[1600px] items-center px-6 pb-24 pt-12 sm:px-10 lg:min-h-[620px] lg:px-[7.5vw]">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-6 text-[9px] uppercase tracking-[5px] text-[#ff3b12]">01 / NAVIGATE</p>
          <h1 className="font-['Michroma'] text-[clamp(42px,8vw,112px)] font-light uppercase leading-[0.92] tracking-[-0.06em]">
            Explore<br />the Moon
          </h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-white/55 sm:text-base">
            Explore lunar terrain, historical landing sites and changing surface conditions through an interactive Moon.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollTo("surface")}
              className="min-h-12 bg-[#ff3b12] px-6 text-[9px] font-medium tracking-[1.5px] text-white transition-colors hover:bg-[#e2791d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              EXPLORE THE SURFACE <span aria-hidden="true" className="ml-5">↗</span>
            </button>
            <button
              type="button"
              onClick={() => scrollTo("missions")}
              className="min-h-12 border border-white/25 px-6 text-[9px] tracking-[1.5px] text-white/80 transition-colors hover:border-[#ff3b12] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3b12]"
            >
              VIEW MISSIONS <span aria-hidden="true" className="ml-5">↓</span>
            </button>
          </div>
        </div>

        <div aria-label="Interactive 3D Moon" className="pointer-events-none absolute inset-x-[8%] bottom-20 top-24 opacity-75 sm:left-[38%] sm:right-[-2%] sm:opacity-90">
          <MoonCanvas className="!h-full !w-full" interactive={false} />
        </div>

        <div className="absolute inset-x-6 bottom-0 z-10 grid grid-cols-1 border-t border-white/20 sm:inset-x-10 sm:grid-cols-3 lg:inset-x-[7.5vw]">
          {["LOLA TERRAIN DATA", "MISSION LOCATIONS", "SOLAR CONDITIONS"].map((item, index) => (
            <div key={item} className={`flex items-center gap-3 py-4 text-[8px] tracking-[2px] text-white/55 sm:py-5 ${index > 0 ? "sm:border-l sm:border-white/15 sm:pl-6" : ""}`}>
              <span className="h-1 w-1 bg-[#ff3b12]" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
