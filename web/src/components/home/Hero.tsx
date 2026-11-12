import MoonHero from "./MoonHero";

export default function Hero() {
  return (
    <section className="hero">

      {/* =========================
          NAVIGATION
      ========================= */}

      <header className="hero-nav">

        <div className="logo">
          RIDGELINE
        </div>

        <nav>
          <a href="/explore">
            Explore
          </a>

          <a href="/plan">
            Plan
          </a>

          <a href="/how-it-works">
            How It Works
          </a>
        </nav>

        <button
          className="menu-button"
          aria-label="Open menu"
        >
          ☰
        </button>

      </header>


      {/* =========================
          HERO TEXT
      ========================= */}

      <div className="hero-content">

        <p className="hero-eyebrow">
          Lunar Landing Site Navigator
        </p>

        <h1>
          WHERE SHOULD
          <br />
          WE LAND ON
          <br />
          THE MOON?
        </h1>

        <p className="hero-description">
          Explore sunlight, Earth visibility and
          lunar terrain to discover better landing
          opportunities.
        </p>

        <div className="hero-actions">

          <a
            href="/explore"
            className="primary-button"
          >
            Explore the Moon
          </a>

          <a
            href="/plan"
            className="secondary-button"
          >
            Plan a Mission
          </a>

        </div>

      </div>


      {/* =========================
          3D MOON
      ========================= */}

      <div className="moon-container">
        <MoonHero />
      </div>


      {/* =========================
          DATA LABELS
      ========================= */}

      <div className="hero-bottom">

        <span>
          NASA DATA
        </span>

        <span>
          3D TERRAIN
        </span>

        <span>
          SUNLIGHT
        </span>

        <span>
          EARTH VISIBILITY
        </span>

      </div>

    </section>
  );
}