import React, { useState } from 'react';
import { Orbit, Moon, Sun, Globe, ThermometerSnowflake, ShieldAlert, Compass } from 'lucide-react';

interface ExploreExplainerProps {
  siteLat: number;
  siteLon: number;
}

export const ExploreExplainer: React.FC<ExploreExplainerProps> = ({
  siteLat,
  siteLon,
}) => {
  const [activeTab, setActiveTab] = useState<'lunar_vs_earth' | 'libration' | 'day_cycle' | 'polar_sensitivity'>('lunar_vs_earth');
  const isPolar = Math.abs(siteLat) > 75;

  return (
    <div style={{ background: '#040404', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '20px', color: '#f8fafc' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Orbit size={20} color="#ff3d18" />
              Lunar Physics & Operational Education Hub
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#141414', color: '#ff4d2b' }}>
              Public, Educators & Cross-Team Reference
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Explore why the Moon poses extreme operational challenges compared to Earth, and why small changes in landing site or date completely alter mission viability.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: '#000000', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.15)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('lunar_vs_earth')}
            style={{
              background: activeTab === 'lunar_vs_earth' ? '#ff3d18' : 'transparent',
              border: 'none',
              padding: '6px 12px',
              color: activeTab === 'lunar_vs_earth' ? '#fff' : '#94a3b8',
              fontSize: '0.75rem',
              fontFamily: 'Michroma, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ThermometerSnowflake size={13} />
            Moon vs Earth Extremes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('polar_sensitivity')}
            style={{
              background: activeTab === 'polar_sensitivity' ? '#ff3d18' : 'transparent',
              border: 'none',
              padding: '6px 12px',
              color: activeTab === 'polar_sensitivity' ? '#fff' : '#94a3b8',
              fontSize: '0.75rem',
              fontFamily: 'Michroma, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Compass size={13} />
            Why Small Moves Matter
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('libration')}
            style={{
              background: activeTab === 'libration' ? '#ff3d18' : 'transparent',
              border: 'none',
              padding: '6px 12px',
              color: activeTab === 'libration' ? '#fff' : '#94a3b8',
              fontSize: '0.75rem',
              fontFamily: 'Michroma, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Globe size={13} />
            Earth Libration Box
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('day_cycle')}
            style={{
              background: activeTab === 'day_cycle' ? '#ff3d18' : 'transparent',
              border: 'none',
              padding: '6px 12px',
              color: activeTab === 'day_cycle' ? '#fff' : '#94a3b8',
              fontSize: '0.75rem',
              fontFamily: 'Michroma, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sun size={13} />
            29.5-Day Synodic Cycle
          </button>
        </div>
      </div>

      {/* Tab 1: Moon vs Earth Extreme Conditions Matrix */}
      {activeTab === 'lunar_vs_earth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* Condition 1: Day & Night Duration */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#ff4d2b', fontFamily: 'Michroma, sans-serif' }}>DAY / NIGHT CYCLE</span>
                <Moon size={15} color="#fbbf24" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Earth:</span>
                <strong style={{ color: '#f8fafc' }}>24 Hours (12h Day / 12h Night)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Moon:</span>
                <strong style={{ color: '#fbbf24' }}>708.7 Hours (~14.75 Earth Days Night!)</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                A 350-hour freezing night requires landers to carry massive survival batteries or radioisotope heaters.
              </p>
            </div>

            {/* Condition 2: Solar Elevation Angle */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#ff4d2b', fontFamily: 'Michroma, sans-serif' }}>SUN ELEVATION</span>
                <Sun size={15} color="#f59e0b" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Earth (Tropics):</span>
                <strong style={{ color: '#f8fafc' }}>Rises up to 90° Overhead</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Moon South Pole:</span>
                <strong style={{ color: '#f59e0b' }}>Only 1.5° Above Horizon!</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                Solar panels cannot face straight up; they must be mounted vertically on mast cylinders to catch horizontal grazing light.
              </p>
            </div>

            {/* Condition 3: Temperature Extremes */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#ff4d2b', fontFamily: 'Michroma, sans-serif' }}>TEMPERATURE SWING</span>
                <ThermometerSnowflake size={15} color="#38bdf8" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Earth:</span>
                <strong style={{ color: '#f8fafc' }}>-50°C to +50°C (Atmosphere buffer)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Moon Polar:</span>
                <strong style={{ color: '#38bdf8' }}>+120°C in Sun, -246°C in PSR Shadow!</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                Cold-trap craters at the lunar south pole are colder than Pluto; metals become brittle and lubricants freeze instantly.
              </p>
            </div>

            {/* Condition 4: Communication Mechanics */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#ff4d2b', fontFamily: 'Michroma, sans-serif' }}>EARTH CONTACT</span>
                <Globe size={15} color="#4ade80" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Earth:</span>
                <strong style={{ color: '#f8fafc' }}>Global cell / satellite mesh</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Moon South Pole:</span>
                <strong style={{ color: '#4ade80' }}>Earth hangs 2°–10° near the horizon</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                There are no GPS towers on the Moon. If a mountain blocks the line-of-sight to Earth, contact is completely severed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Why Small Location or Date Changes Have Large Impacts */}
      {activeTab === 'polar_sensitivity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldAlert size={18} color="#ff3d18" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontFamily: 'Michroma, sans-serif' }}>
                The "Grazing Geometry" Dilemma
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 10px' }}>
              Because solar rays strike the Lunar South Pole at an angle of less than <strong>2 degrees</strong>, mountains and crater rims cast shadows that stretch <strong>20 to 80 kilometers across the landscape</strong>.
            </p>
            <div style={{ background: '#0a0a0a', borderLeft: '3px solid #ff3d18', padding: '10px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              <strong style={{ color: '#fff' }}>Example:</strong> A small depression just <strong>300 meters</strong> away from a sunlit ridge can be in perpetual shadow with <strong>0% annual sunlight</strong>, while the ridge peak receives <strong>88% continuous sunlight</strong>.
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <h4 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1rem' }}>
              Why Mission Teams Need Rapid Co-Planning
            </h4>
            <p style={{ margin: '0 0 8px' }}>
              <strong>Science vs Engineering Trade-Off:</strong>
              <br />
              • <em>Science teams</em> want to land inside shadowed craters to sample primordial water ice.
              <br />
              • <em>Engineering teams</em> want to land on elevated ridges to guarantee solar power and continuous radio contact.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              <strong>When Schedules Slip:</strong>
              <br />
              If rocket manufacturing slips launch by 14 days, the solar elevation drops by several tenths of a degree. This subtle angle change can submerge the designated landing zone in shadows. This tool gives teams the data to pivot to a backup site in seconds.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Earth Libration Box Explainer */}
      {activeTab === 'libration' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          {/* Visual Canvas of Libration Box */}
          <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
              Earth's Motion in the Lunar Sky (Libration Box)
            </div>

            <div style={{ position: 'relative', width: '220px', height: '180px', margin: '0 auto', border: '2px dashed #38bdf8', borderRadius: '0px', background: 'rgba(56, 189, 248, 0.05)' }}>
              {/* Box Dimension Labels */}
              <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#ff4d2b' }}>
                ±8.16° East–West
              </span>
              <span style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.7rem', color: '#ff4d2b' }}>
                ±6.87° N–S
              </span>

              {/* Libration Lissajous Orbit Path */}
              <svg viewBox="0 0 220 180" style={{ width: '100%', height: '100%' }}>
                <path
                  d="M 110,90 Q 170,40 180,90 T 110,150 T 40,90 T 110,30"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle cx="140" cy="70" r="14" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2" />
                <circle cx="136" cy="67" r="5" fill="#15803d" />
              </svg>

              <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', color: '#64748b' }}>
                Sub-Earth Position (Tidal Lock)
              </div>
            </div>
          </div>

          {/* Explanatory text */}
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <h4 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1rem' }}>
              Why Earth Does Not Rise and Set Like the Sun
            </h4>
            <p style={{ margin: '0 0 8px' }}>
              Because the Moon is <strong>tidally locked</strong> to Earth, the same side of the Moon always faces Earth.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              If you stand in Tranquility Base, Earth hangs motionless high overhead. It does not circle the sky. Instead, orbital eccentricities cause a slow monthly wobble called <strong>libration</strong> (Formula F18: up to <strong>±8.16° E–W</strong> and <strong>±6.87° N–S</strong>).
            </p>
            <p style={{ margin: 0, color: '#bae6fd' }}>
              {isPolar
                ? `At this polar landing site (${siteLat.toFixed(1)}°S, ${siteLon.toFixed(1)}°E), Earth hovers right near the horizon. This wobble causes Earth to periodically dip behind mountain ridges, temporarily cutting direct radio contact!`
                : `At this near-equatorial landing site (${siteLat.toFixed(1)}°N, ${siteLon.toFixed(1)}°E), Earth never sets and provides uninterrupted direct radio contact 24/7.`}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: 29.5-Day Day Cycle Explainer */}
      {activeTab === 'day_cycle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
              Sidereal (27.3d) vs Synodic (29.5d) Lunar Cycle
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '14px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fbbf24', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #fbbf24' }}>
                  <Sun size={26} color="#000" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Sun (Fixed Center)</span>
              </div>

              <div style={{ width: '40px', height: '2px', background: '#334155', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', color: '#64748b' }}>
                  1 AU
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#0284c7', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px #38bdf8' }}>
                  <Globe size={22} color="#fff" />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#ff4d2b' }}>Earth + Moon Orbit</span>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
              Solar speed across lunar sky: <strong>~0.508° per hour</strong> (ω = 360° / 29.53d)
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <h4 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1rem' }}>
              Why a Lunar Day Lasts 29.5 Earth Days
            </h4>
            <p style={{ margin: '0 0 8px' }}>
              The Moon rotates once relative to distant stars in <strong>27.32 days</strong>. But because the Moon travels with Earth around the Sun, it takes an extra <strong>2.2 days</strong> for the Sun to reach the same position in the lunar sky.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              This means:
            </p>
            <ul style={{ margin: '0 0 8px', paddingLeft: '20px' }}>
              <li>Sunrise to sunset is roughly <strong>14.75 Earth days of continuous sunlight</strong>.</li>
              <li>Night is roughly <strong>14.75 Earth days of freezing darkness</strong>.</li>
            </ul>
            <p style={{ margin: 0, color: '#fef08a' }}>
              At the South Pole, however, high ridges catch skimming sunlight for months at a time, creating &quot;peaks of eternal light&quot; critical for solar landers.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
