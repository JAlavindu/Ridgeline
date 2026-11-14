import { useState, useEffect, useLayoutEffect, useRef } from "react";
import type { MouseEvent } from "react";
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

// Only Chromium renders SVG filters inside backdrop-filter (the refraction).
// navigator.userAgentData exists only in Chromium browsers, so it is a cheap test.
// Safari and Firefox keep the plain blur.
const supportsRefraction =
  typeof navigator !== "undefined" && "userAgentData" in navigator;

export default function MoonNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  // =========================================================
  // AUTO-HIDE: visible always on home; on other pages
  // collapses to a slim hover-reveal pill
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
  const glassState = routeFlash ? "flash" : expanded ? "expanded" : "collapsed";

  // =========================================================
  // SLIDING LENS: measure the active link and move the
  // glass droplet behind it
  // =========================================================
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lens, setLens] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = menuItems.findIndex((item) =>
    item.link === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.link)
  );

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const el = linkRefs.current[activeIndex];
      setLens(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };

    measure();
    // Re-measure when the nav resizes (window resize, web font finishing loading)
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activeIndex]);

  // =========================================================
  // SPECULAR HIGHLIGHT: follows the pointer horizontally.
  // Writes a CSS variable directly, so no React re-render.
  // =========================================================
  const headerRef = useRef<HTMLElement>(null);

  const handlePointerMove = (e: MouseEvent<HTMLElement>) => {
    const el = headerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    el.style.setProperty("--mx", `${x}%`);
  };

  return (
    <>
    {/* Scroll-edge fade: softens page content as it slides under the pill */}
    <div aria-hidden="true" className="lg-scroll-edge z-[210]" />

    <header
      ref={headerRef}
      data-state={glassState}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        headerRef.current?.style.setProperty("--mx", "50%");
      }}
      onMouseMove={handlePointerMove}
      className={`
        liquid-glass
        ${supportsRefraction ? "lg-refract" : ""}

        fixed
        left-3
        right-3
        top-3
        z-[220]
        md:left-[6vw]
        md:right-[6vw]

        flex
        items-center
        justify-between

        rounded-full

        px-4
        md:px-7

        ${expanded ? "py-2.5" : "py-1.5"}
      `}
    >

      {/* =====================================================
          REFRACTION FILTER — gently warps what is behind the glass
          (used by .lg-refract in index.css)
      ===================================================== */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <filter id="lg-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="1" seed="4" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>


      {/* =====================================================
          LOGO
      ===================================================== */}

      <button
        type="button"
        onClick={() => navigate("/")}
        className="
          font-['Michroma']
          text-[13px]
          tracking-[2px]
          text-white

          transition-[opacity,transform]
          duration-200
          hover:opacity-70
          active:scale-95

          md:text-[15px]
          md:tracking-[2.5px]
        "
      >
        RIDGE
        <span className="ml-1 text-white/40">LINE</span>
      </button>


      {/* =====================================================
          NAV LINKS + SLIDING GLASS LENS
      ===================================================== */}

      <nav ref={navRef} aria-label="Main" className="relative flex items-center gap-0.5 md:gap-1">

        <span
          aria-hidden="true"
          className="lg-lens"
          style={{
            transform: `translateX(${lens?.left ?? 0}px)`,
            width: lens?.width ?? 0,
            opacity: lens ? 1 : 0,
          }}
        />

        {menuItems.map((item, i) => {
          const isActive = i === activeIndex;

          return (
            <button
              key={item.number}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              type="button"
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              onClick={() => navigate(item.link)}
              className={`
                relative
                rounded-full

                px-3
                py-1.5
                md:px-4

                font-['Michroma']
                text-[10px]
                uppercase
                tracking-[1.5px]
                md:text-[12px]
                md:tracking-[2.5px]

                transition-[color,transform]
                duration-200
                active:scale-95

                ${
                  isActive
                    ? "text-[#ff3b12]"
                    : "text-white/60 hover:text-white"
                }
              `}
            >
              {item.label}
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
          text-white/40

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
    </>
  );
}
