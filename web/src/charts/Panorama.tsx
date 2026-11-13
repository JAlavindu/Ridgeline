import React, { useMemo, useState } from 'react';
import type { HorizonMask, SkyState, AppMode } from '../types';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface PanoramaProps {
  mask: HorizonMask;
  skyState: SkyState;
  hoursOffset: number;
  onHoursChange: (hours: number) => void;
  mode: AppMode;
  siteName: string;
}

export const Panorama: React.FC<PanoramaProps> = ({
  mask,
  skyState,
  hoursOffset,
  onHoursChange,
  mode,
  siteName,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoverAz, setHoverAz] = useState<number | null>(null);

  // Animation loop
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onHoursChange((hoursOffset + 1) % 708);
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying, hoursOffset, onHoursChange]);

  // Coordinate mapping for SVG:
  // X: 0° to 360° Azimuth -> viewBox 0 to 1000
  // Y: -5° to +25° Elevation -> viewBox 300 to 0 (top is higher elevation)
  const minEl = -4;
  const maxEl = 24;
  const elRange = maxEl - minEl;
  const width = 1000;
  const height = 300;

  const azToX = (az: number) => ((az % 360) / 360) * width;
  const elToY = (el: number) => height - ((el - minEl) / elRange) * height;

  // Build SVG polygon for nominal terrain and uncertainty bands
  const { nominalPath, bandPath } = useMemo(() => {
    const step = mask.az_step_deg;
    const count = mask.elev_deg.length;

    let nomD = `M 0,${elToY(mask.elev_deg[0])}`;
    for (let i = 1; i < count; i++) {
      const az = i * step;
      nomD += ` L ${azToX(az).toFixed(1)},${elToY(mask.elev_deg[i]).toFixed(1)}`;
    }
    // Close polygon to bottom for terrain fill
    const fillD = `${nomD} L ${width},${height} L 0,${height} Z`;

    // Uncertainty band: high path forward, low path backward (if available)
    let bandD = '';
    const hasBands =
      mask.elev_hi_deg &&
      mask.elev_lo_deg &&
      mask.elev_hi_deg.length === count &&
      mask.elev_lo_deg.length === count;

    if (hasBands && mask.elev_hi_deg && mask.elev_lo_deg) {
      bandD = `M 0,${elToY(mask.elev_hi_deg[0])}`;
      for (let i = 1; i < count; i++) {
        bandD += ` L ${azToX(i * step).toFixed(1)},${elToY(mask.elev_hi_deg[i]).toFixed(1)}`;
      }
      for (let i = count - 1; i >= 0; i--) {
        bandD += ` L ${azToX(i * step).toFixed(1)},${elToY(mask.elev_lo_deg[i]).toFixed(1)}`;
      }
      bandD += ' Z';
    }

    return { nominalPath: fillD, bandPath: bandD };
  }, [mask]);

  // Sun and Earth positions
  const sunX = azToX(skyState.sun.az_deg);
  const sunY = elToY(skyState.sun.el_deg);
  const earthX = azToX(skyState.earth.az_deg);
  const earthY = elToY(skyState.earth.el_deg);

  // Apparent radii in SVG units
  const sunRadiusPx = Math.max(7, (skyState.sun.angular_radius_deg / elRange) * height * 1.8);
  const earthRadiusPx = Math.max(12, (skyState.earth.angular_radius_deg / elRange) * height * 1.5);

  // Plain-language caption
  const statusCaption = useMemo(() => {
    const sunDiff = skyState.sun.el_deg - skyState.terrain_elev_at_sun_az;
    let sunDesc: string;
    if (skyState.sun_visible_fraction > 0.95) {
      sunDesc = `The Sun is fully clear of the ridge (+${sunDiff.toFixed(1)}° above skyline).`;
    } else if (skyState.sun_visible_fraction > 0.05) {
      sunDesc = `The Sun is partially occluded behind lunar ridge (${Math.round(skyState.sun_visible_fraction * 100)}% disc visible).`;
    } else {
      sunDesc = `The Sun is below the terrain ridge (${Math.abs(sunDiff).toFixed(1)}° below skyline).`;
    }

    const earthDesc = skyState.is_earth_visible
      ? `Earth is in direct line-of-sight for DTE communication.`
      : `Earth is blocked by terrain—direct contact lost.`;

    return `${sunDesc} ${earthDesc}`;
  }, [skyState]);

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Header & Mode info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9' }}>
              360° Horizon Skyline Panorama
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8' }}>
              {siteName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Real LOLA DEM skyline with Sun & Earth paths, {mask.az_step_deg}° resolution ({mask.elev_deg.length} azimuth directions)
            {mask.site_height_m != null ? ` • Site height: ${mask.site_height_m} m` : ''}
            {mask.label ? ` • [${mask.label}]` : ''}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            <span>Sun ({Math.round(skyState.sun_visible_fraction * 100)}% lit)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
            <span>Earth (DTE)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '6px', background: mask.elev_hi_deg ? 'rgba(56, 189, 248, 0.25)' : 'rgba(100, 116, 139, 0.2)', border: mask.elev_hi_deg ? '1px dashed #38bdf8' : '1px dashed #64748b', display: 'inline-block' }} />
            <span style={{ color: mask.elev_hi_deg ? '#f8fafc' : '#64748b' }}>
              DEM Error Band {mask.elev_hi_deg ? '' : '(pending)'}
            </span>
          </div>
        </div>
      </div>

      {/* Panorama SVG Viewport */}
      <div style={{ position: 'relative', width: '100%', height: '320px', background: 'linear-gradient(to top, #020617 0%, #090d16 60%, #030712 100%)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1e293b' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const az = (x / rect.width) * 360;
            setHoverAz(Number(az.toFixed(1)));
          }}
          onMouseLeave={() => setHoverAz(null)}
        >
          <defs>
            {/* Terrain Gradient */}
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="25%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Sun Glow */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>

            {/* Earth Glow */}
            <radialGradient id="earthGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="1" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Elevation Grid Lines */}
          {[-2, 0, 5, 10, 15, 20].map((el) => (
            <g key={el}>
              <line
                x1={0}
                y1={elToY(el)}
                x2={width}
                y2={elToY(el)}
                stroke={el === 0 ? '#475569' : '#1e293b'}
                strokeWidth={el === 0 ? 1.5 : 0.8}
                strokeDasharray={el === 0 ? 'none' : '4 4'}
              />
              <text x={8} y={elToY(el) - 3} fill="#64748b" fontSize="10" fontFamily="sans-serif">
                {el > 0 ? `+${el}°` : `${el}°`}
              </text>
            </g>
          ))}

          {/* Azimuth Grid Lines & Compass Labels */}
          {[
            { az: 0, label: 'N (0°)' },
            { az: 45, label: 'NE' },
            { az: 90, label: 'E (90°)' },
            { az: 135, label: 'SE' },
            { az: 180, label: 'S (180°)' },
            { az: 225, label: 'SW' },
            { az: 270, label: 'W (270°)' },
            { az: 315, label: 'NW' },
            { az: 360, label: 'N (360°)' },
          ].map(({ az, label }) => (
            <g key={az}>
              <line
                x1={azToX(az)}
                y1={0}
                x2={azToX(az)}
                y2={height}
                stroke="#1e293b"
                strokeWidth={az % 90 === 0 ? 1.2 : 0.6}
              />
              <text
                x={azToX(az)}
                y={height - 8}
                textAnchor="middle"
                fill={az % 90 === 0 ? '#94a3b8' : '#475569'}
                fontSize="11"
                fontWeight={az % 90 === 0 ? '600' : 'normal'}
                fontFamily="sans-serif"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Uncertainty Band (Shaded area between low and high DEM errors, if available) */}
          {bandPath ? <path d={bandPath} fill="rgba(56, 189, 248, 0.12)" stroke="none" /> : null}

          {/* Nominal Terrain Silhouette */}
          <path d={nominalPath} fill="url(#terrainGrad)" stroke="#64748b" strokeWidth={1.5} />

          {/* Sun disc & ray */}
          <g transform={`translate(${sunX}, ${sunY})`}>
            {/* Halo */}
            <circle cx={0} cy={0} r={sunRadiusPx * 2.2} fill="url(#sunGlow)" opacity={skyState.sun_visible_fraction} />
            {/* Sun Disc */}
            <circle
              cx={0}
              cy={0}
              r={sunRadiusPx}
              fill="#fef08a"
              stroke="#eab308"
              strokeWidth={1.5}
            />
            {/* Partial shadow overlay if partially eclipsed or below horizon */}
            {skyState.sun_visible_fraction < 1 && (
              <circle
                cx={0}
                cy={0}
                r={sunRadiusPx}
                fill="#020617"
                opacity={Math.min(0.9, (1 - skyState.sun_visible_fraction) * 0.9)}
              />
            )}
            {/* Elevation readout label */}
            <text
              x={sunRadiusPx + 4}
              y={-4}
              fill="#fef08a"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ☉ {skyState.sun.el_deg > 0 ? `+${skyState.sun.el_deg}°` : `${skyState.sun.el_deg}°`}
            </text>
          </g>

          {/* Earth disc & label */}
          <g transform={`translate(${earthX}, ${earthY})`}>
            <circle cx={0} cy={0} r={earthRadiusPx * 1.8} fill="url(#earthGlow)" opacity={skyState.is_earth_visible ? 0.8 : 0.2} />
            <circle
              cx={0}
              cy={0}
              r={earthRadiusPx}
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth={2}
            />
            {/* Earth continent texture hint */}
            <circle cx={-earthRadiusPx * 0.25} cy={-earthRadiusPx * 0.2} r={earthRadiusPx * 0.45} fill="#166534" opacity={0.6} />
            <circle cx={earthRadiusPx * 0.3} cy={earthRadiusPx * 0.3} r={earthRadiusPx * 0.35} fill="#15803d" opacity={0.5} />
            <text
              x={earthRadiusPx + 4}
              y={-4}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ♁ {skyState.earth.el_deg > 0 ? `+${skyState.earth.el_deg}°` : `${skyState.earth.el_deg}°`}
            </text>
          </g>

          {/* Interactive Hover Crosshair */}
          {hoverAz !== null && (
            <line
              x1={azToX(hoverAz)}
              y1={0}
              x2={azToX(hoverAz)}
              y2={height}
              stroke="#38bdf8"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </svg>

        {/* Hover Readout Tooltip */}
        {hoverAz !== null && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: `${Math.min(80, Math.max(10, (hoverAz / 360) * 100))}%`,
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: '#f8fafc',
              pointerEvents: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
            }}
          >
            Azimuth: {hoverAz}° | Horizon Elev: {(mask.elev_deg[Math.min(mask.elev_deg.length - 1, Math.max(0, Math.floor((((hoverAz % 360) + 360) % 360) / mask.az_step_deg)))] ?? 0).toFixed(2)}°
          </div>
        )}
      </div>

      {/* Explore Mode plain-language banner */}
      <div
        style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: mode === 'explore' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(30, 41, 59, 0.5)',
          borderLeft: `3px solid ${skyState.sun_visible_fraction > 0 ? '#fbbf24' : '#64748b'}`,
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: mode === 'explore' ? '#bae6fd' : '#cbd5e1' }}>
          <strong>Status:</strong> {statusCaption}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          TDB Light-time CN+S corrected
        </span>
      </div>

      {/* Time Animation Controls & Slider */}
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '14px', background: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? '#dc2626' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isPlaying ? 'Pause' : 'Animate'}
        </button>

        <button
          onClick={() => onHoursChange(0)}
          title="Reset to Landing Time"
          style={{
            background: '#1e293b',
            color: '#94a3b8',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={() => onHoursChange(Math.max(0, hoursOffset - 6))}
          title="-6 Hours"
          style={{ background: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => onHoursChange(hoursOffset + 6)}
          title="+6 Hours"
          style={{ background: '#1e293b', color: '#cbd5e1', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>

        {/* Time Slider */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>Time Scrub (0h → +708h / Full 29.5-day Lunar Day)</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              +{hoursOffset}h ({(hoursOffset / 24).toFixed(1)} Earth days) • {skyState.time_utc}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={708}
            step={1}
            value={hoursOffset}
            onChange={(e) => onHoursChange(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
        </div>
      </div>
    </div>
  );
};
