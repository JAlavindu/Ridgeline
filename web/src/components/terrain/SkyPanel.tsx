import type { ReactNode } from "react";

interface SkyPanelProps {
  onClose: () => void;
  /** Switch the page to site selection, where the real sky is computed */
  onChooseSite: () => void;
}

/*
 * A plain-language guide to the lunar sky. It shows no live numbers:
 * the real Sun and Earth values appear once a site is chosen.
 */
export default function SkyPanel({ onClose, onChooseSite }: SkyPanelProps) {
  return (
    <aside
      aria-label="The lunar sky"
      className="
        site-panel
        fixed
        inset-x-0
        bottom-0
        z-[100]
        flex
        h-[56dvh]
        flex-col
        overflow-hidden
        rounded-t-[20px]
        border-t
        border-white/[0.08]
        bg-[#0a0a0a]

        lg:inset-x-auto
        lg:bottom-3
        lg:right-3
        lg:top-[72px]
        lg:h-auto
        lg:w-[min(44vw,600px)]
        lg:rounded-[20px]
        lg:border
      "
    >
      {/* ================= HEADER ================= */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5 sm:px-8 sm:py-6">
        <div className="min-w-0">
          <p className="text-[12px] text-white/45">Guide</p>
          <h2 className="mt-1.5 font-['Michroma'] text-[20px] uppercase leading-tight text-white sm:text-[22px]">
            The lunar sky
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the lunar sky guide"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[20px] leading-none text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          ×
        </button>
      </header>

      {/* ================= BODY ================= */}
      <div className="flex-1 space-y-10 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7">
        <p className="max-w-[62ch] text-[14px] leading-[1.75] text-white/70">
          A lander on the Moon needs two things: sunlight for power, and Earth above the horizon to talk to home.
          Neither works the way it does on Earth.
        </p>

        <HorizonSketch />

        <div className="space-y-7">
          <Topic marker="bg-[#f2c14e]" title="Sunlight">
            The Moon turns once relative to the Sun every 29.5 days, so most places get about two weeks of light
            followed by two weeks of night. Near the poles the Sun never climbs high. It skims along the horizon,
            so a ridge only a few hundred metres tall can decide whether a spot is lit.
          </Topic>

          <Topic marker="bg-sky-400" title="Earth">
            The Moon always keeps the same face toward Earth. From the near side, Earth hangs in almost the same
            spot in the sky and does not rise or set each day. It only drifts by a few degrees as the Moon wobbles.
            From the far side, Earth is never visible.
          </Topic>

          <Topic marker="bg-white/40" title="Why the south pole is tricky">
            At the pole both the Sun and Earth sit close to the horizon. That small wobble is enough to lift them
            above a ridge or hide them behind it, so power and contact come and go. Ridgeline works out when.
          </Topic>
        </div>

        <section className="border-t border-white/[0.08] pt-6">
          <h3 className="text-[15px] font-medium text-white">See the real sky at a site</h3>
          <p className="mt-1.5 max-w-[56ch] text-[13px] leading-[1.7] text-white/55">
            Pick a landing site to see when it has sunlight and Earth in view, and how long until each is lost.
            Positions come from the JPL ephemeris and NASA LOLA terrain.
          </p>
          <button
            type="button"
            onClick={onChooseSite}
            className="mt-4 h-10 rounded-md bg-white px-4 text-[13px] font-medium text-black transition hover:bg-white/85"
          >
            Choose a site
          </button>
        </section>
      </div>
    </aside>
  );
}

function Topic({ marker, title, children }: { marker: string; title: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[auto_1fr] gap-x-3">
      <span aria-hidden="true" className={`mt-[7px] h-2 w-2 rounded-full ${marker}`} />
      <div>
        <h3 className="text-[15px] font-medium text-white">{title}</h3>
        <p className="mt-1.5 max-w-[60ch] text-[13px] leading-[1.75] text-white/60">{children}</p>
      </div>
    </section>
  );
}

/** A simple sketch: low Sun and low Earth near a polar ridge line. Not to scale. */
function HorizonSketch() {
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#050505]">
        <svg viewBox="0 0 560 200" role="img" aria-labelledby="horizon-sketch-title" className="block h-auto w-full">
          <title id="horizon-sketch-title">
            Sketch of a polar horizon: the Sun skims just above a ridge on the right, and Earth sits low on the
            left.
          </title>

          {/* sky glow near the horizon */}
          <defs>
            <linearGradient id="sky-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="560" height="150" fill="url(#sky-fade)" />

          {/* Earth: low, above the left ridge */}
          <circle cx="140" cy="92" r="13" fill="none" stroke="#38bdf8" strokeOpacity="0.85" strokeWidth="1.5" />
          <text x="140" y="68" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="11">
            Earth
          </text>

          {/* Sun: skimming the ridge on the right */}
          <circle cx="410" cy="118" r="11" fill="#f2c14e" fillOpacity="0.9" />
          <path d="M360 118 H385 M435 118 H460" stroke="#f2c14e" strokeOpacity="0.35" strokeDasharray="3 4" />
          <text x="410" y="96" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="11">
            Sun
          </text>

          {/* ridge silhouette */}
          <path
            d="M0 150 L40 138 L80 144 L120 120 L165 132 L210 126 L250 140 L300 134 L345 142 L380 128 L430 136 L470 122 L520 140 L560 132 L560 200 L0 200 Z"
            fill="#121212"
            stroke="#ffffff"
            strokeOpacity="0.22"
          />

          <text x="16" y="186" fill="#ffffff" fillOpacity="0.3" fontSize="10">
            Looking along the horizon near the south pole · not to scale
          </text>
        </svg>
      </div>
    </figure>
  );
}
