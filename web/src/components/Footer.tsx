import footerBg from "../../public/images/footer.png";

export default function Footer() {
  return (
    <footer className="relative z-[100] w-full overflow-hidden bg-black text-white">

      {/* =====================================================
          BACKGROUND IMAGE
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          bg-cover
          bg-center
          bg-no-repeat
          
        "
        style={{
          backgroundImage: `url(${footerBg})`,
        }}
      />

      {/* =====================================================
          DARK OVERLAY
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-[1]
          bg-black/60
        "
      />

      {/* =====================================================
          TOP DIVIDER
      ===================================================== */}

      <div className="relative z-10 h-px w-full bg-white/15" />

      {/* =====================================================
          BACKGROUND GRID
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-[2]
          opacity-[0.07]
          bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)]
          bg-[size:100px_100px]
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1500px]
          px-6
          py-20
          md:px-10
          lg:px-[7.5vw]
        "
      >

        {/* =================================================
            TOP AREA
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-16
            md:grid-cols-2
            lg:grid-cols-[1.5fr_1fr_1fr_1fr]
            lg:gap-10
          "
        >

          {/* BRAND */}

          <div>
            <div
              className="
                font-['Michroma']
                text-lg
                tracking-[3px]
              "
            >
              LUNA
              <span className="ml-2 text-white/40">
                SPACE
              </span>
            </div>

            <p
              className="
                mt-7
                max-w-[340px]
                text-xs
                leading-[1.8]
                text-white/45
              "
            >
              A visual exploration platform for understanding
              the lunar south pole and the challenges of future
              lunar missions.
            </p>

            <div
              className="
                mt-8
                text-[9px]
                uppercase
                tracking-[3px]
                text-[#ff3b12]
              "
            >
              EXPLORING THE UNKNOWN
            </div>
          </div>


          {/* EXPLORE */}

          <div>
            <div
              className="
                mb-6
                text-[9px]
                uppercase
                tracking-[3px]
                text-white/35
              "
            >
              Explore
            </div>

            <div className="flex flex-col gap-4 text-xs text-white/60">

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Lunar Navigator
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Lunar South Pole
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Mission Data
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Exploration
              </a>

            </div>
          </div>


          {/* RESOURCES */}

          <div>
            <div
              className="
                mb-6
                text-[9px]
                uppercase
                tracking-[3px]
                text-white/35
              "
            >
              Resources
            </div>

            <div className="flex flex-col gap-4 text-xs text-white/60">

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                NASA
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                LRO / LOLA
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Mission Data
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Documentation
              </a>

            </div>
          </div>


          {/* PROJECT */}

          <div>
            <div
              className="
                mb-6
                text-[9px]
                uppercase
                tracking-[3px]
                text-white/35
              "
            >
              Project
            </div>

            <div className="flex flex-col gap-4 text-xs text-white/60">

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                About
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Technology
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                GitHub ↗
              </a>

              <a
                href="#"
                className="transition-colors hover:text-white"
              >
                Contact ↗
              </a>

            </div>
          </div>

        </div>


        {/* =================================================
            LARGE FOOTER TITLE
        ================================================= */}

        <div
          className="
            mt-24
            overflow-hidden
            border-y
            border-white/10
            py-8
          "
        >
          <div
            className="
              w-full
              text-center
              whitespace-nowrap
              font-['Michroma']
              text-[clamp(34px,8vw,120px)]
              font-light
              uppercase
              leading-none
              tracking-[-4px]
              text-white/90
            "
          >
             RIDGELINE
          </div>
        </div>


        {/* =================================================
            BOTTOM BAR
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-6
            pt-8
            text-[9px]
            uppercase
            tracking-[1.5px]
            text-white/35
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>
            © NASA's Backup Plan
          </div>

          <div className="flex gap-6">

            <a
              href="#"
              className="transition-colors hover:text-white"
            >
              Privacy
            </a>

            <a
              href="#"
              className="transition-colors hover:text-white"
            >
              Credits
            </a>

          </div>

          <div>
            BUILT FOR LUNAR EXPLORATION
          </div>

        </div>

      </div>

    </footer>
  );
}