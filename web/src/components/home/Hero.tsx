import MoonHero from "./MoonHero";

export default function Hero() {
  return (
    <section className="hero">

      {/* Navigation */}
      <header className="hero-nav">

        <div className="logo">
          RIDGELINE
        </div>

        <nav className="hero-links" aria-label="Main navigation">

          <a href="#interactive-moon">
            Explore
          </a>

          <a href="#south-pole">
            Plan
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

        </nav>

        <button
          className="menu-button"
          type="button"
          aria-label="Open menu"
        >
          ☰
        </button>

      </header>


      {/* Hero content */}
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
            href="#interactive-moon"
            className="primary-button"
          >
            Explore the Moon
          </a>

          <a
            href="#south-pole"
            className="secondary-button"
          >
            Plan a Mission
          </a>

        </div>

      </div>


      {/* 3D Moon */}
      <div className="hero-moon">
        <MoonHero />
      </div>


      {/* Data labels */}
      <div className="hero-bottom">

        <span>NASA Data</span>

        <span>3D Terrain</span>

        <span>Sunlight</span>

        <span>Earth Visibility</span>

      </div>

    </section>
  );
}