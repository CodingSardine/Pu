import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ModeTransitionOverlay from './components/ModeTransitionOverlay';
import type { PlaceApiData } from './components/LocationCard';
import ThemeContext from './context/ThemeContext';
import { Search, SlidersHorizontal, UtensilsCrossed, Focus, Coffee } from 'lucide-react';
import { LOCATION_NAMES } from './data/locations.base';

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

// Location names for all 81 locations come from `src/app/data/locations.base.ts`.

// Module-level cache for place data to avoid re-fetching on mode switches
const placeDataCache = new Map<string, PlaceApiData>();

const PLACES_FETCH_TIMEOUT_MS = 12000;
const PHOTO_FETCH_TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  timeoutMs: number,
  externalSignal?: AbortSignal
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

async function fetchPlaceByName(locationName: string, signal?: AbortSignal): Promise<PlaceApiData> {
  const res = await fetchWithTimeout(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.googleMapsUri,places.location,places.editorialSummary,places.photos.name,places.rating,places.userRatingCount,places.formattedAddress,places.regularOpeningHours',
      },
      body: JSON.stringify({
        textQuery: `${locationName} Nicosia Cyprus`,
        maxResultCount: 1,
      }),
    },
    PLACES_FETCH_TIMEOUT_MS,
    signal
  );

  if (!res.ok) throw new Error(`Places API ${res.status}`);
  const data = await res.json();

  // Extract first place from search results
  const place = data.places?.[0];
  if (!place) throw new Error('No place found');

  // Intentionally no console logging here; noisy in production.

  // Build photo URLs from up to 4 photos
  const photoUrls: string[] = [];
  if (place.photos && Array.isArray(place.photos)) {
    const photosToFetch = Math.min(place.photos.length, 4);
    for (let i = 0; i < photosToFetch; i++) {
      const photoName = place.photos[i]?.name;
      if (photoName) {
        photoUrls.push(
          `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_PLACES_API_KEY}`
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
    placeId: place.id,
    googleMapsUri: place.googleMapsUri,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    description: place.editorialSummary?.text,
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
    const effectAbortController = new AbortController();

    const fetchAll = async () => {
      const locationEntries = Object.entries(LOCATION_NAMES);
      const createdBlobUrls: string[] = [];
      const sourceToBlobUrl = new Map<string, string>();

      // Fetch and process locations in batches of 5 with 300ms delays.
      // Each batch updates placeData immediately after it resolves.
      for (let i = 0; i < locationEntries.length; i += 5) {
        if (!isMounted || effectAbortController.signal.aborted) break;

        const batchEntries = locationEntries.slice(i, i + 5);
        const batchResults = await Promise.allSettled(
          batchEntries.map(async ([id, locationName]) => {
            if (placeDataCache.has(id)) {
              return { id, data: placeDataCache.get(id)! };
            }
            const data = await fetchPlaceByName(locationName, effectAbortController.signal);
            placeDataCache.set(id, data);
            return { id, data };
          })
        );
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
                    sourcePhotoUrls.map(async (url: string) => {
                      const cachedBlobUrl = sourceToBlobUrl.get(url);
                      if (cachedBlobUrl) {
                        return cachedBlobUrl;
                      }

                      const res = await fetchWithTimeout(
                        url,
                        undefined,
                        PHOTO_FETCH_TIMEOUT_MS,
                        effectAbortController.signal
                      );
                      if (!res.ok) {
                        throw new Error(`Photo fetch failed: ${res.status}`);
                      }
                      const blob = await res.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      sourceToBlobUrl.set(url, blobUrl);
                      createdBlobUrls.push(blobUrl);
                      return blobUrl;
                    })
                  );
                } catch {
                  // Ignore photo failures; card will render without images.
                }
              }

              const finalPlaceData: PlaceApiData = {
                ...data,
                // If blob conversion fails, keep source URLs so images still render.
                photoUrls: blobUrls ?? data.photoUrls,
              };

              batchMerged[id] = finalPlaceData;
            }
          })
        );

        // Update state after this batch completes
        if (isMounted && Object.keys(batchMerged).length > 0) {
          setPlaceData((prev) => ({ ...prev, ...batchMerged }));
        }

        if (i + 5 < locationEntries.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      if (!isMounted) {
        createdBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      photoBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      photoBlobUrlsRef.current = createdBlobUrls;
    };

    fetchAll();

    return () => {
      isMounted = false;
      effectAbortController.abort();
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

  const handleTransitionComplete = useCallback(() => {
    setTransitionActive(false);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const mobileModes = [
    { key: 'eat' as Mode, icon: <UtensilsCrossed size={18} />, label: 'Eat' },
    { key: 'focus' as Mode, icon: <Focus size={18} />, label: 'Focus' },
    { key: 'chill' as Mode, icon: <Coffee size={18} />, label: 'Chill' },
  ];

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
        {/* Map scrim: improves sidebar/status contrast vs tiles */}
        <div
          className="fixed top-0 h-screen pointer-events-none hidden sm:block"
          style={{
            left: '4rem', // aligns with sidebar width (w-16)
            // Keep this narrow so it doesn't wash out map markers near the edge.
            width: '1.25rem',
            zIndex: 950,
            background:
              theme === 'dark'
                ? 'linear-gradient(to right, rgba(15,23,42,0.75), rgba(15,23,42,0.22), rgba(15,23,42,0))'
                : 'linear-gradient(to right, rgba(255,255,255,0.78), rgba(255,255,255,0.28), rgba(255,255,255,0))',
          }}
        />
        {/* Mobile controls (shown on phones) */}
        {isMobile && !selectedLocation && (
          <div
            className="fixed left-0 right-0 bottom-0 z-[1200] px-3 pb-3 pt-2"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
              background:
                theme === 'dark'
                  ? 'linear-gradient(to top, rgba(15,23,42,0.92), rgba(15,23,42,0.6), rgba(15,23,42,0))'
                  : 'linear-gradient(to top, rgba(248,250,252,0.96), rgba(248,250,252,0.7), rgba(248,250,252,0))',
            }}
          >
            <div
              className={`mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl px-3 py-2 shadow-xl backdrop-blur-xl border ${
                theme === 'dark' ? 'bg-slate-900/70 border-white/10' : 'bg-white/70 border-black/10'
              }`}
            >
              <div className="flex items-center gap-1">
                {mobileModes.map((m) => {
                  const active = !showAllMarkers && selectedMode === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => {
                        setSelectedMode(m.key);
                        setSelectedLocation(null);
                        setShowAllMarkers(false);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? theme === 'dark'
                            ? 'bg-white/10 text-white'
                            : 'bg-black/10 text-slate-900'
                          : theme === 'dark'
                          ? 'text-slate-200 hover:bg-white/5'
                          : 'text-slate-700 hover:bg-black/5'
                      }`}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearchExpanded((p) => !p);
                    setFiltersExpanded(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-black/5 hover:bg-black/10 text-slate-700'
                  }`}
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => {
                    setFiltersExpanded((p) => !p);
                    setSearchExpanded(false);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-slate-200' : 'bg-black/5 hover:bg-black/10 text-slate-700'
                  }`}
                  aria-label="Filters"
                >
                  <SlidersHorizontal size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
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
          theme={theme}
          onComplete={handleTransitionComplete}
        />
      </div>
    </ThemeContext.Provider>
  );
}
