import { useMemo, memo, useRef, useCallback } from 'react';
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
      <div className="fixed left-20 top-8 z-[1002] w-80 px-4">
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

  // All 81 locations — 27 per mode — with full metadata and feature tags
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
        { id: 'soupculture', lat: 35.1669, lng: 33.3740, name: 'Soup Culture', address: 'Ledras District, Nicosia 1011', hours: '11am – 10pm', cuisine: 'Soups + Light Meals', price: '€', atmosphere: 'Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Soup+Culture+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'mattheos', lat: 35.1736, lng: 33.3622, name: 'Mattheos Restaurant', address: 'Makariou III Ave, Nicosia 1065', hours: '12pm – 11pm', cuisine: 'Cypriot Grill', price: '€€', atmosphere: 'Family Friendly', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Mattheos+Restaurant+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'entree', lat: 35.1648, lng: 33.3756, name: 'Entree Restaurant', address: 'Kennedy Ave, Nicosia 1087', hours: '12pm – 11:30pm', cuisine: 'Mediterranean', price: '€€€', atmosphere: 'Refined', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Entree+Restaurant+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'aroma', lat: 35.1659, lng: 33.3772, name: 'Aroma Restaurant', address: 'Digeni Akrita, Nicosia 1060', hours: '10am – 11pm', cuisine: 'International', price: '€€', atmosphere: 'Warm', seating: 'Indoor + Veranda', gmaps: 'https://www.google.com/maps/search/?api=1&query=Aroma+Restaurant+Nicosia', features: ['outdoor'], mode: 'eat' },
        { id: 'meze', lat: 35.1715, lng: 33.3590, name: 'Mezedopolio Nicosia', address: 'Old City Walls, Nicosia 1010', hours: '1pm – 12am', cuisine: 'Cypriot Meze', price: '€€', atmosphere: 'Traditional', seating: 'Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Mezedopolio+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'sofra', lat: 35.1701, lng: 33.3802, name: 'Sofra Restaurant Nicosia', address: 'Sofouli St, Nicosia 1096', hours: '12pm – 10:30pm', cuisine: 'Middle Eastern', price: '€€', atmosphere: 'Cozy', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Sofra+Restaurant+Nicosia', features: ['pet-friendly'], mode: 'eat' },
        { id: 'kali', lat: 35.1728, lng: 33.3810, name: 'Kali Orexi Restaurant', address: 'Agiou Andreou, Nicosia 1101', hours: '11:30am – 10pm', cuisine: 'Greek + Cypriot', price: '€', atmosphere: 'Friendly', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kali+Orexi+Restaurant+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'agrino', lat: 35.1744, lng: 33.3555, name: 'Agrino Tavern', address: 'Pindarou 22, Nicosia 1060', hours: '12pm – 11pm', cuisine: 'Tavern Classics', price: '€€', atmosphere: 'Rustic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Agrino+Tavern+Nicosia', features: ['pet-friendly'], mode: 'eat' },
        { id: 'lemon', lat: 35.1601, lng: 33.3822, name: 'Lemon Garden Restaurant', address: 'Athalassas Ave, Nicosia 2025', hours: '12pm – 10pm', cuisine: 'Garden Bistro', price: '€€€', atmosphere: 'Relaxed Garden', seating: 'Garden', gmaps: 'https://www.google.com/maps/search/?api=1&query=Lemon+Garden+Restaurant+Nicosia', features: ['premium', 'outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'caprice', lat: 35.1623, lng: 33.3788, name: 'Caprice Restaurant Nicosia', address: 'Byron Ave, Nicosia 1096', hours: '12pm – 11:30pm', cuisine: 'Fine Dining', price: '€€€', atmosphere: 'Elegant', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Caprice+Restaurant+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'noodles', lat: 35.1638, lng: 33.3834, name: 'Noodle House Nicosia', address: 'Stasinou Ave, Nicosia 2002', hours: '11am – 11pm', cuisine: 'Asian Noodles', price: '€', atmosphere: 'Fast Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Noodle+House+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'sushi', lat: 35.1655, lng: 33.3613, name: 'Sushimou Nicosia', address: 'Archbishop Makarios III, Nicosia 1065', hours: '12pm – 11pm', cuisine: 'Japanese Sushi', price: '€€€', atmosphere: 'Modern', seating: 'Bar + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Sushimou+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'india', lat: 35.1682, lng: 33.3571, name: 'India Gate Restaurant Nicosia', address: 'Evripidou, Nicosia 1010', hours: '12pm – 10:30pm', cuisine: 'Indian', price: '€€', atmosphere: 'Aromatic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=India+Gate+Restaurant+Nicosia', features: ['pet-friendly'], mode: 'eat' },
        { id: 'lebanese', lat: 35.1610, lng: 33.3601, name: 'Lebanese Flavours Nicosia', address: 'Griva Digeni, Nicosia 1095', hours: '12pm – 10pm', cuisine: 'Lebanese', price: '€€', atmosphere: 'Vibrant', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Lebanese+Flavours+Nicosia', features: ['outdoor'], mode: 'eat' },
        { id: 'souvlaki', lat: 35.1776, lng: 33.3644, name: 'O Politikos Souvlaki', address: 'Nafpliou St, Nicosia 1100', hours: '11am – 12am', cuisine: 'Souvlaki', price: '€', atmosphere: 'Street-Style', seating: 'Counter + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=O+Politikos+Souvlaki+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'pizza', lat: 35.1792, lng: 33.3665, name: 'Pizza Boom Nicosia', address: 'Diagorou, Nicosia 1097', hours: '11:30am – 11:30pm', cuisine: 'Pizza', price: '€', atmosphere: 'Lively', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Pizza+Boom+Nicosia', features: ['budget', 'outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'steak', lat: 35.1588, lng: 33.3779, name: 'The Steak House Nicosia', address: 'Acropoleos Ave, Nicosia 2006', hours: '1pm – 12am', cuisine: 'Steakhouse', price: '€€€', atmosphere: 'Upscale', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Steak+House+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'wok', lat: 35.1707, lng: 33.3828, name: 'Wok To Walk Nicosia', address: 'Anexartisias, Nicosia 1096', hours: '11am – 11pm', cuisine: 'Asian Wok', price: '€', atmosphere: 'Quick Bite', seating: 'Counter', gmaps: 'https://www.google.com/maps/search/?api=1&query=Wok+To+Walk+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'greek', lat: 35.1575, lng: 33.3810, name: 'Dionysos Greek Tavern Nicosia', address: 'Larnacos Ave, Nicosia 2101', hours: '12pm – 11pm', cuisine: 'Greek Tavern', price: '€€', atmosphere: 'Traditional', seating: 'Indoor + Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Dionysos+Greek+Tavern+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'burger', lat: 35.1631, lng: 33.3845, name: 'Burger Joint Nicosia', address: 'Spyrou Kyprianou Ave, Nicosia 1075', hours: '12pm – 12am', cuisine: 'Burgers', price: '€€', atmosphere: 'Urban Casual', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=Burger+Joint+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
      ],
      focus: [
        { id: 'yfantourgeio', lat: 35.1741, lng: 33.3601, name: 'Yfantourgeio', address: 'Ermou 66, Nicosia 1011', hours: '8am – 10pm', cuisine: 'Coworking + Coffee', price: '€€', atmosphere: 'Creative', seating: 'Flexible Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Yfantourgeio+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'brewlab', lat: 35.1710, lng: 33.3575, name: 'Brew Lab', address: 'Stasikratous 3, Nicosia 1066', hours: '7am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Focused', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Brew+Lab+Stasikratous+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'workshop', lat: 35.1695, lng: 33.3625, name: 'The Workshop Cafe', address: 'Old Town, Nicosia', hours: '8am – 6pm', cuisine: 'Coffee & Pastries', price: '€', atmosphere: 'Quiet & Studious', seating: 'Tables + Outlets', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Workshop+Cafe+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'think30', lat: 35.1700, lng: 33.3555, name: 'Think 30', address: 'Stasikratous, Nicosia', hours: '8am – 8pm', cuisine: 'Coffee & Bites', price: '€€', atmosphere: 'Modern', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Think+30+Stasikratous+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'kofee', lat: 35.1725, lng: 33.3638, name: 'A Kxofee Project', address: 'Nicosia Old Town', hours: '7:30am – 5pm', cuisine: 'Specialty Coffee', price: '€', atmosphere: 'Busy & Creative', seating: 'Limited + Laptop-Friendly', gmaps: 'https://www.google.com/maps/search/?api=1&query=A+Kxofee+Project+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'hub', lat: 35.1757, lng: 33.3596, name: 'The Hub Nicosia', address: 'Ermou, Nicosia', hours: '9am – 8pm', cuisine: 'Coworking Space', price: '€€', atmosphere: 'Professional', seating: 'Hot Desks + Meeting Rooms', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Hub+Nicosia+Coworking', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'pieto', lat: 35.1716, lng: 33.3608, name: 'Pieto Coffee', address: 'Old Town, Nicosia', hours: '7am – 6pm', cuisine: 'Artisan Coffee', price: '€', atmosphere: 'Minimalist', seating: 'Counter + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Pieto+Coffee+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'beanbar', lat: 35.1652, lng: 33.3571, name: 'Bean Bar Coffee', address: 'Stasikratous, Nicosia 1066', hours: '7am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Calm', seating: 'Indoor Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Bean+Bar+Coffee+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'impact', lat: 35.1722, lng: 33.3720, name: 'Impact Hub Nicosia', address: 'Old Powerhouse, Nicosia 1016', hours: '8am – 8pm', cuisine: 'Coworking Hub', price: '€€', atmosphere: 'Innovative', seating: 'Hot Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Impact+Hub+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'workhive', lat: 35.1638, lng: 33.3590, name: 'WorkHive Coworking', address: 'Makariou Avenue, Nicosia 1065', hours: '8am – 9pm', cuisine: 'Coworking + Cafe', price: '€€', atmosphere: 'Professional', seating: 'Work Pods', gmaps: 'https://www.google.com/maps/search/?api=1&query=WorkHive+Coworking+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'roasters', lat: 35.1669, lng: 33.3556, name: 'Roasters Coffee Nicosia', address: 'Evagorou St, Nicosia 1066', hours: '7am – 6pm', cuisine: 'Coffee Roastery', price: '€', atmosphere: 'Focused', seating: 'Window Bar + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Roasters+Coffee+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'chapters', lat: 35.1714, lng: 33.3615, name: 'Chapters Coffee and Books', address: 'Ledra Street, Nicosia 1011', hours: '8am – 9pm', cuisine: 'Coffee + Books', price: '€€', atmosphere: 'Quiet', seating: 'Reading Nooks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Chapters+Coffee+and+Books+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'thelab', lat: 35.1595, lng: 33.3611, name: 'The Lab Cafe', address: 'Kallipoleos Ave, Nicosia 1055', hours: '7:30am – 8pm', cuisine: 'Coffee + Snacks', price: '€', atmosphere: 'Minimal', seating: 'Shared Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Lab+Cafe+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'hive', lat: 35.1623, lng: 33.3633, name: 'Hive Coworking Nicosia', address: 'Digeni Akrita Ave, Nicosia 1061', hours: '8am – 10pm', cuisine: 'Coworking Space', price: '€€', atmosphere: 'Collaborative', seating: 'Desks + Lounge', gmaps: 'https://www.google.com/maps/search/?api=1&query=Hive+Coworking+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'coffeelab', lat: 35.1580, lng: 33.3798, name: 'Coffee Lab Nicosia', address: 'Athalassas Ave, Nicosia 2025', hours: '7am – 7pm', cuisine: 'Coffee Lab', price: '€€', atmosphere: 'Energetic', seating: 'Indoor + Counter', gmaps: 'https://www.google.com/maps/search/?api=1&query=Coffee+Lab+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'drip', lat: 35.1698, lng: 33.3579, name: 'Drip Coffee', address: 'Onasagorou, Nicosia 1011', hours: '7:30am – 6:30pm', cuisine: 'Pour-Over Coffee', price: '€', atmosphere: 'Quiet', seating: 'Counter + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Drip+Coffee+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'espresso', lat: 35.1735, lng: 33.3644, name: 'Espresso Corner Nicosia', address: 'Solomou Square, Nicosia 1096', hours: '7am – 7pm', cuisine: 'Espresso Bar', price: '€', atmosphere: 'Casual Work Spot', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Espresso+Corner+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'grounds', lat: 35.1710, lng: 33.3628, name: 'Common Grounds Nicosia', address: 'Arsinois, Nicosia 1011', hours: '8am – 8pm', cuisine: 'Cafe + Brunch', price: '€€', atmosphere: 'Community', seating: 'Long Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Common+Grounds+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'workspace', lat: 35.1601, lng: 33.3652, name: 'Workspace Nicosia', address: 'Griva Digeni, Nicosia 1095', hours: '8am – 8pm', cuisine: 'Coworking', price: '€€', atmosphere: 'Professional', seating: 'Dedicated Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Workspace+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'thecorner', lat: 35.1617, lng: 33.3770, name: 'The Corner Coffee', address: 'Stasinou Ave, Nicosia 2002', hours: '7am – 7pm', cuisine: 'Coffee + Pastries', price: '€', atmosphere: 'Cozy', seating: 'Corner Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Corner+Coffee+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'bricks', lat: 35.1644, lng: 33.3744, name: 'Bricks Coworking', address: 'Kennedy Ave, Nicosia 1076', hours: '8am – 9pm', cuisine: 'Coworking', price: '€€', atmosphere: 'Industrial Modern', seating: 'Desks + Booths', gmaps: 'https://www.google.com/maps/search/?api=1&query=Bricks+Coworking+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'signal', lat: 35.1758, lng: 33.3662, name: 'Signal Coffee Nicosia', address: 'Agiou Andreou, Nicosia 1101', hours: '7:30am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Focused', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Signal+Coffee+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'arthaus', lat: 35.1584, lng: 33.3672, name: 'Arthaus Coworking', address: 'Lycavitos, Nicosia 1070', hours: '8am – 8pm', cuisine: 'Creative Workspace', price: '€€', atmosphere: 'Artistic', seating: 'Studios + Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Arthaus+Coworking+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'daily', lat: 35.1768, lng: 33.3680, name: 'Daily Coffee Nicosia', address: 'Nafpliou, Nicosia 1100', hours: '7am – 6pm', cuisine: 'Coffee Bar', price: '€', atmosphere: 'Simple & Quiet', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Daily+Coffee+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'kivo', lat: 35.1879, lng: 33.3793, name: 'Kivo Art and Cafe', address: 'Old Town Quarter, Nicosia 1011', hours: '8am – 9pm', cuisine: 'Cafe + Art Space', price: '€€', atmosphere: 'Creative Calm', seating: 'Tables + Gallery Corner', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kivo+Art+and+Cafe+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'fresco', lat: 35.1595, lng: 33.3834, name: 'Fresco Cafe Nicosia', address: 'Acropolis District, Nicosia 2012', hours: '7:30am – 8pm', cuisine: 'Cafe', price: '€', atmosphere: 'Bright', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Fresco+Cafe+Nicosia', features: ['wifi', 'power', 'budget', 'outdoor'], mode: 'focus' },
        { id: 'junction', lat: 35.1828, lng: 33.3812, name: 'Junction Coffee', address: 'Kaimakli Rd, Nicosia 1020', hours: '7am – 7pm', cuisine: 'Coffee + Bakes', price: '€', atmosphere: 'Neighborhood', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Junction+Coffee+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
      ],
      chill: [
        { id: 'k11', lat: 35.1691, lng: 33.3649, name: 'Kafeneio 11', address: 'Soutsou & Pyreos Corner, Nicosia 1016', hours: '12pm – 12am (Mon Closed)', cuisine: 'Coffee + Drinks', price: '€', atmosphere: 'Traditional Cypriot', seating: 'Indoor + Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kafeneio+11+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'balza', lat: 35.1680, lng: 33.3587, name: 'Bálza Rooftop Bar', address: 'Evagoras, Megaro Hadjisavva, Nicosia', hours: '8pm – 1am', cuisine: 'Cocktails + Dining', price: '€€€', atmosphere: 'Rooftop Vibes', seating: 'Rooftop Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Balza+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'halara', lat: 35.1745, lng: 33.3632, name: 'Halara Cafe', address: 'Old Town, Nicosia', hours: '9am – 12am', cuisine: 'Coffee & Cocktails', price: '€', atmosphere: 'Laid-Back', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Halara+Cafe+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'municipal', lat: 35.1690, lng: 33.3565, name: 'Nicosia Municipal Gardens', address: 'Mouseiou, Nicosia', hours: 'All day', cuisine: 'Park', price: 'Free', atmosphere: 'Green & Peaceful', seating: 'Benches + Lawn', gmaps: 'https://www.google.com/maps/search/?api=1&query=Nicosia+Municipal+Gardens', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'skyview', lat: 35.1675, lng: 33.3610, name: 'SkyView Rooftop Bar', address: 'Nicosia Center', hours: '6pm – 1am', cuisine: 'Cocktails', price: '€€€', atmosphere: 'Sunset Views', seating: 'Rooftop', gmaps: 'https://www.google.com/maps/search/?api=1&query=SkyView+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'famagusta', lat: 35.1718, lng: 33.3710, name: 'Famagusta Gate Area', address: 'Athinas Ave, Nicosia 1016', hours: 'All day', cuisine: 'Cultural Landmark', price: 'Free', atmosphere: 'Historic & Calm', seating: 'Open-Air', gmaps: 'https://www.google.com/maps/search/?api=1&query=Famagusta+Gate+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'katakwa', lat: 35.1738, lng: 33.3645, name: 'Katakwa Culture Cafe', address: 'Armenias 53E, Nicosia 2003', hours: '9am – 8pm', cuisine: 'Vegan Treats + Coffee', price: '€', atmosphere: 'Tribal Art Vibes', seating: 'Cozy Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Katakwa+Culture+Art+Cafe+Nicosia', features: ['budget'], mode: 'chill' },
        { id: 'plaka', lat: 35.1648, lng: 33.3568, name: 'Plaka Rooftop Bar', address: 'Makariou III, Nicosia 1065', hours: '6pm – 2am', cuisine: 'Cocktails + Small Plates', price: '€€€', atmosphere: 'Rooftop Chic', seating: 'Rooftop', gmaps: 'https://www.google.com/maps/search/?api=1&query=Plaka+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'dizzy', lat: 35.1731, lng: 33.3598, name: 'Dizzy Donkey Bar', address: 'Old City, Nicosia 1011', hours: '7pm – 2am', cuisine: 'Bar + Snacks', price: '€€', atmosphere: 'Playful', seating: 'Indoor + Street Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Dizzy+Donkey+Bar+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'chill' },
        { id: 'verde', lat: 35.1592, lng: 33.3815, name: 'Cafe Verde Nicosia', address: 'Athalassas Ave, Nicosia 2025', hours: '9am – 11pm', cuisine: 'Cafe', price: '€', atmosphere: 'Green & Calm', seating: 'Garden Seating', gmaps: 'https://www.google.com/maps/search/?api=1&query=Cafe+Verde+Nicosia', features: ['outdoor', 'budget', 'pet-friendly'], mode: 'chill' },
        { id: 'acropolis', lat: 35.1573, lng: 33.3828, name: 'Acropolis Park Nicosia', address: 'Acropoleos Area, Nicosia 2012', hours: 'All day', cuisine: 'Urban Park', price: 'Free', atmosphere: 'Open & Quiet', seating: 'Benches + Grass', gmaps: 'https://www.google.com/maps/search/?api=1&query=Acropolis+Park+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'melis', lat: 35.1662, lng: 33.3712, name: 'Melis Bar Nicosia', address: 'Lykavitos, Nicosia 1070', hours: '6pm – 1am', cuisine: 'Wine + Cocktails', price: '€€€', atmosphere: 'Stylish', seating: 'Indoor Lounge', gmaps: 'https://www.google.com/maps/search/?api=1&query=Melis+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'sundowner', lat: 35.1639, lng: 33.3691, name: 'Sundowner Bar Nicosia', address: 'City Center, Nicosia 1066', hours: '5pm – 1am', cuisine: 'Sunset Cocktails', price: '€€€', atmosphere: 'Golden Hour Vibes', seating: 'Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Sundowner+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'alley', lat: 35.1720, lng: 33.3663, name: 'The Alley Bar', address: 'Backlane Quarter, Nicosia 1010', hours: '6pm – 2am', cuisine: 'Bar', price: '€€', atmosphere: 'Hidden Gem', seating: 'Alley Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Alley+Bar+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'chill' },
        { id: 'garden', lat: 35.1841, lng: 33.3742, name: 'Secret Garden Cafe Nicosia', address: 'Pallouriotissa, Nicosia 1040', hours: '9am – 12am', cuisine: 'Cafe + Drinks', price: '€', atmosphere: 'Garden Escape', seating: 'Garden Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Secret+Garden+Cafe+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'wall', lat: 35.1727, lng: 33.3718, name: 'The Wall Bar Nicosia', address: 'Inside the Walls, Nicosia 1016', hours: '7pm – 2am', cuisine: 'Craft Cocktails', price: '€€€', atmosphere: 'Historic Nightlife', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Wall+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'botanica', lat: 35.1855, lng: 33.3758, name: 'Botanica Cafe Nicosia', address: 'Nicosia Green Belt, Nicosia 1080', hours: '8am – 10pm', cuisine: 'Cafe + Desserts', price: '€€', atmosphere: 'Botanical', seating: 'Plant-Filled Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Botanica+Cafe+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'chill' },
        { id: 'casanova', lat: 35.1634, lng: 33.3728, name: 'Casanova Bar Nicosia', address: 'Kennedy Quarter, Nicosia 1076', hours: '7pm – 2am', cuisine: 'Cocktail Bar', price: '€€€', atmosphere: 'Romantic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Casanova+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'terrace', lat: 35.1618, lng: 33.3745, name: 'The Terrace Nicosia', address: 'Sofouli Area, Nicosia 1096', hours: '5pm – 1am', cuisine: 'Bar + Bites', price: '€€', atmosphere: 'Open-Air Lounge', seating: 'Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Terrace+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'arcade', lat: 35.1709, lng: 33.3635, name: 'Arcade Bar Nicosia', address: 'Ledra Arcade, Nicosia 1011', hours: '6pm – 2am', cuisine: 'Bar', price: '€€', atmosphere: 'Retro', seating: 'Indoor + Balcony', gmaps: 'https://www.google.com/maps/search/?api=1&query=Arcade+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'loft', lat: 35.1655, lng: 33.3559, name: 'Loft Bar Nicosia', address: 'Makarios Business District, Nicosia 1065', hours: '6pm – 1:30am', cuisine: 'Cocktails', price: '€€€', atmosphere: 'Urban Loft', seating: 'Lounge Seating', gmaps: 'https://www.google.com/maps/search/?api=1&query=Loft+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'atelier', lat: 35.1671, lng: 33.3602, name: 'Atelier Cafe Nicosia', address: 'Armenias Street, Nicosia 2003', hours: '9am – 11pm', cuisine: 'Cafe + Brunch', price: '€€', atmosphere: 'Artsy', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=Atelier+Cafe+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'chill' },
        { id: 'olivo', lat: 35.1627, lng: 33.3613, name: 'Olivo Bar Nicosia', address: 'Byron Ave, Nicosia 1096', hours: '6pm – 1am', cuisine: 'Wine + Mezze', price: '€€', atmosphere: 'Mediterranean Lounge', seating: 'Patio + Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Olivo+Bar+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'palms', lat: 35.1686, lng: 33.3785, name: 'Palms Bar Nicosia', address: 'Agiou Omologitou, Nicosia 1080', hours: '7pm – 2am', cuisine: 'Tropical Cocktails', price: '€€€', atmosphere: 'Lively', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Palms+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'vibe', lat: 35.1780, lng: 33.3704, name: 'The Vibe Bar Nicosia', address: 'Syndicatos, Nicosia 1101', hours: '7pm – 2am', cuisine: 'Bar + DJ Nights', price: '€€', atmosphere: 'Energetic', seating: 'Standing + Booths', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Vibe+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'fig', lat: 35.1570, lng: 33.3812, name: 'Fig Tree Bar Nicosia', address: 'Athalassas Blvd, Nicosia 2025', hours: '6pm – 1am', cuisine: 'Cocktails + Small Plates', price: '€€', atmosphere: 'Relaxed Evening', seating: 'Garden Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Fig+Tree+Bar+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'chill' },
        { id: 'tulum', lat: 35.1761, lng: 33.3720, name: 'Tulum Bar Nicosia', address: 'Inner Ring Road, Nicosia 1097', hours: '6pm – 2am', cuisine: 'Cocktails', price: '€€€', atmosphere: 'Boho Nightspot', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Tulum+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
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

  useEffect(() => {
    if (selectedLocation && !isSelectedVisible) {
      onLocationSelect(null);
    }
  }, [selectedLocation, isSelectedVisible, onLocationSelect]);

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
    <div className={`absolute inset-0 left-16 transition-colors duration-300 ${bgColor}`}>
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
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[1000] w-[360px] lg:w-[400px] xl:w-[448px] max-h-[calc(100vh-2rem)] overflow-y-auto">
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
