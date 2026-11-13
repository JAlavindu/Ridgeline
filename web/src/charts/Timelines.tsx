import React, { useState } from 'react';
import type { TimelineHour, AppMode } from '../types';
import { Sun, Radio, Clock, Sparkles } from 'lucide-react';

interface TimelinesProps {
  timelineData: TimelineHour[];
  currentHoursOffset: number;
  onSelectHours: (hours: number) => void;
  siteName: string;
  mode: AppMode;
}

export const Timelines: React.FC<TimelinesProps> = ({
  timelineData,
  currentHoursOffset,
  onSelectHours,
  siteName,
  mode,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const totalPoints = timelineData.length;
  // Step in hours between each sample in timelineData
  const stepHours = 2;

  // Calculate summary metrics
  const sunlitCount = timelineData.filter((d) => d.is_sunlit || d.is_partial).length;
  const earthVisibleCount = timelineData.filter((d) => d.is_earth_visible).length;
  const bothCount = timelineData.filter((d) => d.is_both).length;
  const eclipseCount = timelineData.filter((d) => d.is_eclipse).length;

  const sunlitPct = Math.round((sunlitCount / totalPoints) * 100);
  const earthPct = Math.round((earthVisibleCount / totalPoints) * 100);
  const bothPct = Math.round((bothCount / totalPoints) * 100);

  // Current active index based on currentHoursOffset
  const activeIndex = Math.min(
    totalPoints - 1,
    Math.max(0, Math.round(currentHoursOffset / stepHours))
  );

  const hoveredData = hoverIndex !== null ? timelineData[hoverIndex] : timelineData[activeIndex];

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Title & Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9' }}>
              Mission Illumination & Contact Timelines
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8' }}>
              {siteName} (15 Days / 360h)
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            {mode === 'explore' ? 'Mission operational windows for power and contact' : 'High-resolution discrete timeline of solar disc and Earth visibility'}
          </p>
        </div>

        {/* Quick summary badges */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
          <div style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
            <span style={{ color: '#94a3b8' }}>Sunlit: </span>
            <strong style={{ color: '#fbbf24' }}>{sunlitPct}%</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
            <span style={{ color: '#94a3b8' }}>DTE Contact: </span>
            <strong style={{ color: '#38bdf8' }}>{earthPct}%</strong>
          </div>
          <div style={{ background: '#1e293b', padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
            <span style={{ color: '#94a3b8' }}>Both (Prime): </span>
            <strong style={{ color: '#34d399' }}>{bothPct}%</strong>
          </div>
          {eclipseCount > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
              <strong style={{ color: '#f87171' }}>Eclipse Event</strong>
            </div>
          )}
        </div>
      </div>

      {/* Main Timeline Graphic */}
      <div style={{ background: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', position: 'relative' }}>
        
        {/* Layer 1: Sunlight Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sun size={14} color="#fbbf24" />
              <strong>Solar Illumination (Disc Fraction)</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>Gold = Full (100%), Amber = Partial, Dark = Night</span>
          </div>

          <div
            style={{
              display: 'flex',
              height: '24px',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #334155',
            }}
          >
            {timelineData.map((d, idx) => {
              let bg = '#0f172a'; // dark
              if (d.is_sunlit) bg = '#eab308'; // full
              else if (d.is_partial) bg = '#b45309'; // partial
              if (d.is_eclipse) bg = '#450a0a'; // eclipse

              return (
                <div
                  key={idx}
                  onClick={() => onSelectHours(idx * stepHours)}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    flex: 1,
                    background: bg,
                    transition: 'opacity 0.1s',
                    opacity: hoverIndex === idx ? 0.7 : 1,
                  }}
                  title={`Hour ${idx * stepHours}: ${d.sun_fraction > 0 ? (d.sun_fraction * 100).toFixed(0) + '% lit' : 'Night'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Layer 2: Earth DTE Contact Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={14} color="#38bdf8" />
              <strong>Direct-to-Earth (DTE) Visibility</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>Cyan = LOS Contact, Dark = Occluded</span>
          </div>

          <div
            style={{
              display: 'flex',
              height: '20px',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #334155',
            }}
          >
            {timelineData.map((d, idx) => (
              <div
                key={idx}
                onClick={() => onSelectHours(idx * stepHours)}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  flex: 1,
                  background: d.is_earth_visible ? '#0284c7' : '#0f172a',
                  opacity: hoverIndex === idx ? 0.7 : 1,
                }}
                title={`Hour ${idx * stepHours}: Earth ${d.is_earth_visible ? 'Visible' : 'Occluded'}`}
              />
            ))}
          </div>
        </div>

        {/* Layer 3: Combined Viable Window */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={14} color="#34d399" />
              <strong>Combined Viable Windows (Sunlit + Earth DTE)</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>Green = Operational Window</span>
          </div>

          <div
            style={{
              display: 'flex',
              height: '18px',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid #334155',
            }}
          >
            {timelineData.map((d, idx) => (
              <div
                key={idx}
                onClick={() => onSelectHours(idx * stepHours)}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  flex: 1,
                  background: d.is_both ? '#10b981' : '#0f172a',
                  opacity: hoverIndex === idx ? 0.7 : 1,
                }}
                title={`Hour ${idx * stepHours}: ${d.is_both ? 'Both Available' : 'Not combined'}`}
              />
            ))}
          </div>
        </div>

        {/* Synchronized Current Time Pointer Marker */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            left: `${((activeIndex / totalPoints) * 100).toFixed(2)}%`,
            width: '2px',
            background: '#f43f5e',
            boxShadow: '0 0 8px #f43f5e',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '-4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#f43f5e',
            }}
          />
        </div>

        {/* Time Axis Labels (Every 24h / 1 Earth day) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#64748b' }}>
          <span>Day 0 (0h)</span>
          <span>Day 3 (72h)</span>
          <span>Day 6 (144h)</span>
          <span>Day 9 (216h)</span>
          <span>Day 12 (288h)</span>
          <span>Day 15 (360h)</span>
        </div>
      </div>

      {/* Selected / Hovered Hour Inspector Card */}
      {hoveredData && (
        <div
          style={{
            marginTop: '12px',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#38bdf8" />
            <strong style={{ color: '#f8fafc' }}>{hoveredData.time_utc}</strong>
            <span style={{ color: '#94a3b8' }}>
              (+{((hoverIndex !== null ? hoverIndex : activeIndex) * stepHours)}h from landing)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', color: '#cbd5e1' }}>
            <span>
              Sun El: <strong style={{ color: '#fbbf24' }}>{hoveredData.sun_el}°</strong> (disc: {Math.round(hoveredData.sun_fraction * 100)}%)
            </span>
            <span>
              Earth El: <strong style={{ color: '#38bdf8' }}>{hoveredData.earth_el}°</strong> ({hoveredData.is_earth_visible ? 'Visible' : 'Blocked'})
            </span>
            <span>
              Status:{' '}
              <strong style={{ color: hoveredData.is_both ? '#34d399' : '#f87171' }}>
                {hoveredData.is_both ? 'Optimal Power & Comms' : 'Constrained'}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
