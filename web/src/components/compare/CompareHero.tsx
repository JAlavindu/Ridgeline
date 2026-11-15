interface Props {
  siteCount: number;
  onSettings: () => void;
}

export default function CompareHero({ siteCount, onSettings }: Props) {
  return (
    <section className="border-b border-white/[0.08] px-6 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-36 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[760px]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">
            Ridgeline · Site comparison
          </p>

          <h1 className="mt-5 text-[42px] font-medium leading-[1.05] tracking-[-0.045em] sm:text-[58px] lg:text-[68px]">
            Find the right
            <br />
            place to land.
          </h1>

          <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-white/50 sm:text-[17px]">
            Compare lunar landing sites side by side and quickly see which
            location best fits your mission.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="flex h-10 items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-4 text-[12px] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e2791d]" />
            {siteCount} of 4 sites selected
          </div>

          <button
            type="button"
            onClick={onSettings}
            className="flex h-10 items-center gap-2 rounded-full border border-white/[0.09] px-4 text-[12px] text-white/55 transition hover:border-white/20 hover:text-white"
          >
            <span>⚙</span>
            Mission settings
          </button>
        </div>
      </div>
    </section>
  );
}