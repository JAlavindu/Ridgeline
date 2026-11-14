import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { HorizonMask, SkyState, AppMode } from '../types';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface PanoramaProps {
  mask: HorizonMask;
  skyState: SkyState;
  hoursOffset: number;
  onHoursChange: (hours: number) => void;
  mode: AppMode;
  siteName: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const Panorama: React.FC<PanoramaProps> = ({
  mask,
  skyState,
  hoursOffset,
  onHoursChange,
  siteName,
  isPlaying: controlledIsPlaying,
  onTogglePlay,
}) => {
  const [internalPlaying, setInternalPlaying] = useState<boolean>(true);
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalPlaying;
  const togglePlay = onTogglePlay || (() => setInternalPlaying((p) => !p));
  const [hoverAz, setHoverAz] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Animation loop (only runs internally if not controlled by parent)
  React.useEffect(() => {
    if (controlledIsPlaying !== undefined || !internalPlaying) return;
    const interval = setInterval(() => {
      onHoursChange((hoursOffset + 1) % 708);
    }, 150);
    return () => clearInterval(interval);
  }, [controlledIsPlaying, internalPlaying, hoursOffset, onHoursChange]);

  // Coordinate mapping for SVG:
  // X: 0° to 360° Azimuth -> viewBox 0 to 1000
  // Y: Dynamic elevation range:
  // - Polar sites: typically -4° to +24°
  // - Mid-latitude / Equatorial sites (e.g. Apollo 14): Earth sits high overhead (up to ~75°+)
  const minEl = -4;
  const maxEl = Math.max(24, Math.ceil((Math.max(skyState.sun.el_deg, skyState.earth.el_deg) + 12) / 10) * 10);
  const elRange = maxEl - minEl;
  const width = 1000;
  const height = 300;

  const azToX = (az: number) => ((((az % 360) + 360) % 360) / 360) * width;
  const elToY = React.useCallback(
    (el: number) => height - ((el - minEl) / elRange) * height,
    [height, minEl, elRange]
  );

  // Build nominal terrain silhouette path
  const nominalPath = useMemo(() => {
    const pts = mask.elev_deg;
    const n = pts.length;
    if (n === 0) return '';

    let d = `M 0,${height} `;
    for (let i = 0; i < n; i++) {
      const az = i * mask.az_step_deg;
      const x = azToX(az);
      const y = elToY(pts[i]);
      d += `L ${x.toFixed(1)},${y.toFixed(1)} `;
    }
    d += `L ${width},${elToY(pts[0])} L ${width},${height} Z`;
    return d;
  }, [mask, elToY]);

  // Build uncertainty band path if available
  const bandPath = useMemo(() => {
    if (!mask.elev_lo_deg || !mask.elev_hi_deg) return null;
    const lo = mask.elev_lo_deg;
    const hi = mask.elev_hi_deg;
    const n = lo.length;
    if (n === 0) return null;

    let d = `M 0,${elToY(hi[0])} `;
    for (let i = 0; i < n; i++) {
      const az = i * mask.az_step_deg;
      d += `L ${azToX(az).toFixed(1)},${elToY(hi[i]).toFixed(1)} `;
    }
    for (let i = n - 1; i >= 0; i--) {
      const az = i * mask.az_step_deg;
      d += `L ${azToX(az).toFixed(1)},${elToY(lo[i]).toFixed(1)} `;
    }
    d += 'Z';
    return d;
  }, [mask, elToY]);

  // Celestial positions in SVG coordinates
  const sunX = azToX(skyState.sun.az_deg);
  const sunY = elToY(skyState.sun.el_deg);
  const earthX = azToX(skyState.earth.az_deg);
  const earthY = elToY(skyState.earth.el_deg);

  // Apparent radii in SVG units
  const sunRadiusPx = Math.max(10, (skyState.sun.angular_radius_deg / elRange) * height * 2.2);
  const earthRadiusPx = Math.max(14, (skyState.earth.angular_radius_deg / elRange) * height * 1.8);

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

  const content = (
    <div
      style={{
        background: '#040404',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '0px',
        padding: isFullscreen ? '24px 32px' : '16px',
        color: '#f8fafc',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? '0' : 'auto',
        zIndex: isFullscreen ? 99999 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
        overflowY: isFullscreen ? 'auto' : 'visible',
        boxSizing: 'border-box',
      }}
    >
      {/* Header & Mode info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9' }}>
              360° Standing View (What an Astronaut Sees Around Them)
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#141414', color: '#ff4d2b' }}>
              {siteName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            A complete circle view of local hills and crater rims, showing exactly where the Sun and Earth are in the sky.
          </p>
        </div>

        {/* Legend & Fullscreen Button */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            <span>Sun ({Math.round(skyState.sun_visible_fraction * 100)}% lit)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
            <span>Earth (Direct Signal)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '6px', background: 'rgba(56, 189, 248, 0.25)', border: '1px dashed #38bdf8', display: 'inline-block' }} />
            <span style={{ color: '#94a3b8' }}>Terrain Uncertainty Band</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '5px 10px',
              fontSize: '0.72rem',
              fontFamily: 'Michroma, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              marginLeft: '8px',
            }}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Panorama Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 220px)' : '340px',
          minHeight: '280px',
          background: 'radial-gradient(ellipse at 50% 20%, #080c14 0%, #020202 100%)',
          borderRadius: '0px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Starfield backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.65,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: '80px 80px',
            pointerEvents: 'none',
          }}
        />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', cursor: 'crosshair', position: 'relative', zIndex: 1 }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const az = (x / rect.width) * 360;
            setHoverAz(Number(az.toFixed(1)));
          }}
          onMouseLeave={() => setHoverAz(null)}
        >
          <defs>
            {/* Photorealistic Sun Radial Flare */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="85%" stopColor="#ea580c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>

            {/* Earth Atmospheric Halo */}
            <radialGradient id="earthAtmosphere" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </radialGradient>

            {/* Earth Surface Pattern / Texture */}
            <radialGradient id="earthGlobe" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="30%" stopColor="#0284c7" />
              <stop offset="65%" stopColor="#0369a1" />
              <stop offset="90%" stopColor="#082f49" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Lunar Regolith Textured Horizon Silhouette */}
            <linearGradient id="lunarRockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2e37" />
              <stop offset="15%" stopColor="#1a1c23" />
              <stop offset="50%" stopColor="#0f1115" />
              <stop offset="100%" stopColor="#050608" />
            </linearGradient>

            {/* Skyline Rim Glow */}
            <filter id="skylineGlow" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
            </filter>
          </defs>

          {/* Elevation Horizontal Grid Lines */}
          {[-2, 0, 5, 10, 15, 20, 30, 45, 60, 75, 90]
            .filter((el) => el >= minEl && el <= maxEl)
            .map((el) => (
            <g key={el}>
              <line
                x1={0}
                y1={elToY(el)}
                x2={width}
                y2={elToY(el)}
                stroke={el === 0 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={el === 0 ? 1.5 : 0.8}
                strokeDasharray={el === 0 ? 'none' : '4 4'}
              />
              <text x={8} y={elToY(el) - 3} fill={el === 0 ? '#f8fafc' : '#64748b'} fontSize="10" fontFamily="Michroma, sans-serif">
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
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={az % 90 === 0 ? 1.2 : 0.6}
              />
              <text
                x={azToX(az)}
                y={height - 8}
                textAnchor="middle"
                fill={az % 90 === 0 ? '#f8fafc' : '#64748b'}
                fontSize="10"
                fontWeight={az % 90 === 0 ? '600' : 'normal'}
                fontFamily="Michroma, sans-serif"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Uncertainty Band (Shaded area between low and high DEM errors, if available) */}
          {bandPath ? <path d={bandPath} fill="rgba(56, 189, 248, 0.15)" stroke="none" /> : null}

          {/* Realistic Lunar Terrain Silhouette with Ridge Edge Glow */}
          <path d={nominalPath} fill="url(#lunarRockGrad)" />
          <path d={nominalPath} fill="none" stroke="#94a3b8" strokeWidth={1.2} />

          {/* Sun: Realistic Radiant Solar Disc & Optical Corona */}
          <g transform={`translate(${sunX}, ${sunY})`}>
            {/* Extended Solar Corona Flare */}
            <circle cx={0} cy={0} r={sunRadiusPx * 3.5} fill="url(#sunGlow)" opacity={skyState.sun_visible_fraction * 0.8} />
            <circle cx={0} cy={0} r={sunRadiusPx * 1.8} fill="url(#sunGlow)" opacity={skyState.sun_visible_fraction} />
            
            {/* Core Sun Disc */}
            <circle
              cx={0}
              cy={0}
              r={sunRadiusPx}
              fill="#ffffff"
              stroke="#fbbf24"
              strokeWidth={2}
              filter="drop-shadow(0px 0px 8px #fef08a)"
            />
            {/* Partial lunar occlusion shadow */}
            {skyState.sun_visible_fraction < 1 && (
              <circle
                cx={0}
                cy={0}
                r={sunRadiusPx}
                fill="#000000"
                opacity={Math.min(0.92, (1 - skyState.sun_visible_fraction) * 0.95)}
              />
            )}
            {/* Solar Elevation readout */}
            <text
              x={sunRadiusPx + 6}
              y={-4}
              fill="#fbbf24"
              fontSize="11"
              fontWeight="bold"
              fontFamily="Michroma, sans-serif"
            >
              ☉ {skyState.sun.el_deg > 0 ? `+${skyState.sun.el_deg}°` : `${skyState.sun.el_deg}°`}
            </text>
          </g>

          {/* Earth: Realistic Blue Marble Globe with Continents, Clouds & Atmospheric Ring */}
          <g transform={`translate(${earthX}, ${earthY})`}>
            {/* Blue Atmospheric Scattering Halo */}
            <circle cx={0} cy={0} r={earthRadiusPx * 2.2} fill="url(#earthAtmosphere)" opacity={skyState.is_earth_visible ? 0.9 : 0.25} />
            
            {/* Earth Blue Marble Body */}
            <circle
              cx={0}
              cy={0}
              r={earthRadiusPx}
              fill="url(#earthGlobe)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              opacity={skyState.is_earth_visible ? 1 : 0.4}
            />

            {/* Stylized Continents (Africa / Eurasia green patches) */}
            <path
              d={`M ${-earthRadiusPx * 0.4},${-earthRadiusPx * 0.3} Q ${-earthRadiusPx * 0.1},${-earthRadiusPx * 0.6} ${earthRadiusPx * 0.3},${-earthRadiusPx * 0.2} Q ${earthRadiusPx * 0.1},${earthRadiusPx * 0.4} ${-earthRadiusPx * 0.3},${earthRadiusPx * 0.2} Z`}
              fill="#15803d"
              opacity={skyState.is_earth_visible ? 0.75 : 0.3}
            />
            <path
              d={`M ${-earthRadiusPx * 0.6},${earthRadiusPx * 0.1} Q ${-earthRadiusPx * 0.3},${earthRadiusPx * 0.5} ${0},${earthRadiusPx * 0.6} Q ${-earthRadiusPx * 0.5},${earthRadiusPx * 0.4} ${-earthRadiusPx * 0.6},${earthRadiusPx * 0.1} Z`}
              fill="#166534"
              opacity={skyState.is_earth_visible ? 0.7 : 0.3}
            />

            {/* Cloud Swirls */}
            <circle cx={-earthRadiusPx * 0.1} cy={-earthRadiusPx * 0.2} r={earthRadiusPx * 0.5} fill="#ffffff" opacity={skyState.is_earth_visible ? 0.35 : 0.1} />
            <circle cx={earthRadiusPx * 0.2} cy={earthRadiusPx * 0.3} r={earthRadiusPx * 0.4} fill="#ffffff" opacity={skyState.is_earth_visible ? 0.25 : 0.1} />

            {/* Night-side terminator shadow */}
            <path
              d={`M 0,${-earthRadiusPx} A ${earthRadiusPx} ${earthRadiusPx} 0 0 1 0,${earthRadiusPx} A ${earthRadiusPx * 0.3} ${earthRadiusPx} 0 0 1 0,${-earthRadiusPx} Z`}
              fill="#000000"
              opacity={0.5}
            />

            {/* Earth Elevation Label */}
            <text
              x={earthRadiusPx + 6}
              y={-4}
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
              fontFamily="Michroma, sans-serif"
            >
              ♁ {skyState.earth.el_deg > 0 ? `+${skyState.earth.el_deg}°` : `${skyState.earth.el_deg}°`}
            </text>
          </g>

          {/* Interactive Hover Crosshair */}
          {hoverAz !== null && (
            <g>
              <line
                x1={azToX(hoverAz)}
                y1={0}
                x2={azToX(hoverAz)}
                y2={height}
                stroke="#ff4d2b"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <circle
                cx={azToX(hoverAz)}
                cy={elToY(
                  mask.elev_deg[
                    Math.min(
                      mask.elev_deg.length - 1,
                      Math.max(0, Math.floor(hoverAz / mask.az_step_deg))
                    )
                  ] || 0
                )}
                r={4}
                fill="#ff4d2b"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverAz !== null && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: `${(hoverAz / 360) * 100}%`,
              transform: 'translateX(-50%)',
              background: '#0a0a0a',
              border: '1px solid #ff4d2b',
              borderRadius: '0px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: '#f8fafc',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            Azimuth: {hoverAz}° • Ridge Elev:{' '}
            {mask.elev_deg[
              Math.min(
                mask.elev_deg.length - 1,
                Math.max(0, Math.floor(hoverAz / mask.az_step_deg))
              )
            ]?.toFixed(2)}
            °
          </div>
        )}
      </div>

      {/* Scrubber and Time Animation Controls */}
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Plain-Language Caption or Technical readout */}
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ff4d2b', fontWeight: 600 }}>Status:</span>
            <span>{statusCaption}</span>
          </div>

          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            TDB Light-time CN+S corrected
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 14px' }}>
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            style={{
              background: isPlaying ? '#ef4444' : '#ff3d18',
              border: 'none',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '0px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontFamily: 'Michroma, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause' : 'Animate'}</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={() => {
              if (isPlaying) togglePlay();
              onHoursChange(0);
            }}
            style={{
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '6px 10px',
              borderRadius: '0px',
              cursor: 'pointer',
            }}
            title="Reset to Hour 0"
          >
            <RotateCcw size={13} />
          </button>

          {/* Step Back/Forward */}
          <button
            type="button"
            onClick={() => onHoursChange(Math.max(0, hoursOffset - 6))}
            style={{
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '6px 8px',
              borderRadius: '0px',
              cursor: 'pointer',
            }}
            title="-6 Hours"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => onHoursChange(Math.min(708, hoursOffset + 6))}
            style={{
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '6px 8px',
              borderRadius: '0px',
              cursor: 'pointer',
            }}
            title="+6 Hours"
          >
            <ChevronRight size={13} />
          </button>

          {/* Synodic Slider */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              Day 0 (Landing)
            </span>
            <input
              type="range"
              min={0}
              max={708}
              step={1}
              value={hoursOffset}
              onChange={(e) => {
                if (isPlaying) togglePlay();
                onHoursChange(Number(e.target.value));
              }}
              style={{
                flex: 1,
                accentColor: '#ff3d18',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              Day 29.5 (Full Lunar Month)
            </span>
          </div>

          {/* Readout */}
          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#f8fafc', minWidth: '130px', textAlign: 'right' }}>
            +{hoursOffset}h ({Number(hoursOffset / 24).toFixed(1)} Earth days)
          </div>
        </div>
      </div>
    </div>
  );

  return isFullscreen ? createPortal(content, document.body) : content;
};
