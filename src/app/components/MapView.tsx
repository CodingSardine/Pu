import { useMemo, memo, useRef } from 'react';
import { Search, SlidersHorizontal, X, Plus, Minus, Home, UtensilsCrossed, Focus, Coffee } from 'lucide-react';
import LocationCard, { type PlaceApiData } from './LocationCard';
import LiveMap from './LiveMap';
import { useEffect } from 'react';
import type L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

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
  eat: { main: '#14b8a6', light: 'rgba(20, 184, 166, 0.15)' },
  focus: { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.15)' },
  chill: { main: '#6366f1', light: 'rgba(99, 102, 241, 0.15)' },
} as const;

const MODE_COLORS_LIGHT = {
  eat: { main: '#2a9d8f', light: 'rgba(42, 157, 143, 0.15)' },
  focus: { main: '#9b2335', light: 'rgba(155, 35, 53, 0.15)' },
  chill: { main: '#4a5568', light: 'rgba(74, 85, 104, 0.15)' },
} as const;

function getModeColorData(mode: Mode, theme: 'dark' | 'light') {
  return theme === 'light' ? MODE_COLORS_LIGHT[mode] : MODE_COLORS[mode];
}

const FILTER_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'power', label: 'Power Outlets' },
  { id: 'outdoor', label: 'Outdoor Seating' },
  { id: 'pet-friendly', label: 'Pet Friendly' },
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
  const panelBg = theme === 'dark' ? 'bg-slate-800/95' : 'bg-white/95';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const placeholderStyle = theme === 'dark' ? 'placeholder:text-slate-400' : 'placeholder:text-slate-500';
  const iconColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/20" onClick={onClose} />
      <div className="fixed left-1/2 top-8 z-[1002] w-full max-w-2xl -translate-x-1/2 px-4">
        <div
          className={`rounded-2xl ${panelBg} shadow-2xl backdrop-blur-xl border`}
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
  modeColor,
}: {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  onClose: () => void;
  modeColor: string;
}) {
  const theme = useTheme();
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
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/20" onClick={onClose} />
      <div className="fixed md:left-20 left-4 right-4 md:right-auto top-8 z-[1002] md:w-80 w-auto px-0 md:px-4">
        <div
          className={`rounded-2xl ${panelBg} p-6 shadow-2xl backdrop-blur-xl border`}
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
              onClick={onClose}
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
            7
          </span>
        </div>
      ))}
      <div
        className="mt-1 pt-2"
        style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}
      >
        <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          21 places · tap to explore
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

  // All 21 locations — 7 per mode — with full metadata and feature tags
  const locations = useMemo<Record<Mode, LocationEntry[]>>(
    () => ({
      eat: [
        { id: 'avo', lat: 35.1712, lng: 33.3616, name: 'Avo Armenian Food', address: 'Onasagorou, Nicosia 1011', hours: '8am – 6pm', cuisine: 'Armenian + Cypriot', price: '€', atmosphere: 'Lively', seating: 'Very Limited', gmaps: 'https://www.google.com/maps/search/?api=1&query=Avo+Armenian+Food+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'piatsa', lat: 35.1735, lng: 33.3621, name: 'Piatsa Gourounaki', address: 'Klimentos 4, Nicosia 1060', hours: '12pm – 11pm', cuisine: 'Mediterranean BBQ', price: '€€', atmosphere: 'Vibrant', seating: 'Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Piatsa+Gourounaki+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'zanettos', lat: 35.1748, lng: 33.3607, name: 'Zanettos Tavern', address: 'Trikoupi 65, Nicosia 1016', hours: '5pm – 11pm', cuisine: 'Traditional Cypriot', price: '€€', atmosphere: 'Authentic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Zanettos+Tavern+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'toanamma', lat: 35.1720, lng: 33.3580, name: 'To Anamma', address: 'Ledras 64, Nicosia 1011', hours: '11am – 11pm', cuisine: 'Cypriot Modern', price: '€€', atmosphere: 'Cozy Courtyard', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=To+Anamma+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'elysian', lat: 35.1705, lng: 33.3640, name: 'Elysian Fusion Kitchen', address: 'Old Town, Nicosia', hours: '9am – 9pm', cuisine: 'Plant-Based Fusion', price: '€', atmosphere: 'Relaxed', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=Elysian+Fusion+Kitchen+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'falafel', lat: 35.1698, lng: 33.3701, name: 'Falafel Abu Dany', address: 'Arsinois, Nicosia 1011', hours: '10am – 8pm', cuisine: 'Middle Eastern', price: '€', atmosphere: 'Casual', seating: 'Takeaway + Counter', gmaps: 'https://www.google.com/maps/search/?api=1&query=Falafel+Abu+Dany+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'bellavita', lat: 35.1729, lng: 33.3658, name: 'Bella Vita', address: 'Old Town, Nicosia', hours: '12pm – 11pm', cuisine: 'Italian', price: '€€€', atmosphere: 'Garden Dining', seating: 'Garden', gmaps: 'https://www.google.com/maps/search/?api=1&query=Bella+Vita+Restaurant+Nicosia', features: ['premium', 'outdoor', 'pet-friendly'], mode: 'eat' },
      ],
      focus: [
        { id: 'yfantourgeio', lat: 35.1741, lng: 33.3601, name: 'Yfantourgeio', address: 'Ermou 66, Nicosia 1011', hours: '8am – 10pm', cuisine: 'Coworking + Coffee', price: '€€', atmosphere: 'Creative', seating: 'Flexible Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Yfantourgeio+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'brewlab', lat: 35.1710, lng: 33.3575, name: 'Brew Lab', address: 'Stasikratous 3, Nicosia 1066', hours: '7am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Focused', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Brew+Lab+Stasikratous+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'workshop', lat: 35.1695, lng: 33.3625, name: 'The Workshop Cafe', address: 'Old Town, Nicosia', hours: '8am – 6pm', cuisine: 'Coffee & Pastries', price: '€', atmosphere: 'Quiet & Studious', seating: 'Tables + Outlets', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Workshop+Cafe+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'think30', lat: 35.1700, lng: 33.3555, name: 'Think 30', address: 'Stasikratous, Nicosia', hours: '8am – 8pm', cuisine: 'Coffee & Bites', price: '€€', atmosphere: 'Modern', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Think+30+Stasikratous+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'kofee', lat: 35.1725, lng: 33.3638, name: 'A Kxofee Project', address: 'Nicosia Old Town', hours: '7:30am – 5pm', cuisine: 'Specialty Coffee', price: '€', atmosphere: 'Busy & Creative', seating: 'Limited + Laptop-Friendly', gmaps: 'https://www.google.com/maps/search/?api=1&query=A+Kxofee+Project+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'hub', lat: 35.1757, lng: 33.3596, name: 'The Hub Nicosia', address: 'Ermou, Nicosia', hours: '9am – 8pm', cuisine: 'Coworking Space', price: '€€', atmosphere: 'Professional', seating: 'Hot Desks + Meeting Rooms', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Hub+Nicosia+Coworking', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'pieto', lat: 35.1716, lng: 33.3608, name: 'Pieto Coffee', address: 'Old Town, Nicosia', hours: '7am – 6pm', cuisine: 'Artisan Coffee', price: '€', atmosphere: 'Minimalist', seating: 'Counter + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Pieto+Coffee+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
      ],
      chill: [
        { id: 'k11', lat: 35.1691, lng: 33.3649, name: 'Kafeneio 11', address: 'Soutsou & Pyreos Corner, Nicosia 1016', hours: '12pm – 12am (Mon Closed)', cuisine: 'Coffee + Drinks', price: '€', atmosphere: 'Traditional Cypriot', seating: 'Indoor + Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kafeneio+11+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'balza', lat: 35.1680, lng: 33.3587, name: 'Bálza Rooftop Bar', address: 'Evagoras, Megaro Hadjisavva, Nicosia', hours: '8pm – 1am', cuisine: 'Cocktails + Dining', price: '€€€', atmosphere: 'Rooftop Vibes', seating: 'Rooftop Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Balza+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'halara', lat: 35.1745, lng: 33.3632, name: 'Halara Cafe', address: 'Old Town, Nicosia', hours: '9am – 12am', cuisine: 'Coffee & Cocktails', price: '€', atmosphere: 'Laid-Back', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Halara+Cafe+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'municipal', lat: 35.1690, lng: 33.3565, name: 'Nicosia Municipal Gardens', address: 'Mouseiou, Nicosia', hours: 'All day', cuisine: 'Park', price: 'Free', atmosphere: 'Green & Peaceful', seating: 'Benches + Lawn', gmaps: 'https://www.google.com/maps/search/?api=1&query=Nicosia+Municipal+Gardens', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'skyview', lat: 35.1675, lng: 33.3610, name: 'SkyView Rooftop Bar', address: 'Nicosia Center', hours: '6pm – 1am', cuisine: 'Cocktails', price: '€€€', atmosphere: 'Sunset Views', seating: 'Rooftop', gmaps: 'https://www.google.com/maps/search/?api=1&query=SkyView+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'famagusta', lat: 35.1718, lng: 33.3710, name: 'Famagusta Gate Area', address: 'Athinas Ave, Nicosia 1016', hours: 'All day', cuisine: 'Cultural Landmark', price: 'Free', atmosphere: 'Historic & Calm', seating: 'Open-Air', gmaps: 'https://www.google.com/maps/search/?api=1&query=Famagusta+Gate+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'katakwa', lat: 35.1738, lng: 33.3645, name: 'Katakwa Culture Cafe', address: 'Armenias 53E, Nicosia 2003', hours: '9am – 8pm', cuisine: 'Vegan Treats + Coffee', price: '€', atmosphere: 'Tribal Art Vibes', seating: 'Cozy Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Katakwa+Culture+Art+Cafe+Nicosia', features: ['budget'], mode: 'chill' },
      ],
    }),
    []
  );

  const currentLocations = useMemo(() => locations[selectedMode], [locations, selectedMode]);

  // All locations flat list for all-markers mode
  const allLocations = useMemo(
    () => [...locations.eat, ...locations.focus, ...locations.chill],
    [locations]
  );

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
      result = result.filter((loc) =>
        activeFilters.every((f) => loc.features.includes(f))
      );
    }

    return result;
  }, [currentLocations, allLocations, showAllMarkers, searchQuery, activeFilters]);

  const colorData = getModeColorData(selectedMode, theme);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

  // When a marker is clicked, just select it (don't switch modes in all-markers view)
  const handleLocationSelect = (id: string | null) => {
    onLocationSelect(id);
  };

  return (
    <div className="absolute inset-0 left-0 bottom-16 md:left-16 md:bottom-0">
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
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          onMapReady={(map) => { mapInstanceRef.current = map; }}
          allLocations={allLocationsFlat}
        />
      </div>

      {/* All-markers legend */}
      {showAllMarkers && <AllMarkersLegend theme={theme} />}

      {/* Custom Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2">
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
        <div className="fixed bottom-16 left-0 right-0 z-[1002] md:absolute md:left-4 md:top-1/2 md:right-auto md:bottom-auto md:-translate-y-1/2">
          <div className="mx-auto mb-2 mt-2 h-1.5 w-12 rounded-full bg-white/30 md:hidden" />
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
          onClose={() => onSearchExpandedChange(false)}
          modeColor={colorData.main}
        />
      )}
      {filtersExpanded && (
        <FloatingFiltersPanel
          activeFilters={activeFilters}
          onFiltersChange={onFiltersChange}
          onClose={() => onFiltersExpandedChange(false)}
          modeColor={colorData.main}
        />
      )}
    </div>
  );
}
