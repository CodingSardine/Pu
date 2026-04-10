import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ModeTransitionOverlay from './components/ModeTransitionOverlay';
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

// Location names for all 81 locations across all three modes
const LOCATION_NAMES: Record<string, string> = {
  // Eat mode
  avo: 'Avo Armenian Food',
  piatsa: 'Piatsa Gourounaki',
  zanettos: 'Zanettos Tavern',
  toanamma: 'To Anamma',
  elysian: 'Elysian Fusion Kitchen',
  falafel: 'Falafel Abu Dany',
  bellavita: 'Bella Vita',
  soupculture: 'Soup Culture',
  mattheos: 'Mattheos Restaurant',
  entree: 'Entree Restaurant',
  aroma: 'Aroma Restaurant',
  meze: 'Mezedopolio Nicosia',
  sofra: 'Sofra Restaurant Nicosia',
  kali: 'Kali Orexi Restaurant',
  agrino: 'Agrino Tavern',
  lemon: 'Lemon Garden Restaurant',
  caprice: 'Caprice Restaurant Nicosia',
  noodles: 'Noodle House Nicosia',
  sushi: 'Sushimou Nicosia',
  india: 'India Gate Restaurant Nicosia',
  lebanese: 'Lebanese Flavours Nicosia',
  souvlaki: 'O Politikos Souvlaki',
  pizza: 'Pizza Boom Nicosia',
  steak: 'The Steak House Nicosia',
  wok: 'Wok To Walk Nicosia',
  greek: 'Dionysos Greek Tavern Nicosia',
  burger: 'Burger Joint Nicosia',
  // Focus mode
  yfantourgeio: 'Yfantourgeio',
  brewlab: 'Brew Lab',
  workshop: 'The Workshop Cafe',
  think30: 'Think 30',
  kofee: 'A Kxofee Project',
  hub: 'The Hub Nicosia',
  pieto: 'Pieto Coffee',
  beanbar: 'Bean Bar Coffee',
  impact: 'Impact Hub Nicosia',
  workhive: 'WorkHive Coworking',
  roasters: 'Roasters Coffee Nicosia',
  chapters: 'Chapters Coffee and Books',
  thelab: 'The Lab Cafe',
  hive: 'Hive Coworking Nicosia',
  coffeelab: 'Coffee Lab Nicosia',
  drip: 'Drip Coffee',
  espresso: 'Espresso Corner Nicosia',
  grounds: 'Common Grounds Nicosia',
  workspace: 'Workspace Nicosia',
  thecorner: 'The Corner Coffee',
  bricks: 'Bricks Coworking',
  signal: 'Signal Coffee Nicosia',
  arthaus: 'Arthaus Coworking',
  daily: 'Daily Coffee Nicosia',
  kivo: 'Kivo Art and Cafe',
  fresco: 'Fresco Cafe Nicosia',
  junction: 'Junction Coffee',
  // Chill mode
  k11: 'Kafeneio 11',
  balza: 'Bálza Rooftop Bar',
  halara: 'Halara Cafe',
  municipal: 'Nicosia Municipal Gardens',
  skyview: 'SkyView Rooftop Bar',
  famagusta: 'Famagusta Gate Area',
  katakwa: 'Katakwa Culture Cafe',
  plaka: 'Plaka Rooftop Bar',
  dizzy: 'Dizzy Donkey Bar',
  verde: 'Cafe Verde Nicosia',
  acropolis: 'Acropolis Park Nicosia',
  melis: 'Melis Bar Nicosia',
  sundowner: 'Sundowner Bar Nicosia',
  alley: 'The Alley Bar',
  garden: 'Secret Garden Cafe Nicosia',
  wall: 'The Wall Bar Nicosia',
  botanica: 'Botanica Cafe Nicosia',
  casanova: 'Casanova Bar Nicosia',
  terrace: 'The Terrace Nicosia',
  arcade: 'Arcade Bar Nicosia',
  loft: 'Loft Bar Nicosia',
  atelier: 'Atelier Cafe Nicosia',
  olivo: 'Olivo Bar Nicosia',
  palms: 'Palms Bar Nicosia',
  vibe: 'The Vibe Bar Nicosia',
  fig: 'Fig Tree Bar Nicosia',
  tulum: 'Tulum Bar Nicosia',
};

// Module-level cache for place data to avoid re-fetching on mode switches
const placeDataCache = new Map<string, PlaceApiData>();

async function fetchInBatches<T>(
  items: T[],
  batchSize: number,
  delayMs: number,
  fn: (item: T) => Promise<any>
) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

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
  const [showAllMarkers, setShowAllMarkers] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [placeData, setPlaceData] = useState<Record<string, PlaceApiData>>({});
  const [transitionActive, setTransitionActive] = useState(false);
  const [transitionFrom, setTransitionFrom] = useState<Mode>('eat');
  const [transitionTo, setTransitionTo] = useState<Mode>('eat');
  const [transitionTrigger, setTransitionTrigger] = useState({ x: 0, y: 0 });
  const photoBlobUrlsRef = useRef<string[]>([]);

  // Fetch Google Places data for all 81 locations on mount.
  // Uses batched requests (5 per batch, 300ms delay) to avoid rate limiting.
  // Caches results so switching modes doesn't re-fetch.
  // Updates state incrementally as each batch completes.
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const locationEntries = Object.entries(LOCATION_NAMES);
      const createdBlobUrls: string[] = [];

      // Fetch all locations in batches of 5 with 300ms delays
      const results = await fetchInBatches(
        locationEntries,
        5,
        300,
        async ([id, locationName]) => {
          // Check cache first
          if (placeDataCache.has(id)) {
            return { id, data: placeDataCache.get(id)! };
          }
          const data = await fetchPlaceByName(locationName);
          return { id, data };
        }
      );

      // Process results in batches and update state incrementally
      for (let i = 0; i < results.length; i += 5) {
        if (!isMounted) break;

        const batchResults = results.slice(i, i + 5);
        const batchMerged: Record<string, PlaceApiData> = {};

        await Promise.all(
          batchResults.map(async (result) => {
            if (result.status === 'fulfilled') {
              const { id, data } = result.value;
              const sourcePhotoUrls = data.photoUrls ?? [];
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

              const finalPlaceData: PlaceApiData = {
                ...data,
                photoUrls: blobUrls,
              };

              batchMerged[id] = finalPlaceData;
              placeDataCache.set(id, finalPlaceData);
            }
          })
        );

        // Update state after this batch completes
        if (isMounted && Object.keys(batchMerged).length > 0) {
          setPlaceData((prev) => ({ ...prev, ...batchMerged }));
        }
      }

      if (!isMounted) {
        createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

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

  const handleLogoClick = () => {
    if (showAllMarkers) {
      // Return to the current mode view
      setShowAllMarkers(false);
      setSelectedLocation(null);
    } else {
      // Enter all-markers view
      setShowAllMarkers(true);
      setSelectedLocation(null);
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={`relative h-screen w-full overflow-hidden ${
          theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
        }`}
      >
        <MapView
          selectedMode={selectedMode}
          showAllMarkers={showAllMarkers}
          selectedLocation={selectedLocation}
          onLocationSelect={(id) => {
            setSelectedLocation(id);
            // Keep showing all markers when clicking a marker in all-mode
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          searchExpanded={searchExpanded}
          onSearchExpandedChange={setSearchExpanded}
          filtersExpanded={filtersExpanded}
          onFiltersExpandedChange={setFiltersExpanded}
          placeData={placeData}
          onModeChange={setSelectedMode}
        />
        <Sidebar
          selectedMode={selectedMode}
          showAllMarkers={showAllMarkers}
          onModeChange={(mode, event) => {
            if (mode !== selectedMode && event) {
              const rect = event.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              setTransitionFrom(selectedMode);
              setTransitionTo(mode);
              setTransitionTrigger({ x: centerX, y: centerY });
              setTransitionActive(true);
            }
            setSelectedMode(mode);
            setSelectedLocation(null);
            setShowAllMarkers(false);
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
          onLogoClick={handleLogoClick}
        />
        <ModeTransitionOverlay
          isActive={transitionActive}
          fromMode={transitionFrom}
          toMode={transitionTo}
          triggerX={transitionTrigger.x}
          triggerY={transitionTrigger.y}
          onComplete={() => setTransitionActive(false)}
        />
      </div>
    </ThemeContext.Provider>
  );
}
