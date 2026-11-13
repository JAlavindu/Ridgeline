import React, { useState, useMemo, useEffect } from 'react';
import {
  SAMPLE_SITES,
  generateHorizonMask,
  computeSkyState,
  computeCountdowns,
  generateTimelineHours,
  generateSlipData,
  generate3DTile,
  generateNeighbourhoodCrop,
} from '../utils/mockData';
import {
  Panorama,
  Timelines,
  SolarElevationReadout,
  SlipChart,
  SiteExplorer3D,
  NeighbourhoodMap,
  ExploreExplainer,
} from '../charts';
import type { AppMode, HorizonMask, Site } from '../types';
import { Moon, Rocket, Eye, Terminal } from 'lucide-react';

export const Navigator: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(SAMPLE_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('connecting_ridge');
  const [mode, setMode] = useState<AppMode>('explore');
  const [hoursOffset, setHoursOffset] = useState<number>(12);
  const [slipDays, setSlipDays] = useState<number>(0);
  const [loadedMask, setLoadedMask] = useState<HorizonMask | null>(null);

  // Fetch full sites catalog from M6 data
  useEffect(() => {
    let isMounted = true;
    async function loadSites() {
      try {
        const res = await fetch('/data/sites.json');
        if (res.ok) {
          const data: Site[] = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setSites(data);
          }
        }
      } catch {
        // Fall back to SAMPLE_SITES
      }
    }
    loadSites();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active Site
  const activeSite = useMemo(() => {
    return sites.find((s) => s.id === selectedSiteId) || sites[0] || SAMPLE_SITES[0];
  }, [sites, selectedSiteId]);

  // Load real mask JSON if available (from M3 terrain outputs)
  useEffect(() => {
    let isMounted = true;
    const candidates = [
      `/data/masks/${activeSite.id}.json`,
      `/data/masks/test_${activeSite.id}.json`,
    ];

    async function loadMask() {
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data: HorizonMask = await res.json();
            if (isMounted && data.elev_deg && data.elev_deg.length > 0) {
              setLoadedMask(data);
              return;
            }
          }
        } catch {
          // Continue to next candidate
        }
      }
      if (isMounted) {
        setLoadedMask(null);
      }
    }

    loadMask();
    return () => {
      isMounted = false;
    };
  }, [activeSite.id]);

  // Derived datasets for visualization components
  const mask = useMemo(() => loadedMask || generateHorizonMask(activeSite), [loadedMask, activeSite]);
  const skyState = useMemo(() => computeSkyState(activeSite, hoursOffset, mask), [activeSite, hoursOffset, mask]);
  const countdowns = useMemo(() => computeCountdowns(activeSite, hoursOffset, mask), [activeSite, hoursOffset, mask]);
  const timelineData = useMemo(() => generateTimelineHours(activeSite, mask, 0, 360), [activeSite, mask]);
  const slipData = useMemo(() => generateSlipData(activeSite), [activeSite]);
  const tile3D = useMemo(() => generate3DTile(activeSite), [activeSite]);
  const neighbourhoodCrop = useMemo(() => generateNeighbourhoodCrop(activeSite), [activeSite]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #1e293b', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
            <Moon size={24} color="#0b1120" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', color: '#f8fafc' }}>
              Ridgeline <span style={{ color: '#38bdf8', fontWeight: 400 }}>| Lunar Landing Site Navigator</span>
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              NASA Space Apps Challenge 2026 • Visualization Engineer Module (M4)
            </p>
          </div>
        </div>

        {/* Site Selector & Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Site Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Rocket size={16} color="#38bdf8" />
            <select
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setHoursOffset(0);
                setSlipDays(0);
              }}
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.lat.toFixed(1)}° Lat)
                </option>
              ))}
            </select>
            {loadedMask && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '6px', padding: '4px 8px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                DEM Mask: {loadedMask.az_step_deg}° ({loadedMask.elev_deg.length} pts)
              </span>
            )}
          </div>

          {/* Mode Switch (Explore vs Plan) */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '3px', border: '1px solid #334155' }}>
            <button
              onClick={() => setMode('explore')}
              style={{
                background: mode === 'explore' ? '#2563eb' : 'transparent',
                color: mode === 'explore' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: mode === 'explore' ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Eye size={14} />
              Explore Mode
            </button>
            <button
              onClick={() => setMode('plan')}
              style={{
                background: mode === 'plan' ? '#2563eb' : 'transparent',
                color: mode === 'plan' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: mode === 'plan' ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Terminal size={14} />
              Plan Mode (Eng)
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Row 1: Now Panel (Solar Elevation Readout + Uncertainty Windows F8) */}
        <SolarElevationReadout
          skyState={skyState}
          countdowns={countdowns}
          siteLat={activeSite.lat}
          siteName={activeSite.name}
          mode={mode}
        />

        {/* Row 2: 360° Horizon Skyline Panorama */}
        <Panorama
          mask={mask}
          skyState={skyState}
          hoursOffset={hoursOffset}
          onHoursChange={setHoursOffset}
          mode={mode}
          siteName={activeSite.name}
        />

        {/* Row 3: Timelines (Multi-layer Sunlit, DTE contact, Eclipse) */}
        <Timelines
          timelineData={timelineData}
          currentHoursOffset={hoursOffset}
          onSelectHours={setHoursOffset}
          siteName={activeSite.name}
          mode={mode}
        />

        {/* Row 4: Two Columns (3D Site Explorer & Neighbourhood Map) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
          <SiteExplorer3D
            tileData={tile3D}
            skyState={skyState}
            siteName={activeSite.name}
            mode={mode}
          />
          <NeighbourhoodMap
            crop={neighbourhoodCrop}
            siteLat={activeSite.lat}
            siteLon={activeSite.lon}
            siteName={activeSite.name}
            mode={mode}
          />
        </div>

        {/* Row 5: Launch-Slip Scenario Chart */}
        <SlipChart
          slipData={slipData}
          currentSlipDays={slipDays}
          onSlipChange={setSlipDays}
          siteName={activeSite.name}
          mode={mode}
        />

        {/* Row 6: Explore Mode Explainer (Moon vs Earth, F18) */}
        <ExploreExplainer
          siteLat={activeSite.lat}
          siteLon={activeSite.lon}
        />

      </div>

      {/* Footer */}
      <footer style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span>Verified against JPL Horizons & NASA PGDA (69, 78, 90). Reference Sphere: 1737.4 km (MOON_ME).</span>
        </div>
        <div>
          <span>Role M4 — Visualization Engineer Delivery</span>
        </div>
      </footer>
    </div>
  );
};

export default Navigator;
