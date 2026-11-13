import React, { useState } from 'react';
import { Sun, Globe, Sparkles } from 'lucide-react';

interface ExploreExplainerProps {
  siteLat: number;
  siteLon: number;
}

export const ExploreExplainer: React.FC<ExploreExplainerProps> = ({ siteLat, siteLon }) => {
  const [activeTab, setActiveTab] = useState<'day_cycle' | 'libration'>('libration');

  const isPolar = Math.abs(siteLat) > 75;

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#fbbf24" />
              Explore Mode — 30-Second "Moon vs Earth" Explainer (Diff 7)
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8' }}>
              Public & Educator Guide
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Why does the Moon have 29.5-day days? And why doesn't Earth rise and set every day?
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '6px', background: '#020617', padding: '3px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setActiveTab('libration')}
            style={{
              background: activeTab === 'libration' ? '#2563eb' : 'transparent',
              color: activeTab === 'libration' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'libration' ? 600 : 400,
            }}
          >
            Earth Libration Box
          </button>
          <button
            onClick={() => setActiveTab('day_cycle')}
            style={{
              background: activeTab === 'day_cycle' ? '#2563eb' : 'transparent',
              color: activeTab === 'day_cycle' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: activeTab === 'day_cycle' ? 600 : 400,
            }}
          >
            29.5-Day Synodic Day
          </button>
        </div>
      </div>

      {/* Tab 1: Earth Libration Explainer */}
      {activeTab === 'libration' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          
          {/* Visual Canvas of Libration Box */}
          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
              Earth's Motion in the Lunar Sky (Libration Box)
            </div>

            <div style={{ position: 'relative', width: '220px', height: '180px', margin: '0 auto', border: '2px dashed #38bdf8', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.05)' }}>
              
              {/* Box Dimension Labels */}
              <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#38bdf8' }}>
                ±8.16° East–West
              </span>
              <span style={{ position: 'absolute', right: '-24px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '0.7rem', color: '#38bdf8' }}>
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
                {/* Earth Marker */}
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

      {/* Tab 2: 29.5-Day Day Cycle Explainer */}
      {activeTab === 'day_cycle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          
          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
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
                <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Earth + Moon Orbit</span>
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
              At the South Pole, however, high ridges catch skimming sunlight for months at a time, creating "peaks of eternal light" critical for solar landers.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
