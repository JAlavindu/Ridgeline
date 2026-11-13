
export default function HeroNav() {
  return (
    <header className="hero-nav">
      <div className="logo">RIDGELINE</div>

      <nav className="hero-links" aria-label="Main navigation">
        <a href="#navigator">EXPLORE</a>
        <a href="#south-pole">SOUTH POLE</a>
        <a href="#how-it-works">HOW IT WORKS</a>
      </nav>

      <button className="menu-button" aria-label="Open menu" type="button">
        ☰
      </button>
    </header>
  );
}
