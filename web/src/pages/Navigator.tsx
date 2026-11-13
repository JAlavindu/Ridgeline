import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Rocket, Eye, Terminal, ArrowLeft, Calendar, Clock, MapPin, Loader2, Sparkles } from 'lucide-react';

interface NavigatorProps {
  onBack?: () => void;
}

export const Navigator: React.FC<NavigatorProps> = ({ onBack }) => {
  const [sites, setSites] = useState<Site[]>(SAMPLE_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('connecting_ridge');
  const [mode, setMode] = useState<AppMode>('explore');
  const [hoursOffset, setHoursOffset] = useState<number>(12);
  const [slipDays, setSlipDays] = useState<number>(0);
  const [loadedMask, setLoadedMask] = useState<HorizonMask | null>(null);

  // Custom coordinates state
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<string>('-89.20');
  const [customLon, setCustomLon] = useState<string>('145.50');
  const [isCalculatingCustom, setIsCalculatingCustom] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/horizonWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (e: MessageEvent<{ success: boolean; mask?: HorizonMask; error?: string }>) => {
        setIsCalculatingCustom(false);
        if (e.data.success && e.data.mask) {
          const generatedMask = e.data.mask;
          setLoadedMask(generatedMask);

          // Create or update custom site in catalog
          const newCustomSite: Site = {
            id: generatedMask.site_id || 'custom_point',
            name: generatedMask.site_name || `Custom (${generatedMask.lat}°S, ${generatedMask.lon}°E)`,
            program: 'Custom Coordinates',
            country: 'User Defined',
            lat: generatedMask.lat ?? -89.2,
            lon: generatedMask.lon ?? 145.5,
            height_m: generatedMask.site_height_m ?? 0,
            status: 'user defined',
            date: '2026-11-14',
            coord_source: 'LOLA dem_polar_500m.bin on-demand ray-trace',
            coord_frame: 'MOON_ME',
            notes: 'Calculated in browser via M3 Polar 500m DEM',
          };

          setSites((prev) => {
            const filtered = prev.filter((s) => s.id !== newCustomSite.id);
            return [newCustomSite, ...filtered];
          });
          setSelectedSiteId(newCustomSite.id);
          setShowCustomModal(false);
          setCustomError(null);
        } else {
          setCustomError(e.data.error || 'Failed to calculate custom horizon');
        }
      };
    } catch (err) {
      console.error('Failed to initialize horizon worker:', err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Fetch full sites catalog from M6 data
  useEffect(() => {
    let isMounted = true;
    async function loadSites() {
      try {
        const res = await fetch('/data/sites.json');
        if (res.ok) {
          const data: Site[] = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setSites((prev) => {
              // preserve any custom added sites
              const customSites = prev.filter((s) => s.id.startsWith('custom_'));
              return [...customSites, ...data];
            });
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

  // Base landing epoch for the active site
  const siteBaseEpochMs = useMemo(() => {
    const raw = activeSite.date ? `${activeSite.date}T00:00:00Z` : '2026-11-14T09:00:00Z';
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? Date.parse('2026-11-14T09:00:00Z') : parsed;
  }, [activeSite.date]);

  // Compute current UTC timestamp string for the input
  const currentDateTimeISO = useMemo(() => {
    const date = new Date(siteBaseEpochMs + hoursOffset * 3600 * 1000);
    return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
  }, [siteBaseEpochMs, hoursOffset]);

  // Handle user picking an exact calendar date & time
  const handleDateTimeChange = (newIsoString: string) => {
    if (!newIsoString) return;
    const selectedEpochMs = new Date(newIsoString + ':00Z').getTime();
    if (isNaN(selectedEpochMs)) return;
    const diffHours = (selectedEpochMs - siteBaseEpochMs) / (3600 * 1000);
    setHoursOffset(Math.round(diffHours * 10) / 10);
  };

  // Run on-demand calculation for custom coordinates
  const handleComputeCustomPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon)) {
      setCustomError('Please enter valid numerical latitude and longitude.');
      return;
    }

    if (lat > -75) {
      setCustomError('Polar 500m DEM covers poleward of -75°S (Latitude must be between -75° and -90°).');
      return;
    }

    setIsCalculatingCustom(true);
    setCustomError(null);

    workerRef.current?.postMessage({
      lat,
      lon: ((lon % 360) + 360) % 360,
      azStepDeg: 0.5,
      maxRadiusKm: 120,
    });
  };

  // Load real mask JSON if available (from M3 terrain outputs)
  useEffect(() => {
    // If active site is custom and mask already matches, don't overwrite
    if (activeSite.id.startsWith('custom_') && loadedMask && loadedMask.site_id === activeSite.id) {
      return;
    }

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
      if (isMounted && !activeSite.id.startsWith('custom_')) {
        setLoadedMask(null);
      }
    }

    loadMask();
    return () => {
      isMounted = false;
    };
  }, [activeSite.id, loadedMask]);

  // Derived datasets for visualization components
  const mask = useMemo(() => loadedMask || generateHorizonMask(activeSite), [loadedMask, activeSite]);
  const skyState = useMemo(() => computeSkyState(activeSite, hoursOffset, mask), [activeSite, hoursOffset, mask]);
  const countdowns = useMemo(() => computeCountdowns(activeSite, hoursOffset, mask), [activeSite, hoursOffset, mask]);
  const timelineData = useMemo(() => generateTimelineHours(activeSite, mask, 0, 360), [activeSite, mask]);
  const slipData = useMemo(() => generateSlipData(activeSite), [activeSite]);
  const tile3D = useMemo(() => generate3DTile(activeSite), [activeSite]);
  const neighbourhoodCrop = useMemo(() => generateNeighbourhoodCrop(activeSite), [activeSite]);

  return (
    <div className="relative min-h-screen bg-[#020202] text-white font-['Space_Grotesk'] overflow-x-hidden selection:bg-[#ff3d18] selection:text-white">
      {/* Background Ambience consistent with Lunar Hero */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/images/1.avif')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/60" />

      {/* Subtle coordinate guide lines */}
      <div className="pointer-events-none fixed inset-0 z-[2] space-grid opacity-20" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-8 md:px-12">
        {/* Navigation Bar matching Ridgeline Theme */}
        <header className="flex flex-wrap items-center justify-between pb-6 mb-8 border-b border-white/15 gap-4">
          <div className="flex items-center gap-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-[10px] font-['Michroma'] uppercase tracking-[1px] bg-white/10 hover:bg-white hover:text-black border border-white/20 transition duration-200"
              >
                <ArrowLeft size={13} />
                <span>Return to Orbit</span>
              </button>
            )}
            <div>
              <div className="font-['Michroma'] text-[13px] tracking-[2px] uppercase text-white flex items-center gap-2">
                RIDGELINE <span className="opacity-40 italic font-light text-[11px]">| NAVIGATOR</span>
              </div>
              <p className="mt-1 text-[10px] text-white/50 tracking-[0.5px]">
                LUNAR SOUTH POLE SOLAR ILLUMINATION & CONTACT TIMELINE
              </p>
            </div>
          </div>

          {/* Controls: Site Selector, Custom Coordinate Button, Date/Time Picker & Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Site Dropdown */}
            <div className="flex items-center gap-2 bg-black/70 border border-white/20 px-3 py-1.5">
              <Rocket size={13} className="text-[#ff3d18]" />
              <select
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setHoursOffset(0);
                  setSlipDays(0);
                }}
                className="bg-transparent text-white text-[11px] font-medium outline-none cursor-pointer tracking-[0.5px]"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id} className="bg-[#111] text-white">
                    {site.name} ({site.lat.toFixed(1)}° Lat)
                  </option>
                ))}
              </select>
              {loadedMask && (
                <span className="text-[8px] font-['Michroma'] bg-[#ff3d18]/20 text-[#ff7052] border border-[#ff3d18]/40 px-2 py-0.5 uppercase tracking-[0.5px]">
                  {loadedMask.dems_used?.includes('dem_polar_500m.bin') ? 'POLAR 500M DEM' : `LOLA DEM ${loadedMask.az_step_deg}°`}
                </span>
              )}
            </div>

            {/* Custom Coordinates Trigger Button */}
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white hover:text-black border border-white/25 px-3 py-2 text-[10px] font-['Michroma'] uppercase tracking-[1px] transition"
              title="Calculate on-demand for any custom lunar coordinates"
            >
              <MapPin size={12} className="text-[#ff3d18]" />
              <span>Custom Point</span>
            </button>

            {/* Date & Time Picker */}
            <div className="flex items-center gap-2 bg-black/70 border border-white/20 px-3 py-1.5">
              <Calendar size={13} className="text-white/60" />
              <div className="flex flex-col">
                <span className="text-[7px] font-['Michroma'] uppercase tracking-[1px] text-white/40">
                  UTC Epoch
                </span>
                <input
                  type="datetime-local"
                  value={currentDateTimeISO}
                  onChange={(e) => handleDateTimeChange(e.target.value)}
                  className="bg-transparent text-white text-[11px] font-mono outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
              <div className="border-l border-white/15 pl-2 flex items-center gap-1 text-[10px] font-mono text-[#ff4d2b]">
                <Clock size={11} />
                <span>{hoursOffset >= 0 ? `+${hoursOffset.toFixed(1)}h` : `${hoursOffset.toFixed(1)}h`}</span>
              </div>
            </div>

            {/* Mode Switch (Explore vs Plan) */}
            <div className="flex border border-white/20 bg-black/60 p-0.5">
              <button
                type="button"
                onClick={() => setMode('explore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-['Michroma'] tracking-[1px] uppercase transition ${
                  mode === 'explore'
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Eye size={12} />
                Explore
              </button>
              <button
                type="button"
                onClick={() => setMode('plan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-['Michroma'] tracking-[1px] uppercase transition ${
                  mode === 'plan'
                    ? 'bg-[#ff3d18] text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Terminal size={12} />
                Plan (Eng)
              </button>
            </div>
          </div>
        </header>

        {/* Custom Point Modal Popup */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/20 p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
                <div className="flex items-center gap-2 font-['Michroma'] text-[12px] uppercase tracking-[1px] text-white">
                  <Sparkles size={14} className="text-[#ff3d18]" />
                  <span>Custom Lunar Point Calculation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="text-white/50 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-white/60 mb-4 leading-relaxed">
                Enter any coordinates poleward of <span className="text-white font-mono">-75°S</span>. The browser will ray-trace 720 horizon angles directly from Thiran&apos;s <span className="text-[#ff4d2b] font-mono">dem_polar_500m.bin</span> in real time.
              </p>

              <form onSubmit={handleComputeCustomPoint} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-['Michroma'] uppercase tracking-[1px] text-white/50 mb-1">
                      Latitude (°S, -75 to -90)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="-90"
                      max="-75"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      placeholder="-89.4"
                      className="w-full bg-black/80 border border-white/20 px-3 py-2 text-white font-mono text-[12px] outline-none focus:border-[#ff3d18]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-['Michroma'] uppercase tracking-[1px] text-white/50 mb-1">
                      Longitude (°E, 0 to 360)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="-360"
                      max="360"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      placeholder="145.2"
                      className="w-full bg-black/80 border border-white/20 px-3 py-2 text-white font-mono text-[12px] outline-none focus:border-[#ff3d18]"
                      required
                    />
                  </div>
                </div>

                {customError && (
                  <div className="text-[10px] text-red-400 bg-red-950/40 border border-red-800/60 p-2">
                    {customError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 text-[10px] font-['Michroma'] uppercase tracking-[1px] text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCalculatingCustom}
                    className="flex items-center gap-2 bg-[#ff3d18] hover:bg-[#ff4d2b] disabled:bg-[#ff3d18]/50 text-white px-5 py-2 text-[10px] font-['Michroma'] uppercase tracking-[1px] transition"
                  >
                    {isCalculatingCustom ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Ray-Tracing 500m DEM...</span>
                      </>
                    ) : (
                      <span>Trace Horizon & Evaluate</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex flex-col gap-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        {/* Footer Consistent with Home Page */}
        <footer className="mt-16 pt-6 border-t border-white/15 flex flex-wrap justify-between items-center text-[10px] text-white/40 tracking-[0.5px]">
          <div>
            <span>Verified against JPL Horizons & NASA PGDA (69, 78, 90) • MOON_ME frame (1737.4 km)</span>
          </div>
          <div>
            <span className="font-['Michroma'] uppercase tracking-[1px] text-white/50">NASA Space Apps Challenge 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Navigator;
