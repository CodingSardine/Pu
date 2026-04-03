import { useEffect, useMemo, memo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X, Menu, Plus, Minus, Home } from 'lucide-react';
import LocationCard from './LocationCard';
import LiveMap from './LiveMap';
import type L from 'leaflet';

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

interface MapViewProps {
  selectedMode: Mode;
  selectedLocation: string | null;
  onLocationSelect: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  theme: Theme;
  searchExpanded: boolean;
  onSearchExpandedChange: (expanded: boolean) => void;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (expanded: boolean) => void;
}

// Mode colors
const MODE_COLORS = {
  eat: { main: '#14b8a6', light: 'rgba(20, 184, 166, 0.15)' },
  focus: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.15)' },
  chill: { main: '#6366f1', light: 'rgba(99, 102, 241, 0.15)' },
} as const;

// Filter options
const FILTER_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'power', label: 'Power Outlets' },
  { id: 'outdoor', label: 'Outdoor Seating' },
  { id: 'pet-friendly', label: 'Pet Friendly' },
  { id: 'budget', label: '\u20ac' },
  { id: 'premium', label: '\u20ac\u20ac\u20ac' },
];

// Floating Search Bar
const FloatingSearchBar = memo(function FloatingSearchBar({ 
  searchQuery, 
  onSearchChange, 
  onClose, 
  theme, 
  modeColor 
}: { 
  searchQuery: string; 
  onSearchChange: (query: string) => void; 
  onClose: () => void; 
  theme: Theme; 
  modeColor: string;
}) {
  const panelBg = theme === 'dark' ? 'bg-slate-800/95' : 'bg-white/95';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const placeholderStyle = theme === 'dark' ? 'placeholder:text-slate-400' : 'placeholder:text-slate-500';
  const iconColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[999] bg-black/20"
        onClick={onClose}
      />
      
      {/* Floating Search Bar */}
      <div className="fixed left-1/2 top-8 z-[1002] w-full max-w-2xl -translate-x-1/2 px-4">
        <div className={`rounded-2xl ${panelBg} shadow-2xl backdrop-blur-xl border`}
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
              style={{
                background: 'transparent',
              }}
            />
            <button
              onClick={onClose}
              className={`absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

// Floating Filters Panel
const FloatingFiltersPanel = memo(function FloatingFiltersPanel({ 
  activeFilters, 
  onFiltersChange, 
  onClose, 
  theme, 
  modeColor 
}: { 
  activeFilters: string[]; 
  onFiltersChange: (filters: string[]) => void; 
  onClose: () => void; 
  theme: Theme; 
  modeColor: string;
}) {
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[999] bg-black/20"
        onClick={onClose}
      />
      
      {/* Floating Filters Panel */}
      <div className="fixed left-20 top-8 z-[1002] w-80 px-4">
        <div 
          className={`rounded-2xl ${panelBg} p-6 shadow-2xl backdrop-blur-xl border`}
          style={{
            borderColor: `${modeColor}40`,
            boxShadow: `0 0 40px ${modeColor}20, 0 8px 32px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={20} className={subTextColor} />
              <h3 className={`font-semibold ${textColor} text-lg`}>Filters</h3>
            </div>
            <button
              onClick={onClose}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                theme === 'dark' ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Filter Pills */}
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

          {/* Active count */}
          {activeFilters.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${subTextColor}`}>
                  {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={() => onFiltersChange([])}
                  className={`text-sm font-medium transition-colors`}
                  style={{ color: modeColor }}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default function MapView({ 
  selectedMode, 
  selectedLocation, 
  onLocationSelect, 
  searchQuery = '', 
  onSearchChange, 
  activeFilters = [], 
  onFiltersChange, 
  theme = 'dark',
  searchExpanded,
  onSearchExpandedChange,
  filtersExpanded,
  onFiltersExpandedChange
}: MapViewProps) {
  // Locations data with real lat/lng coordinates
  const locations = useMemo(() => ({
    eat: [
      { id: 'avo', lat: 35.1712, lng: 33.3616, name: 'Avo Armenian Food' },
      { id: 'location2', lat: 35.1698, lng: 33.3701, name: 'Falafel No.1' },
      { id: 'location3', lat: 35.1756, lng: 33.3744, name: 'Old Town Kitchen' },
    ],
    focus: [
      { id: 'yfantourgeio', lat: 35.1741, lng: 33.3601, name: 'Yfantourgeio' },
      { id: 'location5', lat: 35.1789, lng: 33.3623, name: 'State Coffee' },
      { id: 'location6', lat: 35.1712, lng: 33.3667 },
    ],
    chill: [
      { id: 'k11', lat: 35.1756, lng: 33.3612, name: 'K11' },
      { id: 'location8', lat: 35.1734, lng: 33.3689 },
      { id: 'location9', lat: 35.1801, lng: 33.3701 },
    ],
  }), []);

  const currentLocations = useMemo(() => locations[selectedMode], [locations, selectedMode]);

  const colorData = MODE_COLORS[selectedMode];

  // Leaflet map instance ref
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([35.1856, 33.3823], 14);
    }
  };

  // Theme-based colors
  const bgColor = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const controlBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const controlHover = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const controlText = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';

  return (
    <div className={`absolute inset-0 left-16 transition-colors duration-300 ${bgColor}`}>
      {/* Live Map */}
      <div className="h-full w-full">
        <LiveMap 
          selectedMode={selectedMode}
          locations={currentLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={(id) => onLocationSelect(id)}
          onMapReady={(map) => { mapInstanceRef.current = map; }}
          theme={theme}
        />
      </div>

      {/* Custom Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`}
          aria-label="Zoom in"
        >
          <Plus size={20} className={controlText} />
        </button>
        <button
          onClick={handleResetView}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`}
          aria-label="Reset view"
        >
          <Home size={20} className={controlText} />
        </button>
        <button
          onClick={handleZoomOut}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${controlBg} shadow-lg transition-all duration-200 ${controlHover}`}
          aria-label="Zoom out"
        >
          <Minus size={20} className={controlText} />
        </button>
      </div>

      {/* Location Card */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-20 right-4 z-[1000] mx-auto max-w-md">
          <LocationCard
            locationId={selectedLocation}
            onClose={() => onLocationSelect(null)}
            mode={selectedMode}
          />
        </div>
      )}

      {/* Modals */}
      {searchExpanded && <FloatingSearchBar 
        searchQuery={searchQuery} 
        onSearchChange={onSearchChange} 
        onClose={() => onSearchExpandedChange(false)} 
        theme={theme} 
        modeColor={colorData.main}
      />}
      {filtersExpanded && <FloatingFiltersPanel 
        activeFilters={activeFilters} 
        onFiltersChange={onFiltersChange} 
        onClose={() => onFiltersExpandedChange(false)} 
        theme={theme} 
        modeColor={colorData.main}
      />}
    </div>
  );
}