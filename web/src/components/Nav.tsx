import { useState, useEffect, useRef } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  // =========================================================
  // AUTO-HIDE: visible always on home; on other pages
  // collapses to a slim hover-reveal strip
  // =========================================================
  const [hovered, setHovered] = useState(false);
  const [routeFlash, setRouteFlash] = useState(false);
  const prevPath = useRef(location.pathname);

  // Flash the glass glow whenever the route changes
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setRouteFlash(true);
      const t = setTimeout(() => setRouteFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  // Fully expanded when: home page OR hovering
  const expanded = isHome || hovered;

  return (
    <header
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Glass glow border intensifies on route change
        boxShadow: routeFlash
          ? "0 0 0 1px rgba(255,59,18,0.55), 0 4px 32px rgba(255,59,18,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
          : expanded
          ? "0 0 0 1px rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 2px 12px rgba(0,0,0,0.6)",
        transition: "box-shadow 0.4s ease, opacity 0.35s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
      className={`
        fixed
        left-0
        right-0
        top-0
        z-[220]

        flex
        items-center
        justify-between

        border-b

        px-6
        md:px-[7.5vw]

        ${routeFlash
          ? "border-[#ff3b12]/40 bg-[#0a0a0a]/80 backdrop-blur-2xl"
          : expanded
          ? "border-white/[0.10] bg-[#080808]/85 backdrop-blur-2xl"
          : "border-white/[0.04] bg-[#020202]/60 backdrop-blur-md"
        }

        ${expanded ? "py-4 opacity-100" : "py-2 opacity-40 hover:opacity-100"}

        transition-all
        duration-350
        ease-out
      `}
    >

      {/* =====================================================
          GLASS SHEEN — top highlight line
      ===================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* =====================================================
          LOGO
      ===================================================== */}

      <button
        type="button"
        onClick={() => navigate("/")}
        className="
          font-['Michroma']
          text-[15px]
          tracking-[2.5px]
          text-white

          transition-opacity
          duration-200
          hover:opacity-70
        "
      >
        RIDGE
        <span className="ml-1 text-white/40">LINE</span>
      </button>


      {/* =====================================================
          NAV LINKS
      ===================================================== */}

      <nav className="flex items-center gap-7 md:gap-10">
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
              onClick={() => navigate(item.link)}
              className={`
                relative
                font-['Michroma']
                text-[12px]
                uppercase
                tracking-[2.5px]

                transition-colors
                duration-200

                ${
                  isActive
                    ? "text-[#ff3b12]"
                    : "text-white/55 hover:text-white"
                }
              `}
            >
              {item.label}

              {/* Active underline pip */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -bottom-1
                    left-0
                    right-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-[#ff3b12]/80
                    to-transparent
                  "
                />
              )}
            </button>
          );
        })}
      </nav>


      {/* =====================================================
          STATUS INDICATOR
      ===================================================== */}

      <div
        className="
          hidden
          items-center
          gap-2

          text-[9px]
          uppercase
          tracking-[2px]
          text-white/30

          md:flex
        "
      >
        <span
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-[#ff3b12]
            shadow-[0_0_8px_rgba(255,59,18,0.8)]
            animate-pulse
          "
        />
        EXPLORING
      </div>
    </header>
  );
}
