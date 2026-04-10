import React, { useMemo, memo, useRef, useCallback, useState } from 'react';
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

  // All 81 locations — 27 per mode — with full metadata and feature tags
  const locations = useMemo<Record<Mode, LocationEntry[]>>(
    () => ({
      eat: [
        { id: 'avo', lat: 35.1712, lng: 33.3616, name: 'Avo Armenian Food', address: 'Onasagorou, Nicosia 1011', hours: '8am – 6pm', cuisine: 'Armenian + Cypriot', price: '€', atmosphere: 'Lively', seating: 'Very Limited', gmaps: 'https://www.google.com/maps/search/?api=1&query=Avo+Armenian+Food+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'piatsa', lat: 35.1735, lng: 33.3621, name: 'Piatsa Gourounaki', address: 'Klimentos 4, Nicosia 1060', hours: '12pm – 11pm', cuisine: 'Mediterranean BBQ', price: '€€', atmosphere: 'Vibrant', seating: 'Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Piatsa+Gourounaki+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'zanettos', lat: 35.1728, lng: 33.3647, name: 'Zanettos Tavern', address: 'Trikoupi 65, Nicosia 1016', hours: '5pm – 11pm', cuisine: 'Traditional Cypriot', price: '€€', atmosphere: 'Authentic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Zanettos+Tavern+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'toanamma', lat: 35.1705, lng: 33.3630, name: 'To Anamma', address: 'Ledras 64, Nicosia 1011', hours: '11am – 11pm', cuisine: 'Cypriot Modern', price: '€€', atmosphere: 'Cozy Courtyard', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=To+Anamma+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'elysian', lat: 35.1696, lng: 33.3575, name: 'Elysian Fusion Kitchen', address: 'Old Town, Nicosia', hours: '9am – 9pm', cuisine: 'Plant-Based Fusion', price: '€', atmosphere: 'Relaxed', seating: 'Indoor + Patio', gmaps: 'https://www.google.com/maps/search/?api=1&query=Elysian+Fusion+Kitchen+Nicosia', features: ['budget', 'outdoor'], mode: 'eat' },
        { id: 'furen', lat: 35.1698, lng: 33.3701, name: 'Furen', address: 'Nicosia', hours: '—', cuisine: 'Asian Fusion', price: '€€', atmosphere: 'Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Furen+Nicosia', features: [], mode: 'eat' },
        { id: 'bellavita', lat: 35.1729, lng: 33.3658, name: 'Bella Vita', address: 'Old Town, Nicosia', hours: '12pm – 11pm', cuisine: 'Italian', price: '€€€', atmosphere: 'Garden Dining', seating: 'Garden', gmaps: 'https://www.google.com/maps/search/?api=1&query=Bella+Vita+Restaurant+Nicosia', features: ['premium', 'outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'evroula', lat: 35.1669, lng: 33.3740, name: 'Evroula', address: 'Nicosia', hours: '—', cuisine: 'Homecooked / Soups', price: '€', atmosphere: 'Home-style', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Evroula+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'mattheos', lat: 35.1762, lng: 33.3572, name: 'Mattheos Restaurant', address: 'Makariou III Ave, Nicosia 1065', hours: '12pm – 11pm', cuisine: 'Cypriot Grill', price: '€€', atmosphere: 'Family Friendly', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Mattheos+Restaurant+Nicosia', features: ['outdoor', 'pet-friendly'], mode: 'eat' },
        { id: 'shamfood', lat: 35.1648, lng: 33.3756, name: 'Sham Food', address: 'Nicosia', hours: '—', cuisine: 'Syrian / Middle Eastern', price: '€', atmosphere: 'Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Sham+Food+Nicosia', features: [], mode: 'eat' },
        { id: 'obo', lat: 35.1659, lng: 33.3772, name: 'Obo Kitchen', address: 'Nicosia', hours: '—', cuisine: 'Gourmet Smash Burgers', price: '€€', atmosphere: 'Modern', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Obo+Kitchen+Nicosia', features: [], mode: 'eat' },
        { id: 'platanos', lat: 35.1715, lng: 33.3590, name: 'Platanos Tavern', address: 'Nicosia', hours: '—', cuisine: 'Traditional Meze', price: '€€', atmosphere: 'Traditional', seating: 'Indoor + Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Platanos+Tavern+Nicosia', features: ['outdoor'], mode: 'eat' },
        { id: 'syrianclub', lat: 35.1701, lng: 33.3802, name: 'Syrian Club', address: 'Nicosia', hours: '—', cuisine: 'Middle Eastern', price: '€€', atmosphere: 'Classic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Syrian+Club+Nicosia', features: [], mode: 'eat' },
        { id: 'omnieats', lat: 35.1728, lng: 33.3810, name: 'Omni Eats', address: 'Nicosia', hours: '—', cuisine: 'Healthy / Casual', price: '€€', atmosphere: 'Bright', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Omni+Eats+Nicosia', features: [], mode: 'eat' },
        { id: 'kathodon', lat: 35.1744, lng: 33.3555, name: 'Kathodon', address: 'Nicosia', hours: '—', cuisine: 'Greek Tavern / Meze', price: '€€', atmosphere: 'Traditional', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kathodon+Nicosia', features: [], mode: 'eat' },
        { id: 'beba', lat: 35.1601, lng: 33.3822, name: 'Beba Restaurant', address: 'Nicosia', hours: '—', cuisine: 'Refined Cypriot / Greek', price: '€€€', atmosphere: 'Refined', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Beba+Restaurant+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'vasiliki', lat: 35.1623, lng: 33.3788, name: 'Vasiliki', address: 'Nicosia', hours: '—', cuisine: 'Authentic Cooked Meals', price: '€', atmosphere: 'Home-style', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Vasiliki+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'imperialchinese', lat: 35.1638, lng: 33.3834, name: 'Imperial Chinese Nicosia', address: 'Nicosia', hours: '—', cuisine: 'Chinese', price: '€€', atmosphere: 'Classic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Imperial+Chinese+Nicosia', features: [], mode: 'eat' },
        { id: 'akakiko', lat: 35.1655, lng: 33.3613, name: 'Akakiko', address: 'Nicosia', hours: '—', cuisine: 'Sushi / Japanese', price: '€€€', atmosphere: 'Modern', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Akakiko+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'indiaindia', lat: 35.1682, lng: 33.3571, name: 'India India', address: 'Nicosia', hours: '—', cuisine: 'Indian', price: '€€', atmosphere: 'Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=India+India+Nicosia', features: [], mode: 'eat' },
        { id: 'fanous', lat: 35.1610, lng: 33.3601, name: 'Fanous Lebanese Restaurant', address: 'Nicosia', hours: '—', cuisine: 'Lebanese', price: '€€', atmosphere: 'Warm', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Fanous+Lebanese+Restaurant+Nicosia', features: [], mode: 'eat' },
        { id: 'kyriakos', lat: 35.1776, lng: 33.3644, name: 'Kyriakos Souvlaki', address: 'Nicosia', hours: '—', cuisine: 'Souvlaki', price: '€', atmosphere: 'Legendary', seating: 'Counter', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kyriakos+Souvlaki+Nicosia', features: ['budget'], mode: 'eat' },
        { id: 'rokoko', lat: 35.1792, lng: 33.3665, name: 'Rokoko', address: 'Nicosia', hours: '—', cuisine: 'Pizza & Italian', price: '€€', atmosphere: 'Lively', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Rokoko+Nicosia', features: [], mode: 'eat' },
        { id: 'moondogs', lat: 35.1588, lng: 33.3779, name: "Moondog's Bar & Grill", address: 'Nicosia', hours: '—', cuisine: 'Steaks & Burgers', price: '€€€', atmosphere: 'Lively', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Moondog%27s+Bar+%26+Grill+Nicosia', features: ['premium'], mode: 'eat' },
        { id: 'nomiya', lat: 35.1707, lng: 33.3828, name: 'Nomiya', address: 'Nicosia', hours: '—', cuisine: 'Asian / Sushi', price: '€€', atmosphere: 'Modern', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Nomiya+Nicosia', features: [], mode: 'eat' },
        { id: 'valtourigani', lat: 35.1548, lng: 33.3750, name: 'Valtou Rigani', address: 'Nicosia', hours: '—', cuisine: 'Greek Souvlaki / Meze', price: '€€', atmosphere: 'Traditional', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Valtou+Rigani+Nicosia', features: [], mode: 'eat' },
        { id: 'fatbull', lat: 35.1631, lng: 33.3845, name: 'The Fat Bull Co.', address: 'Nicosia', hours: '—', cuisine: 'Burgers', price: '€€', atmosphere: 'Casual', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Fat+Bull+Co+Nicosia', features: [], mode: 'eat' },
      ],
      focus: [
        { id: 'yfantourgeio', lat: 35.1738, lng: 33.3612, name: 'Yfantourgeio', address: 'Ermou 66, Nicosia 1011', hours: '8am – 10pm', cuisine: 'Coworking + Coffee', price: '€€', atmosphere: 'Creative', seating: 'Flexible Desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Yfantourgeio+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'brewlab', lat: 35.1669, lng: 33.3582, name: 'Brew Lab', address: 'Stasikratous 3, Nicosia 1066', hours: '7am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Focused', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Brew+Lab+Stasikratous+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'workshop', lat: 35.1695, lng: 33.3625, name: 'The Workshop Cafe', address: 'Old Town, Nicosia', hours: '8am – 6pm', cuisine: 'Coffee & Pastries', price: '€', atmosphere: 'Quiet & Studious', seating: 'Tables + Outlets', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Workshop+Cafe+Nicosia', features: ['wifi', 'power', 'budget'], mode: 'focus' },
        { id: 'think30', lat: 35.1652, lng: 33.3600, name: 'Think 30', address: 'Stasikratous, Nicosia', hours: '8am – 8pm', cuisine: 'Coffee & Bites', price: '€€', atmosphere: 'Modern', seating: 'Indoor + Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Think+30+Stasikratous+Nicosia', features: ['wifi', 'power', 'outdoor'], mode: 'focus' },
        { id: 'kofee', lat: 35.1725, lng: 33.3638, name: 'A Kxofee Project', address: 'Nicosia Old Town', hours: '7:30am – 5pm', cuisine: 'Specialty Coffee', price: '€', atmosphere: 'Busy & Creative', seating: 'Limited + Laptop-Friendly', gmaps: 'https://www.google.com/maps/search/?api=1&query=A+Kxofee+Project+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'hub', lat: 35.1757, lng: 33.3596, name: 'The Hub Nicosia', address: 'Ermou, Nicosia', hours: '9am – 8pm', cuisine: 'Coworking Space', price: '€€', atmosphere: 'Professional', seating: 'Hot Desks + Meeting Rooms', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Hub+Nicosia+Coworking', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'pieto', lat: 35.1716, lng: 33.3608, name: 'Pieto Coffee', address: 'Old Town, Nicosia', hours: '7am – 6pm', cuisine: 'Artisan Coffee', price: '€', atmosphere: 'Minimalist', seating: 'Counter + Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Pieto+Coffee+Nicosia', features: ['wifi', 'budget'], mode: 'focus' },
        { id: 'beanbar', lat: 35.1652, lng: 33.3571, name: 'Bean Bar Coffee', address: 'Stasikratous, Nicosia 1066', hours: '7am – 7pm', cuisine: 'Specialty Coffee', price: '€€', atmosphere: 'Calm', seating: 'Indoor Tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Bean+Bar+Coffee+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'coffeelab', lat: 35.1580, lng: 33.3798, name: 'Coffee Lab Nicosia', address: 'Athalassas Ave, Nicosia 2025', hours: '7am – 7pm', cuisine: 'Work-friendly Cafe', price: '€€', atmosphere: 'Energetic', seating: 'Indoor + Counter', gmaps: 'https://www.google.com/maps/search/?api=1&query=Coffee+Lab+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'ucylibrary', lat: 35.1808, lng: 33.3642, name: 'UCY Library (Stelios Ioannou)', address: 'University of Cyprus, Nicosia', hours: '—', cuisine: 'University Library', price: 'Free', atmosphere: 'Quiet', seating: 'Study desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=Stelios+Ioannou+Library+Nicosia', features: [], mode: 'focus' },
        { id: 'municipallibrary', lat: 35.1638, lng: 33.3590, name: 'Nicosia Municipal Library', address: 'Nicosia', hours: '—', cuisine: 'Quiet Library', price: 'Free', atmosphere: 'Quiet', seating: 'Reading rooms', gmaps: 'https://www.google.com/maps/search/?api=1&query=Nicosia+Municipal+Library', features: [], mode: 'focus' },
        { id: 'cypruslibrary', lat: 35.1669, lng: 33.3556, name: 'Cyprus Library', address: 'Nicosia', hours: '—', cuisine: 'Public Library', price: 'Free', atmosphere: 'Quiet', seating: 'Reading rooms', gmaps: 'https://www.google.com/maps/search/?api=1&query=Cyprus+Library+Nicosia', features: [], mode: 'focus' },
        { id: 'cvarlibrary', lat: 35.1680, lng: 33.3548, name: 'CVAR Research Library', address: 'Nicosia', hours: '—', cuisine: 'Academic / Quiet', price: 'Free', atmosphere: 'Academic', seating: 'Reading desks', gmaps: 'https://www.google.com/maps/search/?api=1&query=CVAR+Research+Library+Nicosia', features: [], mode: 'focus' },
        { id: 'goethelibrary', lat: 35.1595, lng: 33.3611, name: 'Goethe-Institut Library', address: 'Nicosia', hours: '—', cuisine: 'Study space', price: 'Free', atmosphere: 'Quiet', seating: 'Study tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Goethe-Institut+Library+Nicosia', features: [], mode: 'focus' },
        { id: 'dailyroast', lat: 35.1623, lng: 33.3633, name: 'The Daily Roast', address: 'Nicosia', hours: '—', cuisine: 'Reading Cafe', price: '€€', atmosphere: 'Hipster / Reading', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Daily+Roast+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'katakwa', lat: 35.1738, lng: 33.3645, name: 'Katakwa Culture Art Cafe', address: 'Nicosia', hours: '—', cuisine: 'Creative Study Space', price: '€', atmosphere: 'Very relaxed', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Katakwa+Culture+Art+Cafe+Nicosia', features: [], mode: 'focus' },
        { id: 'caffeneroengomi', lat: 35.1680, lng: 33.3700, name: 'Caffe Nero (Engomi)', address: 'Engomi, Nicosia', hours: '—', cuisine: 'Student Hub Cafe', price: '€€', atmosphere: 'Student hub', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Caffe+Nero+Engomi', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'redsheep', lat: 35.1618, lng: 33.3590, name: 'Red Sheep Coffee Co.', address: 'Nicosia', hours: '—', cuisine: 'Quick Coffee / Work', price: '€€', atmosphere: 'Work-friendly', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Red+Sheep+Coffee+Co+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'seriousblack', lat: 35.1601, lng: 33.3652, name: 'Serious Black Coffee', address: 'Nicosia', hours: '—', cuisine: 'Focused Cafe Vibe', price: '€€', atmosphere: 'Focused', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Serious+Black+Coffee+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'tastehabitat', lat: 35.1617, lng: 33.3770, name: 'Coffeehouse TasteHabitat', address: 'Nicosia', hours: '—', cuisine: 'Work / Study Cafe', price: '€€', atmosphere: 'Study cafe', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Coffeehouse+TasteHabitat+Nicosia', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'starbucksengomi', lat: 35.1644, lng: 33.3744, name: 'Starbucks (Engomi)', address: 'Engomi, Nicosia', hours: '—', cuisine: 'Student Hub Cafe', price: '€€', atmosphere: 'Student hub', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Starbucks+Engomi', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'mikelengomi', lat: 35.1758, lng: 33.3662, name: 'Mikel Coffee (Engomi)', address: 'Engomi, Nicosia', hours: '—', cuisine: 'Laptop / Study Cafe', price: '€€', atmosphere: 'Laptop-friendly', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Mikel+Coffee+Engomi', features: ['wifi', 'power'], mode: 'focus' },
        { id: 'apomero', lat: 35.1584, lng: 33.3672, name: 'Apomero Cafe', address: 'Nicosia', hours: '—', cuisine: 'Cozy / Hidden', price: '€€', atmosphere: 'Cozy', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Apomero+Cafe+Nicosia', features: [], mode: 'focus' },
        { id: 'kalakathoumena', lat: 35.1768, lng: 33.3680, name: 'Kala Kathoumena', address: 'Nicosia', hours: '—', cuisine: 'Relaxed Reading Cafe', price: '€', atmosphere: 'Relaxed', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kala+Kathoumena+Nicosia', features: [], mode: 'focus' },
        { id: 'paulzenapalace', lat: 35.1879, lng: 33.3793, name: 'Paul (Zena Palace)', address: 'Nicosia', hours: '—', cuisine: 'Upscale Work Cafe', price: '€€€', atmosphere: 'Upscale', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Paul+Zena+Palace+Nicosia', features: ['premium'], mode: 'focus' },
        { id: 'supernova', lat: 35.1595, lng: 33.3834, name: 'Supernova Cafe', address: 'Nicosia', hours: '—', cuisine: 'Aesthetic / Work', price: '€€', atmosphere: 'Aesthetic', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Supernova+Cafe+Nicosia', features: [], mode: 'focus' },
        { id: 'makerspace', lat: 35.1828, lng: 33.3812, name: 'Makerspace Nicosia', address: 'Nicosia', hours: '—', cuisine: 'Workshop / Focus', price: '€€', atmosphere: 'Tech/CS friendly', seating: 'Work tables', gmaps: 'https://www.google.com/maps/search/?api=1&query=Makerspace+Nicosia', features: [], mode: 'focus' },
      ],
      chill: [
        { id: 'k11', lat: 35.1720, lng: 33.3600, name: 'Kafeneio 11', address: 'Soutsou & Pyreos Corner, Nicosia 1016', hours: '12pm – 12am (Mon Closed)', cuisine: 'Coffee + Drinks', price: '€', atmosphere: 'Traditional Cypriot', seating: 'Indoor + Courtyard', gmaps: 'https://www.google.com/maps/search/?api=1&query=Kafeneio+11+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'balza', lat: 35.1681, lng: 33.3628, name: 'Bálza Rooftop Bar', address: 'Evagoras, Megaro Hadjisavva, Nicosia', hours: '8pm – 1am', cuisine: 'Cocktails + Dining', price: '€€€', atmosphere: 'Rooftop Vibes', seating: 'Rooftop Terrace', gmaps: 'https://www.google.com/maps/search/?api=1&query=Balza+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'halara', lat: 35.1745, lng: 33.3640, name: 'Halara Cafe', address: 'Old Town, Nicosia', hours: '9am – 12am', cuisine: 'Coffee & Cocktails', price: '€', atmosphere: 'Laid-Back', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Halara+Cafe+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'municipal', lat: 35.1720, lng: 33.3551, name: 'Nicosia Municipal Gardens', address: 'Mouseiou, Nicosia', hours: 'All day', cuisine: 'Park', price: 'Free', atmosphere: 'Green & Peaceful', seating: 'Benches + Lawn', gmaps: 'https://www.google.com/maps/search/?api=1&query=Nicosia+Municipal+Gardens', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'taratsa', lat: 35.1695, lng: 33.3646, name: 'Taratsa Rooftop Bar', address: 'Nicosia', hours: '—', cuisine: 'Rooftop Bar', price: '€€€', atmosphere: 'Sunset Views', seating: 'Rooftop', gmaps: 'https://www.google.com/maps/search/?api=1&query=Taratsa+Rooftop+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'famagusta', lat: 35.1743, lng: 33.3710, name: 'Famagusta Gate Area', address: 'Athinas Ave, Nicosia 1016', hours: 'All day', cuisine: 'Cultural Landmark', price: 'Free', atmosphere: 'Historic & Calm', seating: 'Open-Air', gmaps: 'https://www.google.com/maps/search/?api=1&query=Famagusta+Gate+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'lostfound', lat: 35.1738, lng: 33.3645, name: 'Lost + Found Drinkery', address: 'Nicosia', hours: '—', cuisine: 'Cocktail Bar', price: '€€€', atmosphere: 'World-class cocktails', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Lost+%2B+Found+Drinkery+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'eleftheria', lat: 35.1692, lng: 33.3528, name: 'Eleftheria Square', address: 'Nicosia', hours: 'All day', cuisine: 'Walk / Landmark', price: 'Free', atmosphere: 'Modern architecture', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Eleftheria+Square+Nicosia', features: ['outdoor', 'budget'], mode: 'chill' },
        { id: 'zonkey', lat: 35.1731, lng: 33.3598, name: 'Zonkey Bar', address: 'Nicosia', hours: '—', cuisine: 'Bar', price: '€€', atmosphere: 'Vibrant', seating: 'Indoor + Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Zonkey+Bar+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'athalassa', lat: 35.1592, lng: 33.3815, name: 'Athalassa National Forest Park', address: 'Nicosia', hours: 'All day', cuisine: 'Nature Park', price: 'Free', atmosphere: 'Nature', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Athalassa+National+Forest+Park', features: ['outdoor', 'budget', 'pet-friendly'], mode: 'chill' },
        { id: 'acropolis', lat: 35.1573, lng: 33.3828, name: 'Acropolis Park Nicosia', address: 'Acropoleos Area, Nicosia 2012', hours: 'All day', cuisine: 'Urban Park', price: 'Free', atmosphere: 'Open & Quiet', seating: 'Benches + Grass', gmaps: 'https://www.google.com/maps/search/?api=1&query=Acropolis+Park+Nicosia', features: ['outdoor', 'pet-friendly', 'budget'], mode: 'chill' },
        { id: 'oldsouls', lat: 35.1662, lng: 33.3712, name: 'The Old Souls', address: 'Nicosia', hours: '—', cuisine: 'Street Bar', price: '€€', atmosphere: 'Lively', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Old+Souls+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'notesandspirits', lat: 35.1639, lng: 33.3691, name: 'Notes and Spirits', address: 'Nicosia', hours: '—', cuisine: 'Cocktail Bar', price: '€€€', atmosphere: 'Hip', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Notes+and+Spirits+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'palaia', lat: 35.1720, lng: 33.3663, name: 'Palaia Pineza', address: 'Nicosia', hours: '—', cuisine: 'Alleyway Bar', price: '€€', atmosphere: 'Cozy', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Palaia+Pineza+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'istorja9', lat: 35.1841, lng: 33.3742, name: 'Istorja House No9', address: 'Nicosia', hours: '—', cuisine: 'Cafe / Courtyard', price: '€€', atmosphere: 'Hidden courtyard', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Istorja+House+No9+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'babylon', lat: 35.1727, lng: 33.3718, name: 'Babylon Bar', address: 'Nicosia', hours: '—', cuisine: 'Beer Garden', price: '€€', atmosphere: 'Classic', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Babylon+Bar+Nicosia', features: ['outdoor'], mode: 'chill' },
        { id: 'patiococktail', lat: 35.1855, lng: 33.3758, name: 'Patio Cocktail Bar', address: 'Nicosia', hours: '—', cuisine: 'Tapas / Courtyard', price: '€€€', atmosphere: 'Courtyard', seating: 'Outdoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Patio+Cocktail+Bar+Nicosia', features: ['outdoor', 'premium'], mode: 'chill' },
        { id: 'prozak', lat: 35.1634, lng: 33.3728, name: 'Prozak Kafeneio', address: 'Nicosia', hours: '—', cuisine: 'Cafe Bar', price: '€€', atmosphere: 'Artsy', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Prozak+Kafeneio+Nicosia', features: [], mode: 'chill' },
        { id: 'swimmingbirds', lat: 35.1618, lng: 33.3745, name: 'Swimming Birds', address: 'Nicosia', hours: '—', cuisine: 'Coffee & Drinks', price: '€€', atmosphere: 'Relaxed', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Swimming+Birds+Nicosia', features: [], mode: 'chill' },
        { id: 'brewfellas', lat: 35.1652, lng: 33.3660, name: 'BrewFellas', address: 'Nicosia', hours: '—', cuisine: 'Craft Beer', price: '€€', atmosphere: 'Craft beer', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=BrewFellas+Nicosia', features: [], mode: 'chill' },
        { id: 'granazi', lat: 35.1655, lng: 33.3559, name: 'Granazi Art Space', address: 'Nicosia', hours: '—', cuisine: 'Art Space', price: '€€', atmosphere: 'Artsy', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Granazi+Art+Space+Nicosia', features: [], mode: 'chill' },
        { id: 'thegym', lat: 35.1671, lng: 33.3602, name: 'The Gym', address: 'Nicosia', hours: '—', cuisine: 'Cocktails & Food', price: '€€€', atmosphere: 'Stylish', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=The+Gym+Nicosia+bar', features: ['premium'], mode: 'chill' },
        { id: 'silverstar', lat: 35.1627, lng: 33.3613, name: 'Silver Star Wine Bar', address: 'Nicosia', hours: '—', cuisine: 'Wine Bar', price: '€€€', atmosphere: 'Wine', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Silver+Star+Wine+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'sevenmonkeys', lat: 35.1686, lng: 33.3785, name: 'Seven Monkeys The Bar', address: 'Nicosia', hours: '—', cuisine: 'Tiki / Cocktails', price: '€€€', atmosphere: 'Lively', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Seven+Monkeys+The+Bar+Nicosia', features: ['premium'], mode: 'chill' },
        { id: 'sarahsjazz', lat: 35.1780, lng: 33.3704, name: "Sarah's Jazz Club", address: 'Nicosia', hours: '—', cuisine: 'Jazz Club', price: '€€', atmosphere: 'Live jazz', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Sarah%27s+Jazz+Club+Nicosia', features: [], mode: 'chill' },
        { id: 'neverland', lat: 35.1570, lng: 33.3812, name: 'Neverland Rock Bar', address: 'Nicosia', hours: '—', cuisine: 'Rock Bar', price: '€€', atmosphere: 'Rock', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=Neverland+Rock+Bar+Nicosia', features: [], mode: 'chill' },
        { id: 'newdivision', lat: 35.1761, lng: 33.3720, name: 'New Division', address: 'Nicosia', hours: '—', cuisine: 'Dive Bar', price: '€', atmosphere: 'Student / Dive', seating: 'Indoor', gmaps: 'https://www.google.com/maps/search/?api=1&query=New+Division+Nicosia', features: ['budget'], mode: 'chill' },
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
          locations={filteredLocations.map((l) => {
            const pd = placeData[l.id] ?? null;
            const lat = pd?.lat ?? l.lat;
            const lng = pd?.lng ?? l.lng;
            return { ...l, lat, lng };
          })}
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
