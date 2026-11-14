import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  {
    number: "01",
    label: "HOME",
    ariaLabel: "Go to home page",
    link: "/",
  },
  {
    number: "02",
    label: "EXPLORE MOON",
    ariaLabel: "Explore the Moon",
    link: "/terrain",
  },
  {
    number: "03",
    label: "TEAM",
    ariaLabel: "Meet the team",
    link: "/team",
  },
];

export default function MoonNav() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <>
      {/* =====================================================
          MENU / CLOSE BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="
          fixed
          right-6
          top-6
          z-[220]

          flex
          items-center
          gap-4

          bg-white
          px-5
          py-3

          text-[10px]
          font-medium
          tracking-[2px]
          text-black

          transition-all
          duration-300

          hover:bg-[#ff3b12]
          hover:text-white

          md:right-[7.5vw]
          md:top-7
        "
      >
        {open ? (
          <>
            CLOSE

            <span
              className="
                text-[16px]
                leading-none
              "
            >
              ×
            </span>
          </>
        ) : (
          <>
            MENU

            <span
              className="
                text-[13px]
                leading-none
              "
            >
              ☰
            </span>
          </>
        )}
      </button>


      {/* =====================================================
          BACKDROP
      ===================================================== */}

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`
          fixed
          inset-0
          z-[150]

          bg-black/70
          backdrop-blur-[3px]

          transition-all
          duration-500

          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />


      {/* =====================================================
          RIGHT SIDE NAVIGATION PANEL
      ===================================================== */}

      <aside
        aria-hidden={!open}
        className={`
          fixed
          right-0
          top-0
          z-[180]

          h-screen
          w-full

          overflow-hidden

          bg-[#020202]
          text-white

          shadow-[-20px_0_80px_rgba(0,0,0,0.55)]

          transition-transform
          duration-700
          ease-[cubic-bezier(0.76,0,0.24,1)]

          sm:w-[520px]
          lg:w-[600px]

          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >

        {/* ===================================================
            SPACE BACKGROUND
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0

            bg-cover
            bg-center
            bg-no-repeat

            opacity-25
          "
          style={{
            backgroundImage:
              "url('/images/space-background.jpg')",
          }}
        />


        {/* ===================================================
            DARK OVERLAY
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-black/85
          "
        />


        {/* ===================================================
            TECHNICAL GRID
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0

            opacity-[0.08]

            bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)]

            bg-[size:80px_80px]
          "
        />


        {/* ===================================================
            ORANGE LEFT EDGE
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-0
            top-0

            h-full
            w-px

            bg-[#ff3b12]
          "
        />


        {/* ===================================================
            PANEL CONTENT
        =================================================== */}

        <div
          className="
            relative
            flex
            h-full
            flex-col

            px-8
            py-7

            sm:px-10

            lg:px-14
          "
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >

            {/* LOGO */}

            <div
              className="
                font-['Michroma']
                text-[13px]
                tracking-[2px]
              "
            >
            RIDGE

              <span
                className="
                  ml-1
                  text-white/40
                "
              >
                LINE
              </span>
            </div>

          </div>


          {/* =================================================
              SMALL SECTION LABEL
          ================================================= */}

          <div
            className="
              mt-20

              text-[8px]
              uppercase
              tracking-[5px]

              text-white/35
            "
          >
            LUNAR NAVIGATOR
          </div>


          {/* =================================================
              NAVIGATION ITEMS
          ================================================= */}

          <nav
            className="
              mt-8
              flex
              flex-col
            "
          >

            {menuItems.map((item) => {
              const isActive =
                item.link === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.link);

              return (
                <button
                  key={item.number}
                  type="button"
                  aria-label={item.ariaLabel}
                  onClick={() =>
                    handleNavigation(item.link)
                  }
                  className="
                    group

                    relative
                    flex
                    items-start

                    border-b
                    border-white/[0.08]

                    py-5

                    text-left

                    transition-all
                    duration-300
                  "
                >

                  {/* =========================================
                      NUMBER
                  ========================================= */}

                  <span
                    className={`
                      mt-2

                      w-12
                      shrink-0

                      font-['Michroma']
                      text-[9px]
                      tracking-[1px]

                      transition-colors
                      duration-300

                      ${
                        isActive
                          ? "text-[#ff3b12]"
                          : "text-white/25 group-hover:text-[#ff3b12]"
                      }
                    `}
                  >
                    {item.number}
                  </span>


                  {/* =========================================
                      LABEL
                  ========================================= */}

                  <span
                    className={`
                      max-w-[430px]

                      font-['Michroma']
                      text-[clamp(32px,5vw,64px)]
                      font-light
                      uppercase

                      leading-[0.9]
                      tracking-[-2px]

                      transition-all
                      duration-500

                      ${
                        isActive
                          ? "text-white"
                          : "text-white/50 group-hover:translate-x-3 group-hover:text-white"
                      }
                    `}
                  >
                    {item.label}
                  </span>


                  {/* =========================================
                      ARROW
                  ========================================= */}

                  <span
                    className="
                      ml-auto
                      mt-3
                      shrink-0

                      text-[18px]
                      text-white/20

                      transition-all
                      duration-300

                      group-hover:translate-x-1
                      group-hover:text-[#ff3b12]
                    "
                  >
                    ↗
                  </span>

                </button>
              );
            })}

          </nav>


          {/* =================================================
              BOTTOM MISSION INFORMATION
          ================================================= */}

          <div
            className="
              mt-auto

              border-t
              border-white/10

              pt-5
            "
          >

            <div
              className="
                flex
                items-end
                justify-between
              "
            >

              {/* MISSION */}

              <div>

                <div
                  className="
                    text-[7px]
                    uppercase
                    tracking-[3px]
                    text-white/30
                  "
                >
                  MISSION
                </div>

                <div
                  className="
                    mt-2

                    font-['Michroma']
                    text-[11px]
                    tracking-[1px]

                    text-white/80
                  "
                >
                  LUNAR SOUTH POLE
                </div>

              </div>


              {/* STATUS */}

              <div
                className="
                  text-right
                "
              >

                <div
                  className="
                    text-[7px]
                    uppercase
                    tracking-[3px]

                    text-white/30
                  "
                >
                  STATUS
                </div>

                <div
                  className="
                    mt-2

                    flex
                    items-center
                    justify-end
                    gap-2

                    text-[8px]
                    tracking-[1px]

                    text-white/60
                  "
                >

                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-[#ff3b12]
                    "
                  />

                  EXPLORING

                </div>

              </div>

            </div>


            {/* BOTTOM LINE */}

            <div
              className="
                mt-5

                flex
                items-center
                justify-between

                text-[7px]
                tracking-[2px]

                text-white/20
              "
            >
              <span>
                RIDGE LINE
              </span>

              <span>
                2026
              </span>
            </div>

          </div>

        </div>

      </aside>
    </>
  );
}