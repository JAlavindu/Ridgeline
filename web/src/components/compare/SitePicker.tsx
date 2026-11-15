import { useMemo, useState } from "react";
import type { LunarSite } from "../../data/lunarSites";

interface Props {
  sites: LunarSite[];
  selectedSites: LunarSite[];
  onSelect: (siteId: string) => void;
  onClose: () => void;
}

export default function SitePicker({
  sites = [],
  selectedSites = [],
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const availableSites = useMemo(() => {
    const selectedIds = new Set(selectedSites.map((site) => site.id));

    return sites.filter((site) => {
      if (selectedIds.has(site.id)) return false;

      const query = search.toLowerCase().trim();

      if (!query) return true;

      return (
        site.name.toLowerCase().includes(query) ||
        String(site.latitude).includes(query) ||
        String(site.longitude).includes(query)
      );
    });
  }, [sites, selectedSites, search]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#111]/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-white">Add landing site</p>
            <p className="mt-1 text-xs text-white/40">
              Choose a location to compare.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search landing sites..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
          />

          <div className="mt-4 max-h-[55vh] overflow-y-auto">
            {availableSites.length > 0 ? (
              <div className="space-y-1">
                {availableSites.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => onSelect(site.id)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="text-sm text-white">{site.name}</p>
                      <p className="mt-1 text-xs text-white/35">
                        {site.latitude}° · {site.longitude}°
                      </p>
                    </div>

                    <span className="text-lg text-white/30">+</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-white/50">
                  No landing sites found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}