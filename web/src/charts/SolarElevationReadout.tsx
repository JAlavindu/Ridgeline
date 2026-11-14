import React from 'react';
import type { SkyState, CountdownWindow, AppMode } from '../types';
import { Sun, Radio, ArrowUpRight, ArrowDownRight, Zap, AlertTriangle, ShieldCheck, Clock, HelpCircle } from 'lucide-react';

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
    <div style={{ background: '#040404', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0px', padding: '18px', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={20} color="#fbbf24" />
            Live Sun & Earth Status (Right Now)
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            {siteName} • {mode === 'explore' ? 'Current sun angle, solar power generation, and Earth connection status' : 'Verified orbital position data and countdown windows'}
          </p>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#ff4d2b', background: '#141414', padding: '3px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {isPolar ? 'Lunar South Pole Location' : 'Equatorial Location'}
        </div>
      </div>

      {/* Main Grid: Prominent Elevation Readout + Secondary Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        
        {/* Card 1: Solar Elevation (Sun Angle in Sky) */}
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '0px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Sun Height in Sky
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                Angle above horizon (0° is ground level)
              </p>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: sunRising ? '#4ade80' : '#f87171' }}>
              {sunRising ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {sunRising ? 'Rising' : 'Setting'}
            </span>
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: skyState.sun.el_deg > skyState.terrain_elev_at_sun_az ? '#fbbf24' : '#64748b', letterSpacing: '-0.5px' }}>
              {skyState.sun.el_deg > 0 ? `+${skyState.sun.el_deg.toFixed(1)}` : skyState.sun.el_deg.toFixed(1)}°
            </span>
            <span style={{ fontSize: '0.8rem', color: skyState.is_sun_visible ? '#4ade80' : '#94a3b8', marginLeft: '10px' }}>
              {skyState.is_sun_visible ? '● In Sunlight' : '○ In Shadow (Night)'}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '8px' }}>
            <span>Crater Rim Height: <strong>{skyState.terrain_elev_at_sun_az.toFixed(1)}°</strong></span>
            <span>Direction: <strong>{skyState.sun.az_deg.toFixed(0)}° (Compass)</strong></span>
          </div>
        </div>

        {/* Card 2: Solar Power Generation */}
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '0px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Solar Panel Power
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                Energy available for lander batteries
              </p>
            </div>
            <Zap size={16} color="#fbbf24" />
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px' }}>
              {(skyState.sun_visible_fraction * 100).toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '8px' }}>
              sun visible
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '8px' }}>
            <span>Light Energy: <strong style={{ color: '#fbbf24' }}>{skyState.solar_flux_w_m2} W/m²</strong></span>
            <span style={{ color: '#94a3b8' }}>Max possible: 1,361 W/m²</span>
          </div>
        </div>

        {/* Card 3: Earth Connection & Communications */}
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '0px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Earth Radio Signal
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                Direct communication to Mission Control
              </p>
            </div>
            <Radio size={16} color={skyState.is_earth_visible ? '#38bdf8' : '#ef4444'} />
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 700, color: skyState.is_earth_visible ? '#38bdf8' : '#ef4444', letterSpacing: '-0.5px' }}>
              {skyState.earth.el_deg > 0 ? `+${skyState.earth.el_deg.toFixed(1)}` : skyState.earth.el_deg.toFixed(1)}°
            </span>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: skyState.is_earth_visible ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: skyState.is_earth_visible ? '#38bdf8' : '#f87171', marginLeft: '8px', fontWeight: 600 }}>
              {skyState.is_earth_visible ? 'CONNECTED TO EARTH' : 'SIGNAL BLOCKED BY HILLS'}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '8px' }}>
            <span>Distance to Earth: <strong>{skyState.earth.dist_km.toLocaleString()} km</strong></span>
            <span style={{ color: skyState.is_earth_visible ? '#38bdf8' : '#f87171' }}>
              {skyState.is_earth_visible ? 'Clear sightline' : 'Behind ridge'}
            </span>
          </div>
        </div>
      </div>

      {/* Critical Operational Banner: Time Remaining Before Power or Comms Loss */}
      <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} className="text-[#ff3d18]" />
          <div>
            <div className="text-[12px] font-['Michroma'] uppercase tracking-[1px] text-white">
              Mission Countdown: Time Remaining Before Conditions Change
            </div>
            <div className="text-[11px] text-white/70">
              {sunsetWindow ? (
                <>Next Sunset (Loss of Solar Power): in <strong className="text-[#fbbf24]">{sunsetWindow.nominal_hours} hours</strong> (expected between {sunsetWindow.earliest_hours}h and {sunsetWindow.latest_hours}h)</>
              ) : (
                <>Sunlight stable across upcoming mission days</>
              )}
              {earthsetWindow && (
                <> • Next Earthset (Loss of Radio Comms): in <strong className="text-[#38bdf8]">{earthsetWindow.nominal_hours} hours</strong> (between {earthsetWindow.earliest_hours}h and {earthsetWindow.latest_hours}h)</>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {skyState.is_sun_visible && skyState.is_earth_visible ? (
            <span className="flex items-center gap-1.5 text-[9px] font-['Michroma'] uppercase tracking-[1px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-3 py-1.5">
              <ShieldCheck size={13} />
              Best Operating Time (Both Sun & Earth OK)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[9px] font-['Michroma'] uppercase tracking-[1px] bg-amber-950/60 text-amber-400 border border-amber-500/40 px-3 py-1.5">
              <AlertTriangle size={13} />
              Limited Operations ({!skyState.is_sun_visible ? 'On Battery Power' : 'No Direct Radio to Earth'})
            </span>
          )}
        </div>
      </div>

      {/* Countdown Windows Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Upcoming Sun & Earth Events</span>
            <span title="Because mountains cast long shadows near the Moon's poles, events happen within an expected time window rather than an exact minute.">
              <HelpCircle size={14} className="text-white/40 cursor-help" />
            </span>
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Times shown as expected windows (due to Moon terrain shadows)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          
          {/* Sunset Window */}
          {sunsetWindow && (
            <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderLeft: '3px solid #f59e0b', borderRadius: '0px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-semibold text-white">Next Sunset (Darkness Begins)</span>
                <span style={{ color: '#fbbf24' }}>±{sunsetWindow.uncertainty_hours}h window</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fef08a', margin: '4px 0' }}>
                in ~{sunsetWindow.nominal_hours} hours
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Expected between: <strong>{sunsetWindow.earliest_hours}h – {sunsetWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Target Date: {sunsetWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Sunrise Window */}
          {sunriseWindow && (
            <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderLeft: '3px solid #3b82f6', borderRadius: '0px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-semibold text-white">Next Sunrise (Daylight Returns)</span>
                <span style={{ color: '#60a5fa' }}>±{sunriseWindow.uncertainty_hours}h window</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#93c5fd', margin: '4px 0' }}>
                in ~{sunriseWindow.nominal_hours} hours
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Expected between: <strong>{sunriseWindow.earliest_hours}h – {sunriseWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Target Date: {sunriseWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Earthset Window */}
          {earthsetWindow && (
            <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderLeft: '3px solid #06b6d4', borderRadius: '0px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-semibold text-white">Next Earthset (Radio Cuts Out)</span>
                <span style={{ color: '#22d3ee' }}>±{earthsetWindow.uncertainty_hours}h window</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#a5f3fc', margin: '4px 0' }}>
                in ~{earthsetWindow.nominal_hours} hours
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Expected between: <strong>{earthsetWindow.earliest_hours}h – {earthsetWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Target Date: {earthsetWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

          {/* Earthrise Window */}
          {earthriseWindow && (
            <div style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderLeft: '3px solid #10b981', borderRadius: '0px', padding: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span className="font-semibold text-white">Next Earthrise (Radio Reconnects)</span>
                <span style={{ color: '#34d399' }}>±{earthriseWindow.uncertainty_hours}h window</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#a7f3d0', margin: '4px 0' }}>
                in ~{earthriseWindow.nominal_hours} hours
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Expected between: <strong>{earthriseWindow.earliest_hours}h – {earthriseWindow.latest_hours}h</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Target Date: {earthriseWindow.formatted_target_utc} UTC
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
