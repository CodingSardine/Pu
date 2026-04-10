import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';

type Mode = 'eat' | 'focus' | 'chill';

interface Location {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  mode?: Mode;
}

interface LiveMapProps {
  selectedMode: Mode;
  showAllMarkers: boolean;
  locations: Location[];
  selectedLocation: string | null;
  onLocationSelect: (id: string) => void;
  onMapReady?: (map: L.Map) => void;
  allLocations?: Location[];
}

const MODE_COLORS = {
  eat: '#0ea5a6',
  focus: '#fb7185',
  chill: '#818cf8',
};

const MODE_COLORS_LIGHT = {
  eat: '#0f766e',
  focus: '#be123c',
  chill: '#4338ca',
};

function getModeColor(mode: Mode, theme: 'dark' | 'light'): string {
  return theme === 'light' ? MODE_COLORS_LIGHT[mode] : MODE_COLORS[mode];
}

function clearTimeoutList(timers: ReturnType<typeof setTimeout>[]) {
  timers.forEach((timer) => clearTimeout(timer));
  timers.length = 0;
}

// Delete default icon to prevent Leaflet from trying to load marker images
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '',
  iconRetinaUrl: '',
  shadowUrl: '',
});

function buildIcon(
  modeColor: string,
  isSelected: boolean,
  enterDelay = 0,
  animate = false,
  theme: 'dark' | 'light' = 'dark',
  isAllMode = false,
  markerMode?: Mode,
  markerTitle?: string,
) {
  const size = isSelected ? 36 : 28;
  const pinHeight = isSelected ? 46 : 36;

  const markerFill = modeColor;
  const centerDotFill = 'white';
  const shadowColor = theme === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.4)';

  // In all-markers mode, add a subtle mode-colored glow ring around each marker
  const allModeRing = isAllMode && !isSelected
    ? `<div style="
        position: absolute;
        left: 50%;
        top: 35%;
        transform: translate(-50%, -50%);
        width: ${size + 8}px;
        height: ${size + 8}px;
        border-radius: 50%;
        border: 1.5px solid ${modeColor}80;
        pointer-events: none;
        animation: allModeRingPulse 2.5s ease-in-out infinite;
        animation-delay: ${enterDelay % 600}ms;
      "></div>`
    : '';

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${pinHeight}px;
      cursor: pointer;
      ${animate ? `animation: markerDrop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${enterDelay}ms both;` : ''}
    " title="${markerTitle || 'Location'}">
      ${isSelected ? `
        <div style="
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: ${modeColor};
          opacity: ${theme === 'light' ? '0.3' : '0.4'};
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        "></div>
      ` : ''}
      ${allModeRing}
      <svg
        width="${size}"
        height="${pinHeight}"
        viewBox="0 0 28 36"
        style="position: relative; z-index: 10; filter: drop-shadow(0 4px 6px ${shadowColor})${isAllMode ? ` drop-shadow(0 0 4px ${modeColor}60)` : ''}; cursor: pointer;"
      >
        <path
          d="M14 0C7.373 0 2 5.373 2 12c0 8 12 24 12 24s12-16 12-24c0-6.627-5.373-12-12-12z"
          fill="${markerFill}"
        />
        <circle cx="14" cy="12" r="4" fill="${centerDotFill}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, pinHeight],
    iconAnchor: [size / 2, pinHeight],
  });
}

function addMarkersToMap(
  map: L.Map,
  locations: Location[],
  selectedLocation: string | null,
  defaultModeColor: string,
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>,
  staggerTimersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>,
  hoverTimersRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>,
  onLocationSelect: (id: string) => void,
  stagger: boolean,
  theme: 'dark' | 'light' = 'dark',
  showAllMarkers = false,
  staggerStepMs = 60,
) {
  locations.forEach((location, index) => {
    // Validate coordinates before creating marker
    if (typeof location.lat !== 'number' || typeof location.lng !== 'number' ||
        isNaN(location.lat) || isNaN(location.lng)) {
      return;
    }

    const isSelected = selectedLocation === location.id;
    const delay = stagger ? index * staggerStepMs : 0;

    // In all-markers mode, use the location's own mode color
    const markerColor = showAllMarkers && location.mode
      ? getModeColor(location.mode, theme)
      : defaultModeColor;

    const icon = buildIcon(markerColor, isSelected, delay, stagger, theme, showAllMarkers, location.mode, location.name);

    // Create marker with explicit coordinates
    const latLng = L.latLng(location.lat, location.lng);
    const marker = L.marker(latLng, {
      icon,
      interactive: true,
      opacity: stagger ? 0 : 1,
    });

    // If staggered animation, fade in after delay
    if (stagger) {
      const staggerTimer = setTimeout(() => {
        if (marker && map.hasLayer(marker)) {
          marker.setOpacity(1);
        }
      }, delay);
      staggerTimersRef.current.push(staggerTimer);
    }

    marker
      .addTo(map)
      .on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        // Pan map so marker is in the right portion of viewport,
        // leaving room for the card on the left
        const mapSize = map.getSize();
        // On mobile, the card becomes a bottom sheet, so don't offset X.
        // On desktop, match responsive card widths.
        const cardWidth = window.innerWidth < 640
          ? 0
          : window.innerWidth >= 1280
          ? 480
          : window.innerWidth >= 1024
          ? 420
          : 400;
        const markerPoint = map.latLngToContainerPoint([location.lat, location.lng]);
        // Target: marker should be at x = cardWidth + (remaining width) / 2
        const targetX = cardWidth + (mapSize.x - cardWidth) / 2;
        const targetY = mapSize.y / 2;
        const offsetX = markerPoint.x - targetX;
        const offsetY = markerPoint.y - targetY;
        if (Math.abs(offsetX) > 10 || Math.abs(offsetY) > 10) {
          map.panBy([offsetX, offsetY], { animate: true, duration: 0.4 });
        }
        onLocationSelect(location.id);
      })
      .on('mouseover', (e) => {
        const marker = e.target;
        const el = marker.getElement();
        if (el && el.isConnected) {
          // Create or show the hover pill
          let pill = el.querySelector('.marker-hover-pill') as HTMLElement | null;
          if (!pill) {
            pill = document.createElement('div');
            pill.className = 'marker-hover-pill';
            pill.innerHTML = location.name || '';
            pill.style.cssText = `
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%) translateY(-8px);
              background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
              color: ${theme === 'dark' ? 'white' : '#0f172a'};
              padding: 4px 10px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 600;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              z-index: 1000;
              opacity: 0;
              transition: all 0.2s ease;
              backdrop-filter: blur(8px);
            `;
            el.appendChild(pill);
          }
          // Trigger animation
          const hoverInTimer = setTimeout(() => {
            if (!el.isConnected || !pill || !pill.isConnected) return;
            pill.style.opacity = '1';
            pill.style.transform = 'translateX(-50%) translateY(-12px)';
          }, 10);
          hoverTimersRef.current.push(hoverInTimer);
        }
      })
      .on('mouseout', (e) => {
        const el = e.target.getElement();
        if (el && el.isConnected) {
          const pill = el.querySelector('.marker-hover-pill') as HTMLElement;
          if (pill) {
            pill.style.opacity = '0';
            pill.style.transform = 'translateX(-50%) translateY(-8px)';
            // Remove after transition
            const hoverOutTimer = setTimeout(() => {
              if (pill.isConnected) {
                pill.remove();
              }
            }, 200);
            hoverTimersRef.current.push(hoverOutTimer);
          }
        }
      });

    markersRef.current[location.id] = marker;
  });
}

export default function LiveMap({
  selectedMode,
  showAllMarkers,
  locations,
  selectedLocation,
  onLocationSelect,
  onMapReady,
  allLocations,
}: LiveMapProps) {
  const theme = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const prevModeRef = useRef<Mode>(selectedMode);
  const prevShowAllRef = useRef<boolean>(showAllMarkers);
  const prevThemeRef = useRef<'dark' | 'light'>(theme);
  const prevLocationsRef = useRef<Location[]>(locations);
  const prevLocationIdsRef = useRef<string>('');
  const transitionLockRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const tileLayerMountedRef = useRef(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  const staggerTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hoverTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const invalidateSizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [35.1720, 33.3620],
      zoom: 14,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 20,
        // Performance: reduce tile churn during drag/zoom.
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2,
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    // Make dark tiles slightly greyer for UI contrast.
    const tileEl = tileLayer.getContainer();
    if (tileEl) {
      tileEl.style.filter = theme === 'dark' ? 'brightness(1.15) contrast(0.92) saturate(0.85)' : '';
    }

    invalidateSizeTimerRef.current = setTimeout(() => {
      if (mapRef.current === map) {
        map.invalidateSize();
      }
      invalidateSizeTimerRef.current = null;
    }, 100);

    if (onMapReady) onMapReady(map);
    tileLayerMountedRef.current = true;

    return () => {
      if (invalidateSizeTimerRef.current) {
        clearTimeout(invalidateSizeTimerRef.current);
        invalidateSizeTimerRef.current = null;
      }
      clearTimeoutList(staggerTimersRef.current);
      clearTimeoutList(hoverTimersRef.current);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      tileLayerMountedRef.current = false;
    };
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current || !tileLayerMountedRef.current) return;
    if (tileLayerRef.current) tileLayerRef.current.remove();

    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 20,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(mapRef.current);

    const tileEl = tileLayerRef.current.getContainer();
    if (tileEl) {
      tileEl.style.filter = theme === 'dark' ? 'brightness(1.15) contrast(0.92) saturate(0.85)' : '';
    }
  }, [theme]);

  // Sync onLocationSelect ref to avoid dependency array churn
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Update markers — with transition when mode or all-markers state changes, instant otherwise
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    clearTimeoutList(staggerTimersRef.current);
    clearTimeoutList(hoverTimersRef.current);
    const modeColor = getModeColor(selectedMode, theme);
    const isModeChange = prevModeRef.current !== selectedMode;
    const isAllMarkersChange = prevShowAllRef.current !== showAllMarkers;
    const isThemeChange = prevThemeRef.current !== theme;
    const currentIds = locations.map((l) => l.id).join('|');
    const sameIds = prevLocationIdsRef.current === currentIds;
    prevModeRef.current = selectedMode;
    prevShowAllRef.current = showAllMarkers;
    prevThemeRef.current = theme;
    prevLocationsRef.current = locations;
    prevLocationIdsRef.current = currentIds;

    const needsTransition = (isModeChange || isAllMarkersChange) &&
      !transitionLockRef.current &&
      Object.keys(markersRef.current).length > 0;

    if (needsTransition) {
      // Lock to prevent re-entry during async transition
      transitionLockRef.current = true;
      isAnimatingRef.current = true;

      // 1. Capture DOM elements before removing from map
      const markerElements: HTMLElement[] = [];
      Object.values(markersRef.current).forEach((marker) => {
        const el = marker.getElement();
        if (el) markerElements.push(el);
      });

      // 2. Remove all markers from map synchronously (no overlap!)
      Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
      markersRef.current = {};

      // 3. Now animate the detached DOM elements
      markerElements.forEach((el) => {
        el.style.animation = 'markerPop 0.2s cubic-bezier(0.55, 0, 1, 0.45) forwards';
      });

      // 4. After exit animation, add new markers with staggered drop
      const exitDuration = 220;
      const timer = setTimeout(() => {
        addMarkersToMap(
          map,
          locations,
          selectedLocation,
          modeColor,
          markersRef,
          staggerTimersRef,
          hoverTimersRef,
          (...args: [string]) => onLocationSelectRef.current(...args),
          true,
          theme,
          showAllMarkers
        );
        transitionLockRef.current = false;
        isAnimatingRef.current = false;
      }, exitDuration);

      return () => {
        clearTimeout(timer);
        clearTimeoutList(staggerTimersRef.current);
        clearTimeoutList(hoverTimersRef.current);
        transitionLockRef.current = false;
        isAnimatingRef.current = false;
      };
    } else {
      // Selection change, initial load, filter updates, or non-transition mode/all-state changes.
      // Guard against this branch firing while a transition is in flight.
      if (isAnimatingRef.current) return;

      // If ids haven't changed, update incrementally (no remove/re-add).
      const canIncrementallyUpdate = sameIds && !isModeChange && !isAllMarkersChange && !isThemeChange;
      if (canIncrementallyUpdate && Object.keys(markersRef.current).length > 0) {
        let missingMarker = false;

        locations.forEach((location) => {
          const marker = markersRef.current[location.id];
          if (!marker) {
            missingMarker = true;
            return;
          }

          marker.setLatLng([location.lat, location.lng]);

          const isSelected = selectedLocation === location.id;
          const markerColor = showAllMarkers && location.mode
            ? getModeColor(location.mode, theme)
            : modeColor;

          marker.setIcon(
            buildIcon(markerColor, isSelected, 0, false, theme, showAllMarkers, location.mode, location.name)
          );
        });

        if (!missingMarker) return;
        // fallthrough to full rebuild if something got out of sync
      }

      // Rebuild markers for initial load / filter changes / theme changes, but animate only on first add.
      const shouldAnimateEnter = Object.keys(markersRef.current).length === 0;
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      addMarkersToMap(
        map,
        locations,
        selectedLocation,
        modeColor,
        markersRef,
        staggerTimersRef,
        hoverTimersRef,
        (...args: [string]) => onLocationSelectRef.current(...args),
        shouldAnimateEnter,
        theme,
        showAllMarkers,
        30
      );
    }
  }, [locations, selectedLocation, selectedMode, showAllMarkers, theme]);

  return (
    <>
      <div ref={mapContainerRef} className="h-full w-full" />
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        @keyframes markerDrop {
          0% {
            opacity: 0;
            transform: translateY(-28px) scale(0.5);
          }
          60% {
            opacity: 1;
            transform: translateY(5px) scale(1.08);
          }
          80% {
            transform: translateY(-3px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes markerPop {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          40% {
            transform: scale(1.15) translateY(-4px);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translateY(10px);
          }
        }
        @keyframes allModeRingPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
      `}</style>
    </>
  );
}
