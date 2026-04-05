import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import type { PlaceApiData } from './components/LocationCard';
import ThemeContext from './context/ThemeContext';

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

// ---------------------------------------------------------------------------
// Google Places API (New) integration
// Replace the placeholder below with a real key to enable live data.
// Without a valid key every fetch will fail gracefully and fall back to
// the hardcoded values already baked into LocationCard / MapView.
// ---------------------------------------------------------------------------
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

// Location names for all 21 locations across all three modes
const LOCATION_NAMES: Record<string, string> = {
  // Eat mode
  avo: 'Avo Armenian Food',
  piatsa: 'Piatsa Gourounaki',
  zanettos: 'Zanettos Tavern',
  toanamma: 'To Anamma',
  elysian: 'Elysian Fusion Kitchen',
  falafel: 'Falafel Abu Dany',
  bellavita: 'Bella Vita',
  // Focus mode
  yfantourgeio: 'Yfantourgeio',
  brewlab: 'Brew Lab',
  workshop: 'The Workshop Cafe',
  think30: 'Think 30',
  kofee: 'A Kxofee Project',
  hub: 'The Hub Nicosia',
  pieto: 'Pieto Coffee',
  // Chill mode
  k11: 'K11',
  balza: 'Bálza Rooftop Bar',
  halara: 'Halara Cafe',
  municipal: 'Nicosia Municipal Gardens',
  skyview: 'SkyView Rooftop Bar',
  famagusta: 'Famagusta Gate Area',
  katakwa: 'Katakwa Culture Cafe',
};

async function fetchPlaceByName(locationName: string): Promise<PlaceApiData> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.photos.name,places.rating,places.userRatingCount,places.formattedAddress,places.regularOpeningHours',
    },
    body: JSON.stringify({
      textQuery: `${locationName} Nicosia Cyprus`,
      maxResultCount: 1,
    }),
  });

  if (!res.ok) throw new Error(`Places API ${res.status}`);
  const data = await res.json();

  // Extract first place from search results
  const place = data.places?.[0];
  if (!place) throw new Error('No place found');

  console.log(`Fetched ${locationName}:`, place); // Debug log

  // Build photo URLs from up to 4 photos
  const photoUrls: string[] = [];
  if (place.photos && Array.isArray(place.photos)) {
    const photosToFetch = Math.min(place.photos.length, 4);
    for (let i = 0; i < photosToFetch; i++) {
      const photoName = place.photos[i]?.name;
      if (photoName) {
        photoUrls.push(
          `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&key=${GOOGLE_PLACES_API_KEY}`
        );
      }
    }
  }

  // Today's opening hours — API uses Mon=0 … Sun=6
  const weekdayDescriptions: string[] | undefined =
    place.regularOpeningHours?.weekdayDescriptions;
  const jsDay = new Date().getDay(); // 0=Sun … 6=Sat
  const apiDay = jsDay === 0 ? 6 : jsDay - 1;
  const todayEntry = weekdayDescriptions?.[apiDay];
  // Strip the leading day name ("Monday: 8:00 AM – 6:00 PM" → "8:00 AM – 6:00 PM")
  const hours = todayEntry ? todayEntry.replace(/^[^:]+:\s*/, '') : undefined;

  return {
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    address: place.formattedAddress,
    hours,
  };
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>('eat');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [placeData, setPlaceData] = useState<Record<string, PlaceApiData>>({});
  const photoBlobUrlsRef = useRef<string[]>([]);

  // Fetch Google Places data for all 21 locations on mount.
  // Uses Promise.allSettled so a single failure never blocks the others.
  // All errors are silently swallowed — the UI falls back to hardcoded values.
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const results = await Promise.allSettled(
        Object.entries(LOCATION_NAMES).map(async ([id, locationName]) => {
          const data = await fetchPlaceByName(locationName);
          return { id, data };
        })
      );

      const merged: Record<string, PlaceApiData> = {};
      const createdBlobUrls: string[] = [];
      await Promise.all(results.map(async (result) => {
        if (result.status === 'fulfilled') {
          const sourcePhotoUrls = result.value.data.photoUrls ?? [];
          let blobUrls: string[] | undefined;

          if (sourcePhotoUrls.length > 0) {
            try {
              blobUrls = await Promise.all(
              sourcePhotoUrls.map(async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();
                return URL.createObjectURL(blob);
              })
              );
              createdBlobUrls.push(...blobUrls);
            } catch {
              // Ignore photo failures; card will render without images.
            }
          }

          merged[result.value.id] = {
            ...result.value.data,
            photoUrls: blobUrls,
          };
        }
      }));

      if (!isMounted) {
        createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      setPlaceData(merged);
      photoBlobUrlsRef.current = createdBlobUrls;
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      photoBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={`relative h-screen w-full overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
        }`}
      >
        <MapView
          selectedMode={selectedMode}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          searchExpanded={searchExpanded}
          onSearchExpandedChange={setSearchExpanded}
          filtersExpanded={filtersExpanded}
          onFiltersExpandedChange={setFiltersExpanded}
          placeData={placeData}
        />
        <Sidebar
          selectedMode={selectedMode}
          onModeChange={(mode) => {
            setSelectedMode(mode);
            setSelectedLocation(null);
          }}
          onThemeChange={setTheme}
          onSearchToggle={() => {
            setSearchExpanded((prev) => !prev);
            setFiltersExpanded(false);
          }}
          onFiltersToggle={() => {
            setFiltersExpanded((prev) => !prev);
            setSearchExpanded(false);
          }}
          activeFilters={activeFilters}
          searchExpanded={searchExpanded}
          filtersExpanded={filtersExpanded}
        />
      </div>
    </ThemeContext.Provider>
  );
}
