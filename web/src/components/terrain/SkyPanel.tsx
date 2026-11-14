interface SkyPanelProps {
  onClose: () => void;
}

export default function SkyPanel({
  onClose,
}: SkyPanelProps) {
  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-[90]
        bg-black/20
      "
    >

      <div
        className="
          pointer-events-auto
          absolute
          inset-x-0
          bottom-0
          max-h-[30dvh]
          w-full
          overflow-y-auto
          border
          border-white/15
          bg-[#050505]/95
          p-4
          backdrop-blur-xl
          sm:p-6
          lg:inset-y-4
          lg:left-auto
          lg:right-4
          lg:w-[min(36vw,460px)]
          lg:max-h-none
          lg:p-6
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            items-start
            justify-between
          "
        >

          <div>

            <p
              className="
                text-[8px]
                uppercase
                tracking-[3px]
                text-white/35
              "
            >
              03 — SUN & EARTH
            </p>

            <h2
              className="
                mt-2
                font-['Michroma']
                text-lg
              "
            >
              THE LUNAR SKY
            </h2>

            <p
              className="
                mt-2
                max-w-[500px]
                text-[9px]
                leading-[1.6]
                text-white/35
              "
            >
              A simple guide to the Sun and
              Earth in the lunar sky. This
              panel is not a live calculation.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              text-xl
              text-white/45
              hover:text-white
            "
          >
            ×
          </button>

        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div
          className="
            mt-7
            grid
            gap-3
            md:grid-cols-3
          "
        >

          <SkyCard
            title="SUN"
            metric="Light and shadow"
            source="Sunlight creates day and night."
          />

          <SkyCard
            title="EARTH"
            metric="Earth in the sky"
            source="The view depends on the lunar location."
          />

          <SkyCard
            title="MOON"
            metric="Lunar day"
            source="The Sun's position changes over time."
          />

        </div>

        {/* =================================================
            VISUAL
        ================================================= */}

        <div
          className="
            relative
            mt-6
            h-[220px]
            overflow-hidden
            border
            border-white/10
            bg-[radial-gradient(circle_at_center,rgba(255,59,18,0.08),transparent_55%)]
          "
        >

          {/* GRID */}

          <span className="absolute left-3 top-3 z-10 text-[7px] uppercase tracking-[1.5px] text-white/35">
            CONCEPTUAL DIAGRAM · NOT LIVE DATA
          </span>

          <div
            className="
              absolute
              inset-0
              opacity-20
              bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)]
              bg-[size:35px_35px]
            "
          />

          {/* EARTH */}

          <div
            className="
              absolute
              left-[22%]
              top-1/2
              h-7
              w-7
              -translate-y-1/2
              rounded-full
              border
              border-white/40
              bg-white/5
            "
          />

          <span
            className="
              absolute
              left-[18%]
              top-[65%]
              text-[7px]
              uppercase
              tracking-[2px]
              text-white/30
            "
          >
            EARTH
          </span>

          {/* MOON */}

          <div
            className="
              absolute
              left-1/2
              top-1/2
              h-28
              w-28
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-white/30
              bg-white/[0.03]
              shadow-[0_0_60px_rgba(255,255,255,0.03)]
            "
          />

          {/* SUN */}

          <div
            className="
              absolute
              right-[15%]
              top-[22%]
              h-9
              w-9
              rounded-full
              border
              border-[#ff3b12]/60
              bg-[#ff3b12]/10
              shadow-[0_0_35px_rgba(255,59,18,0.25)]
            "
          />

          <span
            className="
              absolute
              right-[13%]
              top-[10%]
              text-[7px]
              uppercase
              tracking-[2px]
              text-[#ff3b12]
            "
          >
            SUN
          </span>

          {/* CONNECTION LINE */}

          <div
            className="
              absolute
              left-[25%]
              right-[24%]
              top-1/2
              h-px
              -translate-y-1/2
              border-t
              border-dashed
              border-white/15
            "
          />

        </div>

        {/* =================================================
            NOTE
        ================================================= */}

        <p
          className="
            mt-5
            text-[9px]
            leading-[1.7]
            text-white/35
          "
        >
          Site-specific Sun and Earth
          positions are not connected in
          this view. No visibility or
          lighting measurements are shown.
        </p>

      </div>
    </div>
  );
}

function SkyCard({
  title,
  metric,
  source,
}: {
  title: string;
  metric: string;
  source: string;
}) {
  return (
    <div
      className="
        border
        border-white/10
        p-4
      "
    >

      <div
        className="
          text-[8px]
          tracking-[2px]
          text-white/35
        "
      >
        {title}
      </div>

      <div
        className="
          mt-5
          font-['Michroma']
          text-[10px]
        "
      >
        {metric}
      </div>

      <div
        className="
          mt-2
          text-[8px]
          text-white/30
        "
      >
        {source}
      </div>

    </div>
  );
}