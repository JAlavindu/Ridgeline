import React from 'react';
import type { SkyState, CountdownWindow, AppMode } from '../types';
import { Sun, Radio, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface SolarElevationReadoutProps {
  skyState: SkyState;
  countdowns: CountdownWindow[];
  siteLat: number;
  siteName: string;
  mode: AppMode;
}

export const SolarElevationReadout: React.FC<SolarElevationReadoutProps> = ({
  skyState,
  countdowns,
  siteLat,
  siteName,
  mode,
}) => {
  const isPolar = Math.abs(siteLat) > 75;

  const sunRising = skyState.sun_elevation_rate_deg_per_hr > 0;
  const sunsetWindow = countdowns.find((c) => c.event === 'sunset');
  const sunriseWindow = countdowns.find((c) => c.event === 'sunrise');
  const earthsetWindow = countdowns.find((c) => c.event === 'earthset');
  const earthriseWindow = countdowns.find((c) => c.event === 'earthrise');

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={20} color="#fbbf24" />
            Solar Elevation & Live "Now" Panel
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            {siteName} • {mode === 'explore' ? 'Instantaneous solar geometry & countdown windows' : 'Verified ephemeris state & uncertainty countdown bounds (F8)'}
          </p>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#38bdf8', background: '#1e293b', padding: '3px 10px', borderRadius: '4px' }}>
          {isPolar ? 'Polar Site Mode (Windowed Events F8)' : 'Equatorial Mode'}
        </div>
      </div>

      {/* Main Grid: Prominent Elevation Readout + Secondary Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        
        {/* Card 1: Solar Elevation (Headline Challenge Metric) */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Solar Elevation
            </span>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: sunRising ? '#4ade80' : '#f87171' }}>
              {sunRising ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(skyState.sun_elevation_rate_deg_per_hr)}°/h
            </span>
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: skyState.sun.el_deg > skyState.terrain_elev_at_sun_az ? '#fbbf24' : '#64748b', letterSpacing: '-0.5px' }}>
              {skyState.sun.el_deg > 0 ? `+${skyState.sun.el_deg.toFixed(2)}` : skyState.sun.el_deg.toFixed(2)}°
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <span>Terrain Skyline: <strong>{skyState.terrain_elev_at_sun_az.toFixed(2)}°</strong></span>
            <span>Azimuth: <strong>{skyState.sun.az_deg.toFixed(1)}°</strong></span>
          </div>
        </div>

        {/* Card 2: Solar Disc & Power Flux */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sun Disc & Power Flux
            </span>
            <Zap size={16} color="#fbbf24" />
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
              {(skyState.sun_visible_fraction * 100).toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '8px' }}>
              disc lit
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <span>Direct Flux: <strong style={{ color: '#fbbf24' }}>{skyState.solar_flux_w_m2} W/m²</strong></span>
            <span>Solar Constant: 1361 W/m²</span>
          </div>
        </div>

        {/* Card 3: Earth Elevation & Libration */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Earth LOS & Elevation
            </span>
            <Radio size={16} color={skyState.is_earth_visible ? '#38bdf8' : '#ef4444'} />
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 700, color: skyState.is_earth_visible ? '#38bdf8' : '#ef4444', letterSpacing: '-0.5px' }}>
              {skyState.earth.el_deg > 0 ? `+${skyState.earth.el_deg.toFixed(2)}` : skyState.earth.el_deg.toFixed(2)}°
            </span>
            <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: skyState.is_earth_visible ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: skyState.is_earth_visible ? '#38bdf8' : '#f87171', marginLeft: '8px' }}>
              {skyState.is_earth_visible ? 'DTE LINK OK' : 'LINK BLOCKED'}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <span>Range: <strong>{skyState.earth.dist_km.toLocaleString()} km</strong></span>
            <span>Parallax: <strong>0.28°</strong></span>
          </div>
        </div>
      </div>

      {/* Countdown Windows Section (Formula F8 - Mandatory Uncertainty Bounds) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
            Next Astronomical Event Countdowns (NASA Uncertainty Windows)
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Never a single number poleward of 75° (Rule F8)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          
          {/* Sunset Window */}
          {sunsetWindow && (
            <div style={{ background: '#020617', border: '1px solid #1e293b', borderLeft: '3px solid #f59e0b', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Next Sunset</span>
                <span style={{ color: '#fbbf24' }}>±{sunsetWindow.uncertainty_hours}h band</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fef08a', margin: '4px 0' }}>
                in {sunsetWindow.nominal_hours}h
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Window: <strong>{sunsetWindow.earliest_hours}h – {sunsetWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {sunsetWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Sunrise Window */}
          {sunriseWindow && (
            <div style={{ background: '#020617', border: '1px solid #1e293b', borderLeft: '3px solid #3b82f6', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Next Sunrise</span>
                <span style={{ color: '#60a5fa' }}>±{sunriseWindow.uncertainty_hours}h band</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#93c5fd', margin: '4px 0' }}>
                in {sunriseWindow.nominal_hours}h
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Window: <strong>{sunriseWindow.earliest_hours}h – {sunriseWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {sunriseWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Earthset Window */}
          {earthsetWindow && (
            <div style={{ background: '#020617', border: '1px solid #1e293b', borderLeft: '3px solid #06b6d4', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Next Earthset (DTE Loss)</span>
                <span style={{ color: '#22d3ee' }}>±{earthsetWindow.uncertainty_hours}h band</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#67e8f9', margin: '4px 0' }}>
                in {earthsetWindow.nominal_hours}h
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Window: <strong>{earthsetWindow.earliest_hours}h – {earthsetWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {earthsetWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Earthrise Window */}
          {earthriseWindow && (
            <div style={{ background: '#020617', border: '1px solid #1e293b', borderLeft: '3px solid #10b981', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Next Earthrise (DTE Reconnect)</span>
                <span style={{ color: '#34d399' }}>±{earthriseWindow.uncertainty_hours}h band</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#6ee7b7', margin: '4px 0' }}>
                in {earthriseWindow.nominal_hours}h
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Window: <strong>{earthriseWindow.earliest_hours}h – {earthriseWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {earthriseWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
