import React, { useState } from 'react';
import type { NeighbourhoodCrop, AppMode } from '../types';
import { Navigation, Mountain, Snowflake } from 'lucide-react';

interface NeighbourhoodMapProps {
  crop: NeighbourhoodCrop;
  siteLat: number;
  siteLon: number;
  siteName: string;
  mode: AppMode;
}

export const NeighbourhoodMap: React.FC<NeighbourhoodMapProps> = ({
  crop,
  siteLat,
  siteLon,
  siteName,
  mode,
}) => {
  const [hoverCoord, setHoverCoord] = useState<{ r: number; c: number; pct: number } | null>(null);

  const gridSize = crop.grid_size;
  const centerR = Math.floor(gridSize / 2);
  const centerC = Math.floor(gridSize / 2);
  const sitePct = crop.grid[centerR]?.[centerC] || 75;

  const getCellColor = (pct: number) => {
    // PGDA 69 colormap: 0% dark navy/black (PSR), 1-50% blue/teal, 50-80% gold/amber, 80-100% bright yellow/white
    if (pct < 5) return '#050a14'; // Permanent Shadow (PSR)
    if (pct < 30) return '#1e3a8a';
    if (pct < 60) return '#0284c7';
    if (pct < 80) return '#d97706';
    if (pct < 90) return '#eab308';
    return '#fef08a';
  };

  // Distance calculation from center in meters (6000m total / gridSize)
  const cellMeters = (crop.width_km * 1000) / gridSize;

  const hoverDelta = hoverCoord
    ? {
        distMeters: Math.round(
          Math.sqrt(
            Math.pow((hoverCoord.c - centerC) * cellMeters, 2) +
            Math.pow((hoverCoord.r - centerR) * cellMeters, 2)
          )
        ),
        pctDiff: hoverCoord.pct - sitePct,
      }
    : null;

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mountain size={20} color="#38bdf8" />
              6×6 km Polar Neighbourhood Map (NASA PGDA 69)
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8' }}>
              {siteName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            18.6-year average sunlight raster (Mazarico et al. 2011). {mode === 'plan' ? 'Precision LOLA PGDA 69 grid' : 'Where are the best few hundred metres nearby?'}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>Sunlight %:</span>
          <div style={{ display: 'flex', borderRadius: '3px', overflow: 'hidden', height: '12px', width: '90px' }}>
            <div style={{ flex: 1, background: '#050a14' }} title="0% (PSR)" />
            <div style={{ flex: 1, background: '#1e3a8a' }} title="20%" />
            <div style={{ flex: 1, background: '#0284c7' }} title="50%" />
            <div style={{ flex: 1, background: '#d97706' }} title="75%" />
            <div style={{ flex: 1, background: '#fef08a' }} title="90%+" />
          </div>
          <span style={{ color: '#cbd5e1' }}>0% → 95%</span>
        </div>
      </div>

      {/* Grid Canvas Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '14px', alignItems: 'center' }}>
        
        {/* Heatmap Matrix */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxHeight: '320px', background: '#020617', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: '100%',
              height: '100%',
            }}
          >
            {crop.grid.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHoverCoord({ r, c, pct: val })}
                  onMouseLeave={() => setHoverCoord(null)}
                  style={{
                    backgroundColor: getCellColor(val),
                    cursor: 'crosshair',
                  }}
                />
              ))
            )}
          </div>

          {/* Range rings centered on lander (1 km, 2 km) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${(2000 / 6000) * 100}%`,
              height: `${(2000 / 6000) * 100}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px dashed rgba(255, 255, 255, 0.3)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${(4000 / 6000) * 100}%`,
              height: `${(4000 / 6000) * 100}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              pointerEvents: 'none',
            }}
          />

          {/* Center Lander Pin */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
          </div>

          {/* Scale bar indicator */}
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15, 23, 42, 0.85)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#cbd5e1' }}>
            6 km × 6 km Field of View
          </div>
        </div>

        {/* Info & Relocation Recommendation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Designated Landing Site</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', margin: '2px 0' }}>
              {sitePct}% Avg Sunlight
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Lat {siteLat.toFixed(2)}°, Lon {siteLon.toFixed(2)}°
            </div>
          </div>

          {hoverDelta ? (
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Navigation size={13} color="#38bdf8" />
                Hovered Location
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: hoverCoord?.pct && hoverCoord.pct < 5 ? '#93c5fd' : '#f8fafc', margin: '3px 0' }}>
                {hoverCoord?.pct}% Avg Sunlight
              </div>
              <div style={{ fontSize: '0.78rem', color: hoverDelta.pctDiff >= 0 ? '#4ade80' : '#f87171' }}>
                {hoverDelta.pctDiff > 0 ? `+${hoverDelta.pctDiff}% gain` : `${hoverDelta.pctDiff}% loss`} vs current site
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                Offset: <strong>{hoverDelta.distMeters} m</strong> away
              </div>
              {hoverCoord && hoverCoord.pct < 5 && (
                <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Snowflake size={12} />
                  Permanently Shadowed Region (Ice Target)
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', fontSize: '0.75rem', color: '#94a3b8' }}>
              Hover over nearby terrain on the map to evaluate alternative touchdown spots within 3 km.
            </div>
          )}

          <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', lineHeight: 1.4 }}>
            *Terrain differences of just a few hundred metres at the lunar south pole can alter illumination by over 20 percentage points due to grazing solar incidence.
          </div>
        </div>

      </div>
    </div>
  );
};
