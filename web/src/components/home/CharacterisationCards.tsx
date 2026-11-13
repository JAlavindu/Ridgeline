export default function LunarNavigator() {
  return (
    <section
      className="
        relative
        min-h-[720px]
        w-full
        overflow-visible
        bg-black

        px-6
        py-20

        sm:px-8
        sm:py-24

        md:px-[6vw]
        md:py-28

        lg:px-[7.5vw]
        lg:py-32
        z-100
      "
    >
      {/* ================= BACKGROUND GLOW ================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0

          bg-[radial-gradient(circle_at_72%_45%,rgba(255,255,255,0.055),transparent_38%)]
        "
      />

      {/* ================= TECH GRID ================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-0

          opacity-[0.035]

          bg-[linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)]

          bg-[size:100px_100px]
        "
      />

      {/* ================= VERTICAL DIVIDER ================= */}

      <div
        className="
          pointer-events-none
          absolute
          inset-y-0
          left-[55%]
          z-[1]

          hidden
          w-px

          bg-white/[0.06]

          lg:block
        "
      />

      {/* ================= SECTION NUMBER ================= */}

      <div
        className="
          relative
          z-[60]

          mb-10

          text-[8px]
          uppercase
          tracking-[4px]
          text-white/35

          sm:mb-12
          sm:text-[9px]
          sm:tracking-[5px]

          lg:mb-8
        "
      >
        02 — LUNAR NAVIGATOR
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-[60]

          grid
          min-h-[470px]

          grid-cols-1

          lg:grid-cols-[0.9fr_1.1fr]
          lg:gap-16
        "
      >
        {/* =================================================
            LEFT SIDE — TITLE
        ================================================= */}

        <div
          className="
            relative
            z-[70]

            flex
            flex-col
            justify-center

            lg:pr-10
          "
        >
          {/* EYEBROW */}

          <div
            className="
              mb-5

              flex
              items-center
              gap-3

              text-[8px]
              uppercase
              tracking-[4px]
              text-white/35
            "
          >
            <span className="h-px w-8 bg-[#ff3b12]" />

            02 — NAVIGATION SYSTEM
          </div>

          {/* TITLE */}

          <h2
            className="
              font-['Michroma']
              font-light
              uppercase

              text-[clamp(42px,5.5vw,88px)]

              leading-[0.88]
              tracking-[-3px]

              text-white

              sm:text-[clamp(48px,5.5vw,92px)]

              lg:text-[clamp(52px,5vw,88px)]
              lg:tracking-[-4px]
            "
          >
            WHAT
            <br />
            IS
            <br />
            LUNAR
            <br />
            NAVIGATOR?
          </h2>

          {/* TECHNICAL DESCRIPTION */}

          <div
            className="
              mt-8

              max-w-[340px]

              border-t
              border-white/15

              pt-5

              text-[9px]
              leading-[1.7]
              text-white/45

              sm:text-[10px]
            "
          >
            A visual decision-support system designed to help
            explore the conditions surrounding potential lunar
            south-pole landing sites.
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE — INTRO + INFORMATION
        ================================================= */}

        <div
          className="
            relative
            z-[70]

            mt-14

            flex
            flex-col
            justify-center

            lg:mt-0
          "
        >
          {/* SMALL LABEL */}

          <div
            className="
              mb-5

              text-[8px]
              uppercase
              tracking-[4px]

              text-white/30

              sm:text-[9px]
              sm:tracking-[5px]
            "
          >
            THE MOON ISN'T AN EASY PLACE TO LAND.
          </div>

          {/* LARGE STATEMENT */}

          <h3
            className="
              max-w-[620px]

              font-sans
              font-light

              text-[clamp(22px,2.4vw,38px)]

              uppercase
              leading-[1.15]
              tracking-[-1px]

              text-white
            "
          >
            THE MOON ISN'T
            <br />
            AN EASY PLACE
            <br />
            TO LAND.
          </h3>

          {/* DESCRIPTION */}

          <p
            className="
              mt-7

              max-w-[480px]

              text-[10px]
              leading-[1.7]

              text-white/45

              sm:text-[11px]
              md:text-xs
            "
          >
            At the lunar south pole, sunlight, terrain, and
            Earth visibility can change dramatically with
            location and time. Understanding these conditions
            is essential for planning future missions.
          </p>

          {/* =================================================
              THREE INFORMATION ITEMS
          ================================================= */}

          <div
            className="
              mt-10

              grid
              grid-cols-1

              border-t
              border-white/15

              sm:grid-cols-3
            "
          >
            {/* LIGHT */}

            <div
              className="
                border-b
                border-white/15
                py-5

                sm:border-b-0
                sm:border-r
                sm:px-5
                sm:first:pl-0
              "
            >
              <div
                className="
                  mb-4

                  flex
                  items-center
                  justify-between

                  text-[7px]
                  tracking-[3px]
                  text-white/35
                "
              >
                <span>01</span>

                <span className="text-[#ff3b12]">
                  LIGHT
                </span>
              </div>

              <h4
                className="
                  font-['Michroma']
                  text-[12px]
                  font-light
                  uppercase
                  text-white

                  sm:text-[13px]
                "
              >
                LIGHT
              </h4>

              <p
                className="
                  mt-3

                  max-w-[170px]

                  text-[9px]
                  leading-[1.6]
                  text-white/40

                  sm:text-[10px]
                "
              >
                Sunlight is limited and unpredictable.
              </p>
            </div>

            {/* TERRAIN */}

            <div
              className="
                border-b
                border-white/15
                py-5

                sm:border-b-0
                sm:border-r
                sm:px-5
              "
            >
              <div
                className="
                  mb-4

                  flex
                  items-center
                  justify-between

                  text-[7px]
                  tracking-[3px]
                  text-white/35
                "
              >
                <span>02</span>

                <span className="text-[#ff3b12]">
                  TERRAIN
                </span>
              </div>

              <h4
                className="
                  font-['Michroma']
                  text-[12px]
                  font-light
                  uppercase
                  text-white

                  sm:text-[13px]
                "
              >
                TERRAIN
              </h4>

              <p
                className="
                  mt-3

                  max-w-[170px]

                  text-[9px]
                  leading-[1.6]
                  text-white/40

                  sm:text-[10px]
                "
              >
                Craters and ridges shape what can be seen from
                the surface.
              </p>
            </div>

            {/* COMMUNICATION */}

            <div
              className="
                py-5

                sm:px-5
                sm:pr-0
              "
            >
              <div
                className="
                  mb-4

                  flex
                  items-center
                  justify-between

                  text-[7px]
                  tracking-[3px]
                  text-white/35
                "
              >
                <span>03</span>

                <span className="text-[#ff3b12]">
                  COMMS
                </span>
              </div>

              <h4
                className="
                  font-['Michroma']
                  text-[12px]
                  font-light
                  uppercase
                  text-white

                  sm:text-[13px]
                "
              >
                COMMUNICATION
              </h4>

              <p
                className="
                  mt-3

                  max-w-[170px]

                  text-[9px]
                  leading-[1.6]
                  text-white/40

                  sm:text-[10px]
                "
              >
                Earth may disappear below the local horizon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          BOTTOM TECHNICAL FOOTER
      ===================================================== */}

      <div
        className="
          relative
          z-[60]

          mt-14

          flex
          flex-col
          gap-4

          border-t
          border-white/10

          pt-5

          text-[7px]
          uppercase
          tracking-[3px]
          text-white/25

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <span>
          LUNAR SOUTH POLE / ENVIRONMENTAL CONDITIONS
        </span>

        <span>
          LIGHT → TERRAIN → COMMUNICATION
        </span>

        <span className="text-[#ff3b12]">
          CONTINUE EXPLORING ↓
        </span>
      </div>
    </section>
  );
}