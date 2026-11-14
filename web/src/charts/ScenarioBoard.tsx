import React, { useMemo } from 'react';
import type { Site, HorizonMask, AppMode } from '../types';
import {
  generateHorizonMask,
  computeSkyState,
  generateTimelineHours,
} from '../utils/mockData';
import { X, Sun, Wifi, ShieldCheck, Flame, Moon } from 'lucide-react';

interface ScenarioBoardProps {
  allSites: Site[];
  comparedSiteIds: string[];
  onAddSite: (siteId: string) => void;
  onRemoveSite: (siteId: string) => void;
  onSelectPrimary: (siteId: string) => void;
  hoursOffset: number;
  mode: AppMode;
  masksCache: Record<string, HorizonMask>;
}

export const ScenarioBoard: React.FC<ScenarioBoardProps> = ({
  allSites,
  comparedSiteIds,
  onAddSite,
  onRemoveSite,
  onSelectPrimary,
  hoursOffset,
  masksCache,
}) => {
  // Available sites that haven't been added yet
  const availableSites = useMemo(() => {
    return allSites.filter((s) => !comparedSiteIds.includes(s.id));
  }, [allSites, comparedSiteIds]);

  // Compute metrics for each compared site
  const siteCardsData = useMemo(() => {
    return comparedSiteIds.map((id) => {
      const site = allSites.find((s) => s.id === id) || allSites[0];
      const mask = masksCache[id] || generateHorizonMask(site);
      const skyState = computeSkyState(site, hoursOffset, mask);
      const timeline = generateTimelineHours(site, mask, 0, 360);

      const totalHours = timeline.length;
      const sunlitHours = timeline.filter((h) => h.is_sunlit || h.is_partial).length;
      const earthHours = timeline.filter((h) => h.is_earth_visible).length;
      const bothHours = timeline.filter((h) => h.is_both).length;

      const sunlitPct = Math.round((sunlitHours / totalHours) * 100);
      const earthPct = Math.round((earthHours / totalHours) * 100);
      const bothPct = Math.round((bothHours / totalHours) * 100);

      // Find longest consecutive dark stretch (hours)
      let maxDarkSteps = 0;
      let currDarkSteps = 0;
      for (const h of timeline) {
        if (h.is_dark) {
          currDarkSteps += 2; // each step is 2 hours
          if (currDarkSteps > maxDarkSteps) maxDarkSteps = currDarkSteps;
        } else {
          currDarkSteps = 0;
        }
      }

      // Find longest comms gap (hours)
      let maxCommsGap = 0;
      let currCommsGap = 0;
      for (const h of timeline) {
        if (!h.is_earth_visible) {
          currCommsGap += 2;
          if (currCommsGap > maxCommsGap) maxCommsGap = currCommsGap;
        } else {
          currCommsGap = 0;
        }
      }

      return {
        site,
        skyState,
        timeline,
        sunlitPct,
        earthPct,
        bothPct,
        longestNightHours: maxDarkSteps,
        longestCommsGap: maxCommsGap,
      };
    });
  }, [comparedSiteIds, allSites, masksCache, hoursOffset]);

  return (
    <div style={{ background: '#040404', border: '1px solid rgba(255, 255, 255, 0.12)', padding: '20px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9' }}>
              Compare Landing Sites Side-by-Side
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#141414', color: '#ff4d2b', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              Comparing {comparedSiteIds.length} of 4 Sites
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Compare multiple locations at once to see which site offers the most sunlight, best Earth radio connection, and shortest freezing darkness stretches.
          </p>
        </div>

        {/* Add Site Selector */}
        {comparedSiteIds.length < 4 && availableSites.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Add Another Site:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onAddSite(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              style={{
                background: '#0a0a0a',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>Select a site to compare...</option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.lat.toFixed(1)}°S)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Side-by-Side Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${comparedSiteIds.length <= 2 ? '360px' : '280px'}, 1fr))`,
          gap: '16px',
        }}
      >
        {siteCardsData.map(({ site, skyState, timeline, sunlitPct, earthPct, bothPct, longestNightHours, longestCommsGap }) => {
          return (
            <div
              key={site.id}
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#ff4d2b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      {site.program}
                    </span>
                    <h4 style={{ margin: '2px 0 0', fontSize: '0.98rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.25 }}>
                      {site.name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {site.lat.toFixed(2)}° Lat • {site.lon.toFixed(2)}° Lon
                    </span>
                  </div>

                  {comparedSiteIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSite(site.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Remove card"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Key Metric Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', margin: '14px 0', textAlign: 'center' }}>
                  <div style={{ background: '#000', padding: '8px 4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Sun size={11} color="#f59e0b" />
                      <span>Sunlit</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                      {sunlitPct}%
                    </div>
                  </div>

                  <div style={{ background: '#000', padding: '8px 4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <Wifi size={11} color="#38bdf8" />
                      <span>Earth Connected</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                      {earthPct}%
                    </div>
                  </div>

                  <div style={{ background: '#000', padding: '8px 4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <ShieldCheck size={11} color="#10b981" />
                      <span>Best Time (Both)</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                      {bothPct}%
                    </div>
                  </div>
                </div>

                {/* Secondary Physics Parameters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', marginBottom: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Moon size={11} /> Longest Night (Battery Size):
                    </span>
                    <strong style={{ color: longestNightHours > 48 ? '#f87171' : '#f8fafc' }}>
                      {longestNightHours} hours
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wifi size={11} /> Longest Comms Blackout:
                    </span>
                    <strong style={{ color: longestCommsGap > 48 ? '#f87171' : '#f8fafc' }}>
                      {longestCommsGap} hours
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={11} /> Direct Solar Flux:
                    </span>
                    <strong style={{ color: '#f8fafc' }}>
                      {skyState.solar_flux_w_m2} W/m²
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span style={{ color: '#94a3b8' }}>Sun / Earth Elevation:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      ☉ {skyState.sun.el_deg > 0 ? `+${skyState.sun.el_deg.toFixed(1)}°` : `${skyState.sun.el_deg.toFixed(1)}°`} / ♁ {skyState.earth.el_deg.toFixed(1)}°
                    </span>
                  </div>
                </div>

                {/* Mini Viable Windows Timeline Strip */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '3px' }}>
                    <span>15-Day Viable Operational Windows</span>
                    <span>Green = Sun+DTE</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      height: '14px',
                      background: '#000',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    {timeline.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          background: h.is_both ? '#10b981' : (h.is_sunlit || h.is_partial) ? '#d97706' : '#050505',
                        }}
                        title={`Hour ${idx * 2}: Sun ${!h.is_dark ? 'YES' : 'NO'}, Earth ${h.is_earth_visible ? 'YES' : 'NO'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Inspect in Full Visualizer Button */}
              <button
                type="button"
                onClick={() => onSelectPrimary(site.id)}
                style={{
                  width: '100%',
                  background: '#141414',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                  padding: '7px',
                  fontSize: '0.75rem',
                  fontFamily: 'Michroma, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ff3d18')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#141414')}
              >
                Inspect in 3D & Skyline →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
