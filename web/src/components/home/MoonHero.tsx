
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import MoonModel from "../3d/MoonModel";

export default function MoonHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // COUNT UP
  // =========================================================

  const [diameter, setDiameter] = useState(0);
  const [gravity, setGravity] = useState(0);
  const [density, setDensity] = useState(0);
  const [inclination, setInclination] = useState(0);

  useEffect(() => {
    const duration = 1800;
    const startTime = performance.now();

    let frameId: number;

    const animateNumbers = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setDiameter(
        Math.floor(3474 * easedProgress)
      );

      setGravity(
        Number(
          (1.62 * easedProgress).toFixed(2)
        )
      );

      setDensity(
        Math.floor(3344 * easedProgress)
      );

      setInclination(
        Number(
          (6.68 * easedProgress).toFixed(2)
        )
      );

      if (progress < 1) {
        frameId =
          requestAnimationFrame(
            animateNumbers
          );
      }
    };

    frameId =
      requestAnimationFrame(
        animateNumbers
      );

    return () =>
      cancelAnimationFrame(frameId);
  }, []);

  // =========================================================
  // SCROLL PROGRESS
  //
  // The container contains:
  //
  // 0%   = HERO
  // 50%  = CHARACTERISATION START
  // 100% = CHARACTERISATION END
  //
  // The Moon is shared between both sections.
  // =========================================================

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [
      "start start",
      "end end",
    ],
  });

  // =========================================================
  // MOON HORIZONTAL MOVEMENT
  //
  // HERO:
  // Right side
  //
  // CHARACTERISATION:
  // Left side
  // =========================================================

  const moonX = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.7, 1],
    [
      "20vw",
      "12vw",
      "-24vw",
      "-28vw",
      "-31vw",
    ]
  );

  // =========================================================
  // MOON VERTICAL MOVEMENT
  // =========================================================

  const moonY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.7, 1],
    [
      "0vh",
      "2vh",
      "4vh",
      "2vh",
      "0vh",
    ]
  );

  // =========================================================
  // MOON SCALE
  //
  // Starts large in Hero.
  // Gets slightly smaller when entering
  // Characterisation.
  // =========================================================

const moonScale = useTransform(
  scrollYProgress,
  [0, 0.25, 0.5, 0.7, 1],
  [
    0.88,
    0.88,
    0.88,
    0.88,
    0.88,
  ]
);

  // =========================================================
  // MOON ROTATION
  // =========================================================

  const moonRotate = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 18]
  );

  // =========================================================
  // MOON OPACITY
  // =========================================================

  const moonOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.8, 1],
    [
      1,
      1,
      0.92,
      0.82,
    ]
  );

  // =========================================================
  // COMPONENT
  // =========================================================

  return (
    <div
      ref={containerRef}
      className="
        relative
        w-full
        bg-[#020202]
        text-white

        overflow-visible
      "
    >

      {/* =====================================================
          SHARED MOON
          
          IMPORTANT:
          This is OUTSIDE both sections.

          Therefore the Moon can move from:

          HERO
             ↓
          CHARACTERISATION

          without being clipped.
      ===================================================== */}

      <motion.div
        style={{
          x: moonX,
          y: moonY,
          scale: moonScale,
          rotate: moonRotate,
          opacity: moonOpacity,
        }}
        className="
          fixed
          left-[34vw]
          top-[6vh]

          z-[50]
          pointer-events-none

          w-[46vw]
          h-[86vh]

          overflow-visible

          md:left-[35vw]
          md:top-[5vh]
          md:w-[46vw]
          md:h-[88vh]

          max-md:left-[8vw]
          max-md:top-[18vh]
          max-md:w-[84vw]
          max-md:h-[72vh]
        "
      >

        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 38,
            near: 0.1,
            far: 100,
          }}

          dpr={[1, 2]}

          gl={{
            antialias: true,
            alpha: true,
          }}

          className="
            !h-full
            !w-full
          "
        >

          {/* =================================================
              MOON LIGHTING
          ================================================= */}

          <ambientLight
            intensity={1.1}
          />

          <directionalLight
            position={[-4, 3, 5]}
            intensity={2.5}
          />

          <directionalLight
            position={[4, -2, 3]}
            intensity={0.35}
          />

          {/* =================================================
              MOON MODEL
          ================================================= */}

          <MoonModel />

          {/* =================================================
              ROTATION CONTROLS
          ================================================= */}

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.45}
          />

        </Canvas>

      </motion.div>


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        className="
          relative

          h-screen
          min-h-[720px]

          w-full

          overflow-visible

          bg-[#020202]
        "
      >

        {/* =================================================
            SPACE BACKGROUND
        ================================================= */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            z-0

            bg-cover
            bg-center
            bg-no-repeat

            opacity-70
          "
          style={{
            backgroundImage:
              "url('/images/space-background.jpg')",
          }}
        />

        {/* =================================================
            DARK OVERLAY
        ================================================= */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            z-[1]

            bg-black/55
          "
        />


        {/* =================================================
            GRID
        ================================================= */}

        <div
          className="
            pointer-events-none

            absolute
            inset-0

            z-[2]

            opacity-[0.12]

            bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)]

            bg-[size:120px_120px]
          "
        />


        {/* =================================================
            NAVIGATION — handled by global MoonNav fixed bar
        ================================================= */}


        {/* =================================================
            HERO TITLE
        ================================================= */}

        <div
          className="
            absolute

            left-[7.5vw]
            top-[31%]

            z-[60]

            max-md:left-6
            max-md:top-[20%]
          "
        >

          <div
            className="
              mb-4

              text-[9px]
              uppercase
              tracking-[5px]

              text-white/40
            "
          >
            01 — EXPLORATION
          </div>


          <h1
            className="
              font-['Michroma']

              text-[clamp(42px,6.2vw,105px)]

              font-light

              leading-[0.95]

              tracking-[-4px]

              text-[#f5f5f5]

              max-md:text-[12vw]
              max-md:tracking-[-2px]
            "
          >
            EXPLORING
            <br />
            THE LUNAR
            <br />
            SOUTH POLE
          </h1>

        </div>


        {/* =================================================
            MOON LABEL
        ================================================= */}

        <div
          className="
            absolute

            left-[72%]
            top-[55%]

            z-[65]

            transition-all
            duration-300

            max-md:left-[62%]
            max-md:top-[53%]
          "
        >

          <span
            className="
              inline-block

              bg-white

              px-2
              py-1

              text-[8px]

              text-black
            "
          >
            MOON
          </span>


          <div
            className="
              mt-3

              text-[9px]
              leading-relaxed

              text-white/60
            "
          >
            384 000 km

            <br />

            <span
              className="
                text-white/40
              "
            >
              from earth
            </span>
          </div>

        </div>


        {/* =================================================
            HORIZONTAL GUIDE
        ================================================= */}

        <div
          className="
            pointer-events-none

            absolute
            left-0
            right-0

            top-[48.5%]

            z-[10]

            h-px

            bg-white/10
          "
        />


        {/* =================================================
            VERTICAL GUIDE
        ================================================= */}

        <div
          className="
            pointer-events-none

            absolute

            bottom-0
            left-[78%]
            top-0

            z-[10]

            w-px

            bg-white/10
          "
        />


        {/* =================================================
            EXPLORE BUTTON
        ================================================= */}

        <button
          type="button"
          className="
            absolute

            bottom-[8%]
            left-[7.5vw]

            z-[65]

            glass-chip
            glass-accent

            h-12
            w-[205px]

            text-[10px]
            tracking-wide

            text-white

            transition-all
            duration-300

            hover:-translate-y-1

            max-md:left-6
            max-md:w-[180px]
          "
        >
          LUNAR EXPLORATION

          <span
            className="
              ml-5
            "
          >
            ↗
          </span>
        </button>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <div
          className="
            absolute

            bottom-[8%]
            left-[36%]

            z-[65]

            w-[260px]

            text-[10px]
            leading-[1.5]

            text-white/60

            max-md:bottom-[18%]
            max-md:left-6
            max-md:w-[250px]
          "
        >
          Ice hidden deep in the craters,
          <br />

          exceptional levels of sunlight,
          <br />

          rare-earth elements...
          <br />

          The Moon's South Pole is a land
          <br />

          of opportunity.
        </div>


        {/* =================================================
            HERO DATA PANEL
        ================================================= */}

        <div
          className="
            absolute

            bottom-6
            right-[7.5vw]

            z-[65]

            glass-card
            glass-float

            flex
            overflow-hidden
            rounded-3xl

            h-[205px]
            w-[36%]

            max-lg:hidden
          "
        >

          {/* MINI MOON */}

          <div
            className="
              relative

              w-[38%]

              border-r
              border-white/20
            "
          >

            <span
              className="
                absolute

                left-0
                top-3

                bg-white

                px-2
                py-1

                text-[8px]

                text-black
              "
            >
              MOON
            </span>


            <div
              className="
                absolute

                left-5
                top-7

                h-[120px]
                w-[120px]

                rounded-full

                border
                border-white/60
              "
            >

              <div
                className="
                  absolute
                  inset-[6px]

                  rounded-full

                  border
                  border-dashed
                  border-white/20
                "
              />

              <div
                className="
                  absolute

                  left-1/2
                  top-1/2

                  -translate-x-1/2
                  -translate-y-1/2

                  text-lg

                  text-white/70
                "
              >
                +
              </div>

            </div>


            <div
              className="
                absolute

                bottom-3
                left-2

                text-[9px]

                text-white/70
              "
            >
              384 000 km

              <br />

              <span
                className="
                  text-white/40
                "
              >
                from Earth
              </span>
            </div>

          </div>


          {/* STATS */}

          <div
            className="
              grid

              flex-1

              grid-cols-2
              grid-rows-2
            "
          >

            {[
              [
                "DIAMETER →",
                diameter.toLocaleString(),
                "Km",
              ],
              [
                "GRAVITY",
                gravity.toFixed(2),
                "m/s²",
              ],
              [
                "DENSITY",
                density.toLocaleString(),
                "kg/m³",
              ],
              [
                "INCLINATION",
                inclination.toFixed(2),
                "degrees",
              ],
            ].map(
              ([label, value, unit]) => (
                <div
                  key={label}
                  className="
                    flex
                    flex-col
                    justify-center

                    border-b
                    border-r
                    border-white/15

                    px-5
                  "
                >

                  <span
                    className="
                      mb-2

                      text-[8px]

                      tracking-[1px]

                      text-white/50
                    "
                  >
                    {label}
                  </span>


                  <strong
                    className="
                      font-['Michroma']

                      text-[21px]

                      font-light
                    "
                  >
                    {value}
                  </strong>


                  <small
                    className="
                      mt-1

                      text-[8px]

                      text-white/40
                    "
                  >
                    {unit}
                  </small>

                </div>
              )
            )}

          </div>


          {/* PHASE */}

          <div
            className="
              flex
              w-[55px]
              flex-col
            "
          >

            <div
              className="
                flex
                flex-1
                items-center
                justify-center

                border-l
                border-b
                border-white/15
              "
            >

              <span
                className="
                  rotate-180

                  text-[8px]
                  tracking-[1px]

                  text-white/50

                  [writing-mode:vertical-rl]
                "
              >
                DAY 29
              </span>

            </div>


            <div
              className="
                flex
                flex-1
                items-center
                justify-center

                border-l
                border-white/15
              "
            >

              <span
                className="
                  rotate-180

                  text-[8px]
                  tracking-[1px]

                  text-white/50

                  [writing-mode:vertical-rl]
                "
              >
                PHASE 5
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CHARACTERISATION SECTION
      ===================================================== */}
{/* =====================================================
    CHARACTERISATION SECTION
===================================================== */}
<section
  className="
    relative
    w-full
    overflow-visible
    bg-[#020202]

    px-6
    py-12

    sm:px-8
    sm:py-14

    md:px-[6vw]
    md:py-16

    lg:px-[7.5vw]
    lg:py-20
  "
>
  {/* ================= BACKGROUND GLOW ================= */}
  <div
    className="
      pointer-events-none
      absolute
      inset-0
      bg-[radial-gradient(circle_at_25%_45%,rgba(255,255,255,0.045),transparent_40%)]
    "
  />

  {/* ================= VERTICAL DIVIDER ================= */}
  <div
    className="
      pointer-events-none
      absolute
      bottom-0
      left-[55%]
      top-0
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
      z-20

      mb-6

      text-[8px]
      uppercase
      tracking-[4px]
      text-white/35

      sm:mb-7

      md:text-[9px]
      md:tracking-[5px]

      lg:mb-2
    "
  >
    02 — CHARACTERISATION
  </div>


  {/* =====================================================
      MAIN CONTENT
      Moon is already the shared fixed 3D object.
      Do NOT create another large Moon placeholder here.
  ===================================================== */}
  <div
    className="
      relative
      z-10

      grid
      min-h-[430px]

      grid-cols-1
      items-center

      lg:min-h-[480px]
      lg:grid-cols-[1.05fr_0.95fr]
      lg:gap-4
    "
  >

    {/* =================================================
        LEFT SIDE
        Empty space reserved for the shared Moon
    ================================================= */}
    <div
      className="
        relative
        hidden
        min-h-[360px]

        lg:block
      "
    >
      {/* Small technical label */}
      <div
        className="
          absolute
          bottom-2
          left-0

          text-[8px]
          tracking-[4px]
          text-white/25
        "
      >
        LUNAR SOUTH POLE

        <div
          className="
            mt-3
            border-t
            border-white/20
            pt-3
            text-[8px]
            tracking-[2px]
            text-white/30
          "
        >
          DATA → TERRAIN → DECISION
        </div>
      </div>
    </div>


    {/* =================================================
        RIGHT SIDE
        TITLE + INTRO
    ================================================= */}
    <div
      className="
        relative
        z-30

        flex
        flex-col
        justify-center

        lg:pl-2
      "
    >

      {/* TITLE */}
      <h2
        className="
          font-['Michroma']
          font-light
          uppercase

          text-[clamp(38px,5vw,82px)]

          leading-[0.88]
          tracking-[-2px]

          text-white

          sm:text-[clamp(42px,5vw,86px)]
          sm:tracking-[-3px]

          lg:text-[clamp(46px,4.8vw,82px)]
          lg:tracking-[-4px]
        "
      >
        WHAT
        <br />
        MAKES
        <br />
        A GOOD
        <br />
        LANDING
        <br />
        SITE?
      </h2>


      {/* DESCRIPTION */}
      <div
        className="
          mt-6

          max-w-[400px]

          text-[10px]
          leading-[1.55]
          text-white/50

          sm:mt-7
          sm:text-[11px]

          md:text-xs

          lg:mt-6
        "
      >

        {/* RED LINE */}
        <div
          className="
            mb-4
            h-px
            w-14
            bg-[#ff3b12]
          "
        />

        <p>
          A lunar landing site is more than a point on a map.
          It is a balance between sunlight, terrain, resources
          and long-term accessibility.
        </p>

      </div>
    </div>

  </div>


  {/* =====================================================
      CHARACTERISATION CARDS
  ===================================================== */}
  <div
    className="
      relative
      z-30

      mt-10

      grid
      grid-cols-1
      gap-6

      sm:grid-cols-2
      sm:gap-x-8
      sm:gap-y-7

      md:mt-12

      lg:mt-10
      lg:grid-cols-4
      lg:gap-6

      xl:gap-8
    "
  >
    {[
      {
        n: "01",
        tag: "SUNLIGHT",
        title: "ILLUMINATION",
        text:
          "Areas receiving sunlight for longer periods can support power generation.",
      },
      {
        n: "02",
        tag: "TERRAIN",
        title: "SURFACE SAFETY",
        text:
          "Slope, craters and surface roughness influence whether a spacecraft can land safely.",
      },
      {
        n: "03",
        tag: "RESOURCES",
        title: "WATER ICE",
        text:
          "Permanently shadowed regions can preserve water ice and other valuable resources.",
      },
      {
        n: "04",
        tag: "ACCESS",
        title: "COMMUNICATION",
        text:
          "Visibility and access to Earth or relay infrastructure can influence mission reliability.",
      },
    ].map((c) => (
      <div
        key={c.n}
        className="
          border-t
          border-white/20
          pt-3

          sm:pt-4
        "
      >

        {/* CARD HEADER */}
        <div
          className="
            mb-3

            flex
            items-center
            justify-between

            text-[7px]
            tracking-[2px]
            text-white/40

            sm:text-[8px]
          "
        >
          <span>{c.n}</span>

          <span className="text-[#ff3b12]">
            {c.tag}
          </span>
        </div>


        {/* CARD TITLE */}
        <h3
          className="
            font-['Michroma']
            text-[13px]
            font-light
            text-white

            sm:text-[14px]

            lg:text-[15px]
          "
        >
          {c.title}
        </h3>


        {/* CARD TEXT */}
        <p
          className="
            mt-2

            max-w-[300px]

            text-[9px]
            leading-[1.55]
            text-white/40

            sm:text-[10px]
          "
        >
          {c.text}
        </p>

      </div>
    ))}
  </div>


  {/* =====================================================
      CONTINUE
  ===================================================== */}
  <div
    className="
      relative
      z-30

      mt-10

      text-center

      text-[7px]
      tracking-[3px]
      text-white/30

      sm:mt-12
      sm:text-[8px]
      sm:tracking-[4px]
    "
  >
    CONTINUE EXPLORING

    <span className="ml-2 text-[#ff3b12]">
      ↓
    </span>
  </div>

</section>

    </div>
  );
}
