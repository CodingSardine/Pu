import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';

/**
 * Pu - Location Finder App for Nicosia, Cyprus
 * 
 * Responsive breakpoints:
 * - xs: 0-639px (mobile)
 * - sm: 640-767px (large mobile)
 * - md: 768-1023px (tablet)
 * - lg: 1024-1279px (small desktop)
 * - xl: 1280-1535px (desktop)
 * - 2xl: 1536px+ (large desktop)
 * - 4K: 3840px+ (ultra-high resolution)
 * - Ultrawide: 2560px+ (21:9 displays)
 */

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

export default function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>('eat');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <div className={`relative h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <MapView 
        selectedMode={selectedMode} 
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        theme={theme}
        searchExpanded={searchExpanded}
        onSearchExpandedChange={setSearchExpanded}
        filtersExpanded={filtersExpanded}
        onFiltersExpandedChange={setFiltersExpanded}
      />
      <Sidebar 
        selectedMode={selectedMode} 
        onModeChange={(mode) => {
          setSelectedMode(mode);
          setSelectedLocation(null);
        }}
        theme={theme}
        onThemeChange={setTheme}
        onSearchToggle={() => {
          setSearchExpanded(prev => !prev);
          setFiltersExpanded(false);
        }}
        onFiltersToggle={() => {
          setFiltersExpanded(prev => !prev);
          setSearchExpanded(false);
        }}
        activeFilters={activeFilters}
        searchExpanded={searchExpanded}
        filtersExpanded={filtersExpanded}
      />
    </div>
  );
}