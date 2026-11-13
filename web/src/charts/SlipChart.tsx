import React, { useState, useMemo } from 'react';
import type { SlipDataPoint, AppMode } from '../types';
import { AlertCircle, CheckCircle2, Sliders, TrendingUp } from 'lucide-react';

interface SlipChartProps {
  slipData: SlipDataPoint[];
  currentSlipDays: number;
  onSlipChange: (days: number) => void;
  siteName: string;
  mode: AppMode;
}

export const SlipChart: React.FC<SlipChartProps> = ({
  slipData,
  currentSlipDays,
  onSlipChange,
  siteName,
  mode,
}) => {
  const [hoverSlip, setHoverSlip] = useState<number | null>(null);

  // Active data point based on currentSlipDays
  const activePoint = useMemo(() => {
    return (
      slipData.find((d) => d.slip_days === currentSlipDays) ||
      slipData[Math.floor(slipData.length / 2)]
    );
  }, [slipData, currentSlipDays]);

  const hoveredPoint = useMemo(() => {
    if (hoverSlip === null) return activePoint;
    return slipData.find((d) => d.slip_days === hoverSlip) || activePoint;
  }, [slipData, hoverSlip, activePoint]);

  // SVG Chart Dimensions
  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Scales
  const minSlip = -60;
  const maxSlip = 60;
  const slipToX = (slip: number) =>
    padding.left + ((slip - minSlip) / (maxSlip - minSlip)) * plotWidth;
  const pctToY = (pct: number) =>
    padding.top + plotHeight - (pct / 100) * plotHeight;

  // Build SVG Paths for Sunlight %, Earth %, and Combined %
  const sunlightPath = useMemo(() => {
    return slipData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${slipToX(d.slip_days).toFixed(1)},${pctToY(d.sunlight_percent).toFixed(1)}`)
      .join(' ');
  }, [slipData]);

  const earthPath = useMemo(() => {
    return slipData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${slipToX(d.slip_days).toFixed(1)},${pctToY(d.earth_visible_percent).toFixed(1)}`)
      .join(' ');
  }, [slipData]);

  const combinedPath = useMemo(() => {
    return slipData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${slipToX(d.slip_days).toFixed(1)},${pctToY(d.combined_percent).toFixed(1)}`)
      .join(' ');
  }, [slipData]);

  return (
    <div style={{ background: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#38bdf8" />
              Launch-Slip Scenario Sensitivity (±60 Days)
            </h3>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#38bdf8' }}>
              {siteName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            {mode === 'explore' ? 'How viable is Plan B if launch slips by days or weeks?' : 'Parametric sensitivity evaluation across ±60 day launch slips'} Track sunlight %, contact %, and longest night
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '3px', background: '#fbbf24', display: 'inline-block' }} />
            <span>% Sunlight</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '3px', background: '#38bdf8', display: 'inline-block' }} />
            <span>% Earth DTE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '3px', background: '#34d399', display: 'inline-block' }} />
            <span>% Combined</span>
          </div>
        </div>
      </div>

      {/* SVG Plot */}
      <div style={{ position: 'relative', width: '100%', height: '230px', background: '#020617', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const normX = (clickX - (padding.left / width) * rect.width) / ((plotWidth / width) * rect.width);
            const slip = Math.round(minSlip + normX * (maxSlip - minSlip));
            const clamped = Math.max(-60, Math.min(60, slip));
            onSlipChange(clamped);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const normX = (clickX - (padding.left / width) * rect.width) / ((plotWidth / width) * rect.width);
            const slip = Math.round(minSlip + normX * (maxSlip - minSlip));
            setHoverSlip(Math.max(-60, Math.min(60, slip)));
          }}
          onMouseLeave={() => setHoverSlip(null)}
        >
          {/* Y Axis Grid Lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={pctToY(pct)}
                x2={width - padding.right}
                y2={pctToY(pct)}
                stroke="#1e293b"
                strokeWidth={pct === 50 ? 1 : 0.6}
              />
              <text
                x={padding.left - 8}
                y={pctToY(pct) + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="10"
                fontFamily="sans-serif"
              >
                {pct}%
              </text>
            </g>
          ))}

          {/* X Axis Grid Lines */}
          {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((slip) => (
            <g key={slip}>
              <line
                x1={slipToX(slip)}
                y1={padding.top}
                x2={slipToX(slip)}
                y2={height - padding.bottom}
                stroke={slip === 0 ? '#475569' : '#1e293b'}
                strokeWidth={slip === 0 ? 1.2 : 0.6}
              />
              <text
                x={slipToX(slip)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fill={slip === 0 ? '#38bdf8' : '#64748b'}
                fontSize="10"
                fontWeight={slip === 0 ? 'bold' : 'normal'}
                fontFamily="sans-serif"
              >
                {slip > 0 ? `+${slip}d` : `${slip}d`}
              </text>
            </g>
          ))}

          {/* Viability Threshold (e.g. 65% sunlight) */}
          <line
            x1={padding.left}
            y1={pctToY(65)}
            x2={width - padding.right}
            y2={pctToY(65)}
            stroke="rgba(52, 211, 153, 0.4)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <text
            x={width - padding.right - 4}
            y={pctToY(65) - 4}
            textAnchor="end"
            fill="#34d399"
            fontSize="9"
            fontFamily="sans-serif"
          >
            Viability Threshold (65%)
          </text>

          {/* Metric Curves */}
          <path d={sunlightPath} fill="none" stroke="#fbbf24" strokeWidth={2} />
          <path d={earthPath} fill="none" stroke="#38bdf8" strokeWidth={1.8} strokeDasharray="5 3" />
          <path d={combinedPath} fill="none" stroke="#34d399" strokeWidth={2.5} />

          {/* Current Slip Days Vertical Marker */}
          <g transform={`translate(${slipToX(currentSlipDays)}, 0)`}>
            <line
              x1={0}
              y1={padding.top}
              x2={0}
              y2={height - padding.bottom}
              stroke="#f43f5e"
              strokeWidth={2}
            />
            <circle cx={0} cy={pctToY(activePoint.combined_percent)} r={5} fill="#f43f5e" stroke="#fff" strokeWidth={1.5} />
          </g>

          {/* Hover Marker */}
          {hoverSlip !== null && hoverSlip !== currentSlipDays && (
            <line
              x1={slipToX(hoverSlip)}
              y1={padding.top}
              x2={slipToX(hoverSlip)}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>

      {/* Slip Slider Control Bar */}
      <div style={{ marginTop: '14px', background: '#0f172a', padding: '12px 14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Sliders size={16} color="#38bdf8" />
            <strong style={{ color: '#f8fafc' }}>Launch Slip Offset:</strong>
            <span style={{ color: currentSlipDays === 0 ? '#38bdf8' : currentSlipDays > 0 ? '#fbbf24' : '#c084fc', fontWeight: 'bold' }}>
              {currentSlipDays === 0 ? 'Nominal Date (0d)' : currentSlipDays > 0 ? `+${currentSlipDays} Days Slip` : `${currentSlipDays} Days Early`}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              Target: {activePoint.target_date}
            </span>
          </div>

          {/* Viability Status Chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
              background: activePoint.is_viable ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: activePoint.is_viable ? '#34d399' : '#f87171',
              border: `1px solid ${activePoint.is_viable ? '#059669' : '#b91c1c'}`,
            }}
          >
            {activePoint.is_viable ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {activePoint.is_viable ? 'PLAN B VIABLE' : 'HIGH RISK — EXCESSIVE DARKNESS'}
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={-60}
          max={60}
          step={1}
          value={currentSlipDays}
          onChange={(e) => onSlipChange(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
        />

        {/* Detailed Metrics Readout for Selected Slip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px', fontSize: '0.8rem' }}>
          <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Sunlight Availability</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {hoveredPoint.sunlight_percent}%
            </div>
          </div>
          <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Earth DTE Contact</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
              {hoveredPoint.earth_visible_percent}%
            </div>
          </div>
          <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Combined (Power+Comms)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#34d399' }}>
              {hoveredPoint.combined_percent}%
            </div>
          </div>
          <div style={{ background: '#020617', padding: '8px 10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Longest Darkness</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: hoveredPoint.longest_night_hours > 72 ? '#f87171' : '#cbd5e1' }}>
              {hoveredPoint.longest_night_hours}h ({(hoveredPoint.longest_night_hours / 24).toFixed(1)}d)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
