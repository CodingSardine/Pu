import React, { useMemo, memo, useRef, useCallback, useState } from 'react';
import { Search, SlidersHorizontal, X, Plus, Minus, Home, UtensilsCrossed, Focus, Coffee } from 'lucide-react';
import LocationCard, { type PlaceApiData } from './LocationCard';
import LiveMap from './LiveMap';
import { useEffect } from 'react';
import type L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { LOCATIONS_BY_MODE } from '../data/locations';

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

interface LocationEntry {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  hours?: string;
  cuisine?: string;
  price?: string;
  atmosphere?: string;
  seating?: string;
  gmaps?: string;
  features: string[];
  mode?: Mode;
}

interface MapViewProps {
  selectedMode: Mode;
  showAllMarkers: boolean;
  selectedLocation: string | null;
  onLocationSelect: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  searchExpanded: boolean;
  onSearchExpandedChange: (expanded: boolean) => void;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (expanded: boolean) => void;
  placeData: Record<string, PlaceApiData>;
  onModeChange: (mode: Mode) => void;
}

const MODE_COLORS = {
  eat: { main: '#0ea5a6', light: 'rgba(14, 165, 166, 0.15)' },
  focus: { main: '#fb7185', light: 'rgba(251, 113, 133, 0.15)' },
  chill: { main: '#818cf8', light: 'rgba(129, 140, 248, 0.15)' },
} as const;

const MODE_COLORS_LIGHT = {
  eat: { main: '#0f766e', light: 'rgba(15, 118, 110, 0.15)' },
  focus: { main: '#be123c', light: 'rgba(190, 18, 60, 0.15)' },
  chill: { main: '#4338ca', light: 'rgba(67, 56, 202, 0.15)' },
} as const;

function getModeColorData(mode: Mode, theme: 'dark' | 'light') {
  return theme === 'light' ? MODE_COLORS_LIGHT[mode] : MODE_COLORS[mode];
}

const FILTER_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'power', label: 'Power Outlets' },
  { id: 'laptop-friendly', label: 'Laptop Friendly' },
  { id: 'outdoor', label: 'Outdoor Seating' },
  { id: 'indoor', label: 'Indoor Seating' },
  { id: 'rooftop', label: 'Rooftop' },
  { id: 'pet-friendly', label: 'Pet Friendly' },
  { id: 'quiet', label: 'Quiet' },
  { id: 'lively', label: 'Lively' },
  { id: 'budget', label: '€' },
  { id: 'premium', label: '€€€' },
];

// Floating Search Bar
const FloatingSearchBar = memo(function FloatingSearchBar({
  searchQuery,
  onSearchChange,
  onClose,
  modeColor,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  modeColor: string;
}) {
  const theme = useTheme();
  const [closing, setClosing] = useState(false);
  const panelBg = theme === 'dark' ? 'bg-slate-800/95' : 'bg-white/95';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const placeholderStyle = theme === 'dark' ? 'placeholder:text-slate-400' : 'placeholder:text-slate-500';
  const iconColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), 220);
  }, [closing, onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [requestClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[999] bg-black/20 ${closing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        onClick={requestClose}
      />
      <div className="fixed left-1/2 top-8 z-[1002] w-full max-w-2xl -translate-x-1/2 px-4">
        <div
          className={`rounded-2xl ${panelBg} shadow-2xl backdrop-blur-xl border ${closing ? 'animate-panel-out' : 'animate-panel-in'}`}
          style={{
            borderColor: `${modeColor}40`,
            boxShadow: `0 0 40px ${modeColor}20, 0 8px 32px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="relative">
            <Search size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 ${iconColor}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for cafes, workspaces, or chill spots..."
              autoFocus
              className={`w-full rounded-2xl ${panelBg} ${textColor} ${placeholderStyle} py-4 pr-14 pl-14 text-base outline-none`}
              style={{ background: 'transparent' }}
            />
            <button
              onClick={requestClose}
              className={`absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes panelIn { from { opacity: 0; transform: translateY(-12px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes panelOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.99); } }
        .animate-overlay-in { animation: overlayIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-overlay-out { animation: overlayOut 220ms cubic-bezier(0.4, 0, 1, 1) both; }
        .animate-panel-in { animation: panelIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-panel-out { animation: panelOut 220ms cubic-bezier(0.4, 0, 1, 1) both; }
      `}</style>
    </>
  );
});

// Floating Filters Panel
const FloatingFiltersPanel = memo(function FloatingFiltersPanel({
  activeFilters,
  onFiltersChange,
  onClose,
  modeColor,
}: {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  onClose: () => void;
  modeColor: string;
}) {
  const theme = useTheme();
  const [closing, setClosing] = useState(false);
  const panelBg = theme === 'dark' ? 'bg-slate-800/95' : 'bg-white/95';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  const toggleFilter = (filterId: string) => {
    if (activeFilters.includes(filterId)) {
      onFiltersChange(activeFilters.filter((f) => f !== filterId));
    } else {
      onFiltersChange([...activeFilters, filterId]);
    }
  };

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onClose(), 220);
  }, [closing, onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [requestClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[999] bg-black/20 ${closing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        onClick={requestClose}
      />
      <div className="fixed left-20 top-8 z-[1002] w-80 px-4">
        <div
          className={`rounded-2xl ${panelBg} p-6 shadow-2xl backdrop-blur-xl border ${closing ? 'animate-panel-out' : 'animate-panel-in'}`}
          style={{
            borderColor: `${modeColor}40`,
            boxShadow: `0 0 40px ${modeColor}20, 0 8px 32px rgba(0,0,0,0.3)`,
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={20} className={subTextColor} />
              <h3 className={`font-semibold ${textColor} text-lg`}>Filters</h3>
            </div>
            <button
              onClick={requestClose}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : theme === 'dark'
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                  style={{
                    backgroundColor: isActive ? modeColor : undefined,
                    boxShadow: isActive ? `0 0 20px ${modeColor}40, 0 4px 12px ${modeColor}30` : undefined,
                  }}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {activeFilters.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${subTextColor}`}>
                  {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={() => onFiltersChange([])}
                  className="text-sm font-medium transition-colors"
                  style={{ color: modeColor }}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes panelIn { from { opacity: 0; transform: translateY(-12px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes panelOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.99); } }
        .animate-overlay-in { animation: overlayIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-overlay-out { animation: overlayOut 220ms cubic-bezier(0.4, 0, 1, 1) both; }
        .animate-panel-in { animation: panelIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-panel-out { animation: panelOut 220ms cubic-bezier(0.4, 0, 1, 1) both; }
      `}</style>
    </>
  );
});

// All-markers mode legend overlay
const AllMarkersLegend = memo(function AllMarkersLegend({ theme }: { theme: Theme }) {
  const panelBg = theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80';
  const textColor = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';

  const modes = [
    { key: 'eat' as Mode, label: 'Eat', icon: <UtensilsCrossed size={13} />, color: theme === 'dark' ? '#14b8a6' : '#2a9d8f' },
    { key: 'focus' as Mode, label: 'Focus', icon: <Focus size={13} />, color: theme === 'dark' ? '#f43f5e' : '#9b2335' },
    { key: 'chill' as Mode, label: 'Chill', icon: <Coffee size={13} />, color: theme === 'dark' ? '#6366f1' : '#4a5568' },
  ];

  return (
    <div
      className={`absolute top-4 right-4 z-[600] flex flex-col gap-1.5 rounded-2xl px-4 py-3 backdrop-blur-xl border`}
      style={{
        background: theme === 'dark' ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.82)',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        animation: 'legendFadeIn 0.4s ease forwards',
      }}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        All Places
      </p>
      {modes.map((m) => (
        <div key={m.key} className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ backgroundColor: m.color, color: 'white' }}
          >
            {m.icon}
          </span>
          <span className={`text-xs font-medium ${textColor}`}>{m.label}</span>
          <span
            className="ml-auto text-[10px] font-bold"
            style={{ color: m.color }}
          >
            27
          </span>
        </div>
      ))}
      <div
        className="mt-1 pt-2"
        style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}
      >
        <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          81 places · tap to explore
        </span>
      </div>
    </div>
  );
});

export default function MapView({
  selectedMode,
  showAllMarkers,
  selectedLocation,
  onLocationSelect,
  searchQuery = '',
  onSearchChange,
  activeFilters = [],
  onFiltersChange,
  searchExpanded,
  onSearchExpandedChange,
  filtersExpanded,
  onFiltersExpandedChange,
  placeData,
  onModeChange,
}: MapViewProps) {
  const theme = useTheme();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Locations come from `src/app/data/locations.ts`.
  // If `locations.resolved.json` is populated, it will include lat/lng + placeId + googleMapsUri.
  const locations = useMemo<Record<Mode, LocationEntry[]>>(() => {
    const toEntry = (l: any): LocationEntry => ({
      id: l.id,
      name: l.name,
      mode: l.mode,
      features: Array.isArray(l.features) ? l.features : [],
      lat: typeof l.lat === 'number' ? l.lat : NaN,
      lng: typeof l.lng === 'number' ? l.lng : NaN,
    });
    return {
      eat: (LOCATIONS_BY_MODE.eat as any[]).map(toEntry),
      focus: (LOCATIONS_BY_MODE.focus as any[]).map(toEntry),
      chill: (LOCATIONS_BY_MODE.chill as any[]).map(toEntry),
    };
  }, []);

  const currentLocations = useMemo(() => locations[selectedMode], [locations, selectedMode]);

  // All locations flat list for all-markers mode
  const allLocations = useMemo(
    () => [...locations.eat, ...locations.focus, ...locations.chill],
    [locations]
  );

  // Quick sanity checks for duplicates (ids / exact coordinates).
  useEffect(() => {
    const byId = new Map<string, number>();
    const byCoord = new Map<string, string[]>();
    for (const loc of allLocations) {
      byId.set(loc.id, (byId.get(loc.id) ?? 0) + 1);
      if (!Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) continue;
      const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
      const arr = byCoord.get(key) ?? [];
      arr.push(loc.id);
      byCoord.set(key, arr);
    }
    // If you need duplicate diagnostics, re-enable logging here.
    // const dupIds = [...byId.entries()].filter(([, n]) => n > 1);
    const dupCoords = [...byCoord.entries()].filter(([, ids]) => ids.length > 1);
    void dupCoords;
  }, [allLocations]);

  // Apply search (name + cuisine) and feature filters
  const filteredLocations = useMemo(() => {
    const source = showAllMarkers ? allLocations : currentLocations;
    let result = source;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          (loc.cuisine && loc.cuisine.toLowerCase().includes(q))
      );
    }

    if (activeFilters.length > 0) {
      const predicates: Record<string, (loc: LocationEntry) => boolean> = {
        wifi: (loc) => loc.features.includes('wifi'),
        power: (loc) => loc.features.includes('power'),
        'laptop-friendly': (loc) => loc.features.includes('wifi') && loc.features.includes('power'),
        outdoor: (loc) => loc.features.includes('outdoor') || /outdoor|terrace|patio|courtyard|garden/i.test(loc.seating ?? ''),
        indoor: (loc) => /indoor|inside/i.test(loc.seating ?? ''),
        rooftop: (loc) => /roof/i.test(loc.seating ?? '') || /rooftop/i.test(loc.atmosphere ?? ''),
        'pet-friendly': (loc) => loc.features.includes('pet-friendly'),
        quiet: (loc) => /quiet|calm|focused|study|minimal/i.test(loc.atmosphere ?? ''),
        lively: (loc) => /lively|vibrant|busy|energetic|playful/i.test(loc.atmosphere ?? ''),
        budget: (loc) => loc.features.includes('budget') || loc.price === '€',
        premium: (loc) => loc.features.includes('premium') || loc.price === '€€€',
      };

      result = result.filter((loc) =>
        activeFilters.every((f) => (predicates[f] ? predicates[f](loc) : loc.features.includes(f)))
      );
    }

    return result;
  }, [currentLocations, allLocations, showAllMarkers, searchQuery, activeFilters]);

  const colorData = getModeColorData(selectedMode, theme);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const prevSelectedLocationRef = useRef<string | null>(null);

  const handleZoomIn = () => { if (mapInstanceRef.current) mapInstanceRef.current.zoomIn(); };
  const handleZoomOut = () => { if (mapInstanceRef.current) mapInstanceRef.current.zoomOut(); };
  const handleResetView = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.setView([35.1720, 33.3620], 14);
  };

  const bgColor = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const controlBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const controlHover = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const controlText = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';

  // Derive card data — only show if the selected location is in the filtered set
  const allLocationsFlat = useMemo(() => [...locations.eat, ...locations.focus, ...locations.chill], [locations]);
  const selectedLocationData = allLocationsFlat.find((l) => l.id === selectedLocation) ?? null;
  const selectedLocationMode = selectedLocationData?.mode ?? selectedMode;
  const isSelectedVisible = filteredLocations.some((l) => l.id === selectedLocation);

  useEffect(() => {
    if (selectedLocation && !isSelectedVisible) {
      onLocationSelect(null);
    }
  }, [selectedLocation, isSelectedVisible, onLocationSelect]);

  // When a card is closed (selection cleared), return focus to the last selected marker.
  useEffect(() => {
    const prevId = prevSelectedLocationRef.current;
    if (prevId && !selectedLocation && mapInstanceRef.current) {
      const loc = allLocationsFlat.find((l) => l.id === prevId);
      const pd = placeData[prevId] ?? null;
      const lat = pd?.lat ?? loc?.lat;
      const lng = pd?.lng ?? loc?.lng;
      if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
        mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.4 });
      }
    }
    prevSelectedLocationRef.current = selectedLocation;
  }, [selectedLocation, allLocationsFlat, placeData]);

  // When a marker is clicked, just select it (don't switch modes in all-markers view)
  const handleLocationSelect = (id: string | null) => {
    onLocationSelect(id);
  };

  const handleSearchPanelClose = useCallback(() => {
    onSearchExpandedChange(false);
  }, [onSearchExpandedChange]);

  const handleFiltersPanelClose = useCallback(() => {
    onFiltersExpandedChange(false);
  }, [onFiltersExpandedChange]);

  return (
    <div className={`absolute inset-0 left-0 sm:left-16 transition-colors duration-300 ${bgColor}`}>
      {/* Legend keyframes */}
      <style>{`
        @keyframes legendFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Live Map — receives filtered locations with per-location mode color in all-markers mode */}
      <div className="h-full w-full">
        <LiveMap
          selectedMode={selectedMode}
          showAllMarkers={showAllMarkers}
          locations={filteredLocations
            .map((l) => {
              const pd = placeData[l.id] ?? null;
              const lat = pd?.lat ?? l.lat;
              const lng = pd?.lng ?? l.lng;
              return { ...l, lat, lng };
            })
            .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onMapReady={(map) => { mapInstanceRef.current = map; }}
          allLocations={allLocationsFlat}
        />
      </div>

      {/* All-markers legend */}
      {showAllMarkers && <AllMarkersLegend theme={theme} />}

      {/* Custom Zoom Controls */}
      <div
        className="absolute right-4 z-[500] flex flex-col gap-2"
        style={{
          // On mobile, lift controls above the bottom control bar + safe area.
          bottom: isMobile
            ? 'calc(max(env(safe-area-inset-bottom), 0px) + 104px)'
            : 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        <button onClick={handleZoomIn} className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`} aria-label="Zoom in">
          <Plus size={20} className={controlText} />
        </button>
        <button onClick={handleResetView} className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`} aria-label="Reset view">
          <Home size={20} className={controlText} />
        </button>
        <button onClick={handleZoomOut} className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`} aria-label="Zoom out">
          <Minus size={20} className={controlText} />
        </button>
      </div>

      {/* Location Card — only shown when selected location passes current filters */}
      {selectedLocation && isSelectedVisible && (
        <div
          className="
            absolute z-[1300] overflow-y-auto
            left-0 right-0 bottom-0 top-auto translate-y-0
            w-full max-h-[70vh] px-3 pb-3
            sm:left-4 sm:right-auto sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:px-0 sm:pb-0
            sm:w-[360px] lg:w-[400px] xl:w-[448px] sm:max-h-[calc(100vh-2rem)]
          "
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
        >
          <LocationCard
            locationId={selectedLocation}
            locationData={selectedLocationData}
            onClose={() => onLocationSelect(null)}
            mode={selectedLocationMode}
            placeData={placeData[selectedLocation] ?? null}
          />
        </div>
      )}

      {/* Search + Filter panels */}
      {searchExpanded && (
        <FloatingSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClose={handleSearchPanelClose}
          modeColor={colorData.main}
        />
      )}
      {filtersExpanded && (
        <FloatingFiltersPanel
          activeFilters={activeFilters}
          onFiltersChange={onFiltersChange}
          onClose={handleFiltersPanelClose}
          modeColor={colorData.main}
        />
      )}
    </div>
  );
}
