import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MoonModel from "../3d/MoonModel";

export default function MoonHero() {
  // =====================================================
  // COUNT-UP NUMBERS
  // =====================================================

  const [diameter, setDiameter] = useState(0);
  const [gravity, setGravity] = useState(0);
  const [density, setDensity] = useState(0);
  const [inclination, setInclination] = useState(0);

  // =====================================================
  // MOBILE DETECTION
  // =====================================================

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  // =====================================================
  // COUNT-UP ANIMATION
  // =====================================================

  useEffect(() => {
    const duration = 1800;
    const startTime = performance.now();

    let animationFrame: number;

    const animateNumbers = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(
        elapsed / duration,
        1
      );

      const eased =
        1 - Math.pow(1 - progress, 3);

      setDiameter(
        Math.floor(3474 * eased)
      );

      setGravity(
        Number(
          (1.62 * eased).toFixed(2)
        )
      );

      setDensity(
        Math.floor(3344 * eased)
      );

      setInclination(
        Number(
          (6.68 * eased).toFixed(2)
        )
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(
            animateNumbers
          );
      }
    };

    animationFrame =
      requestAnimationFrame(
        animateNumbers
      );

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section
      className="
        relative
        min-h-[100svh]
        w-full
        overflow-hidden
        bg-[#020202]
        text-white

        max-md:min-h-[900px]
      "
    >

      {/* =====================================================
          REAL SPACE BACKGROUND IMAGE
      ===================================================== */}

      <div
  className="
    pointer-events-none
    absolute
    inset-0
    z-0
    bg-no-repeat
  "
  style={{
    backgroundImage: "url('/images/1.avif')",
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
  }}
/>


      {/* =====================================================
          DARK OVERLAY
          Makes text and Moon easier to see
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          z-[1]
          bg-black/35
        "
      />


      {/* =====================================================
          SUBTLE HORIZONTAL GUIDE LINE
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-[48%]
          z-[2]
          h-px
          bg-white/[0.10]

          max-md:top-[45%]
        "
      />


      {/* =====================================================
          SUBTLE VERTICAL GUIDE LINE
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          left-[78%]
          top-0
          z-[2]
          w-px
          bg-white/[0.10]

          max-md:left-[88%]
        "
      />


      {/* =====================================================
          TOP NAVIGATION
      ===================================================== */}

      <header
        className="
          absolute
          left-0
          top-0
          z-30
          flex
          w-full
          items-center
          justify-between

          px-[7.8vw]
          py-[6.5vh]

          max-lg:px-[5vw]

          max-md:px-[6vw]
          max-md:py-6
        "
      >

        {/* LOGO */}

        <div
          className="
            font-['Michroma']
            text-[13px]
            tracking-[1.5px]
            text-white

            max-md:text-[10px]
            max-md:tracking-[1px]
          "
        >
          LUNAR

          <span className="ml-1 italic opacity-50">
            SPACE
          </span>
        </div>


        {/* CENTER NAV */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            hidden
            -translate-x-1/2
            -translate-y-1/2
            items-center
            gap-5

            text-[11px]
            text-white/80

            md:flex
          "
        >

          <span
            className="
              h-[13px]
              w-[13px]
              rounded-full
              border
              border-white/60
            "
          />

          <span>
            NASA'S BACKUP PLAN
          </span>


        </div>


        


        {/* MENU */}

        <button
          type="button"
          className="
            flex
            h-[36px]
            w-[82px]
            items-center
            justify-between
            bg-white
            px-3
            text-[10px]
            font-medium
            text-black

            transition
            hover:bg-white/90

            max-md:h-[32px]
            max-md:w-[70px]
            max-md:px-2.5
            max-md:text-[9px]
          "
        >
          <span>
            MENU
          </span>

          <span>
            ☰
          </span>
        </button>

      </header>


      {/* =====================================================
          MAIN TITLE
      ===================================================== */}

      <div
        className="
          absolute
          left-[7.8vw]
          top-[34%]
          z-20

          max-xl:top-[32%]

          max-lg:left-[5vw]
          max-lg:top-[31%]

          max-md:left-[6vw]
          max-md:right-[6vw]
          max-md:top-[15%]
        "
      >

        <h1
          className="
            m-0
            font-['Michroma']
            text-[clamp(46px,6.5vw,105px)]
            font-normal
            uppercase
            leading-[0.93]
            tracking-[-3px]
            text-[#f5f5f5]

            max-xl:text-[6.8vw]

            max-lg:text-[7.5vw]
            max-lg:tracking-[-2px]

            max-md:text-[10.5vw]
            max-md:leading-[0.94]
            max-md:tracking-[-1px]

            max-[400px]:text-[10vw]
          "
        >
          EXPLORING
          <br />
          THE LUNAR
          <br />
          SOUTH POLE
        </h1>

      </div>


      {/* =====================================================
          MOON
      ===================================================== */}

      <div
        className="
          absolute
          right-[1vw]
          top-[18%]
          z-10
          h-[66vh]
          w-[50vw]

          max-xl:right-[-2vw]
          max-xl:w-[53vw]

          max-lg:right-[-5vw]
          max-lg:top-[21%]
          max-lg:h-[61vh]
          max-lg:w-[57vw]

          max-md:right-[-8vw]
          max-md:top-[31%]
          max-md:h-[40vh]
          max-md:w-[92vw]

          max-[500px]:right-[-13vw]
          max-[500px]:top-[32%]
          max-[500px]:h-[38vh]
          max-[500px]:w-[105vw]
        "
      >

        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: isMobile ? 43 : 38,
            near: 0.1,
            far: 100,
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
          }}
        >

          {/* MOON LIGHTING */}

          <ambientLight
            intensity={0.9}
          />

          <directionalLight
            position={[-4, 3, 5]}
            intensity={2.8}
          />

          <directionalLight
            position={[4, -2, 3]}
            intensity={0.3}
          />

          {/* MOON */}

          <MoonModel />

          {/* CONTROLS */}

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.45}
          />

        </Canvas>


        {/* =================================================
            MOON LABEL
        ================================================= */}

        <div
          className="
            absolute
            left-[46%]
            top-[55%]
            z-20
            flex
            flex-col
            gap-3

            max-md:left-[43%]
            max-md:top-[54%]

            max-[500px]:left-[40%]
          "
        >

          <span
            className="
              w-fit
              border
              border-black/50
              bg-white
              px-[6px]
              py-[2px]
              text-[8px]
              font-medium
              text-black

              max-md:text-[7px]
            "
          >
            MOON
          </span>

          <div
            className="
              text-[9px]
              leading-[1.4]
              text-white/60

              max-md:text-[8px]
            "
          >
            384 000 km
            <br />
            from earth
          </div>

        </div>

      </div>


      {/* =====================================================
          LUNAR EXPLORATION BUTTON
      ===================================================== */}

      <button
        type="button"
        className="
          absolute
          bottom-[7.5%]
          left-[7.8vw]
          z-30

          h-[49px]
          w-[205px]

          bg-[#ff3d18]
          px-5

          text-left
          text-[10px]
          font-medium
          tracking-[0.3px]
          text-white

          transition
          duration-300

          hover:-translate-y-1
          hover:bg-[#ff4d2b]

          max-lg:left-[5vw]

          max-md:bottom-auto
          max-md:left-[6vw]
          max-md:top-[70%]
          max-md:h-[45px]
          max-md:w-[175px]
          max-md:px-4

          max-[500px]:top-[69%]
        "
      >
        LUNAR EXPLORATION
      </button>


      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      <div
        className="
          absolute
          bottom-[7.8%]
          left-[35.8vw]
          z-30
          w-[260px]

          text-[11px]
          leading-[1.45]
          text-white/70

          max-lg:left-[38vw]

          max-md:bottom-auto
          max-md:left-[6vw]
          max-md:top-[77%]
          max-md:w-[240px]
          max-md:text-[9px]

          max-[500px]:top-[76%]
          max-[500px]:w-[210px]
        "
      >
        Ice hidden deep in the craters,
        <br />
        exceptional levels of sunlight, rare-
        <br />
        earth elements... The Moon's South
        <br />
        Pole is a land of opportunity.
      </div>


      {/* =====================================================
          DESKTOP TECHNICAL PANEL
      ===================================================== */}

      <div
        className="
          absolute
          bottom-0
          right-[7.8vw]
          z-30

          flex
          h-[205px]
          w-[36%]

          border-t
          border-white/25

          max-xl:right-[5vw]
          max-xl:w-[42%]

          max-lg:w-[46%]

          max-md:hidden
        "
      >

        {/* =================================================
            MINI MOON
        ================================================= */}

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
              top-[10px]
              bg-white
              px-[7px]
              py-[3px]
              text-[8px]
              text-black
            "
          >
            MOON
          </span>


          {/* MINI CIRCLE */}

          <div
            className="
              absolute
              left-[20px]
              top-[42px]
              h-[120px]
              w-[120px]
              rounded-full
              border
              border-white/60

              max-lg:left-[10px]
              max-lg:h-[100px]
              max-lg:w-[100px]
            "
          >

            <div
              className="
                absolute
                inset-[6px]
                rounded-full
                border
                border-dashed
                border-white/30
              "
            />

            <div
              className="
                absolute
                left-1/2
                top-1/2
                -translate-x-1/2
                -translate-y-1/2
                text-[17px]
                text-white/80
              "
            >
              +
            </div>

          </div>


          {/* DISTANCE */}

          <div
            className="
              absolute
              bottom-[12px]
              left-[10px]
              text-[10px]
              leading-[1.4]
              text-white/70
            "
          >
            384 000 km
            <br />

            <span className="text-white/40">
              from Earth
            </span>
          </div>

        </div>


        {/* =================================================
            STATS GRID
        ================================================= */}

        <div
          className="
            grid
            flex-1
            grid-cols-2
            grid-rows-2
          "
        >

          {/* DIAMETER */}

          <div
            className="
              flex
              flex-col
              justify-center
              border-b
              border-r
              border-white/20
              px-[18px]
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
              DIAMETER →
            </span>

            <strong
              className="
                font-['Michroma']
                text-[25px]
                font-normal
                text-white/90

                max-lg:text-[20px]
              "
            >
              {diameter.toLocaleString()}
            </strong>

            <small
              className="
                text-[9px]
                text-white/45
              "
            >
              Km
            </small>

          </div>


          {/* GRAVITY */}

          <div
            className="
              flex
              flex-col
              justify-center
              border-b
              border-white/20
              px-[18px]
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
              GRAVITY
            </span>

            <strong
              className="
                font-['Michroma']
                text-[25px]
                font-normal
                text-white/90

                max-lg:text-[20px]
              "
            >
              {gravity.toFixed(2)}
            </strong>

            <small
              className="
                text-[9px]
                text-white/45
              "
            >
              m/s²
            </small>

          </div>


          {/* DENSITY */}

          <div
            className="
              flex
              flex-col
              justify-center
              border-r
              border-white/20
              px-[18px]
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
              DENSITY
            </span>

            <strong
              className="
                font-['Michroma']
                text-[25px]
                font-normal
                text-white/90

                max-lg:text-[20px]
              "
            >
              {density.toLocaleString()}
            </strong>

            <small
              className="
                text-[9px]
                text-white/45
              "
            >
              kg/m³
            </small>

          </div>


          {/* INCLINATION */}

          <div
            className="
              flex
              flex-col
              justify-center
              px-[18px]
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
              INCLINATION
            </span>

            <strong
              className="
                font-['Michroma']
                text-[25px]
                font-normal
                text-white/90

                max-lg:text-[20px]
              "
            >
              {inclination.toFixed(2)}
            </strong>

            <small
              className="
                text-[9px]
                text-white/45
              "
            >
              degrees
            </small>

          </div>

        </div>


        {/* =================================================
            PHASE CONTROLS
        ================================================= */}

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
              border-white/20
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
              border-white/20
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


      {/* =====================================================
          MOBILE TECHNICAL PANEL
      ===================================================== */}

      <div
        className="
          absolute
          bottom-[2%]
          left-[6vw]
          right-[6vw]
          z-30

          hidden

          max-md:grid
          max-md:grid-cols-2
          max-md:border-t
          max-md:border-white/20
        "
      >

        {/* DIAMETER */}

        <div
          className="
            flex
            min-h-[65px]
            flex-col
            justify-center
            border-b
            border-r
            border-white/20
            px-3
            py-2
          "
        >

          <span
            className="
              text-[7px]
              tracking-[1px]
              text-white/45
            "
          >
            DIAMETER
          </span>

          <strong
            className="
              font-['Michroma']
              text-[17px]
              font-normal
              text-white/90
            "
          >
            {diameter.toLocaleString()}
          </strong>

          <small
            className="
              text-[7px]
              text-white/40
            "
          >
            Km
          </small>

        </div>


        {/* GRAVITY */}

        <div
          className="
            flex
            min-h-[65px]
            flex-col
            justify-center
            border-b
            border-white/20
            px-3
            py-2
          "
        >

          <span
            className="
              text-[7px]
              tracking-[1px]
              text-white/45
            "
          >
            GRAVITY
          </span>

          <strong
            className="
              font-['Michroma']
              text-[17px]
              font-normal
              text-white/90
            "
          >
            {gravity.toFixed(2)}
          </strong>

          <small
            className="
              text-[7px]
              text-white/40
            "
          >
            m/s²
          </small>

        </div>


        {/* DENSITY */}

        <div
          className="
            flex
            min-h-[65px]
            flex-col
            justify-center
            border-r
            border-white/20
            px-3
            py-2
          "
        >

          <span
            className="
              text-[7px]
              tracking-[1px]
              text-white/45
            "
          >
            DENSITY
          </span>

          <strong
            className="
              font-['Michroma']
              text-[17px]
              font-normal
              text-white/90
            "
          >
            {density.toLocaleString()}
          </strong>

          <small
            className="
              text-[7px]
              text-white/40
            "
          >
            kg/m³
          </small>

        </div>


        {/* INCLINATION */}

        <div
          className="
            flex
            min-h-[65px]
            flex-col
            justify-center
            px-3
            py-2
          "
        >

          <span
            className="
              text-[7px]
              tracking-[1px]
              text-white/45
            "
          >
            INCLINATION
          </span>

          <strong
            className="
              font-['Michroma']
              text-[17px]
              font-normal
              text-white/90
            "
          >
            {inclination.toFixed(2)}
          </strong>

          <small
            className="
              text-[7px]
              text-white/40
            "
          >
            degrees
          </small>

        </div>

      </div>


      {/* =====================================================
          DRAG HINT
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          right-[10%]
          top-[28%]
          z-30
          text-[9px]
          text-white/40

          max-md:hidden
        "
      >
        ↻ &nbsp; Drag to rotate
      </div>

    </section>
  );
}