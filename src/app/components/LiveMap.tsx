import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Mode = 'eat' | 'focus' | 'chill';

interface Location {
  id: string;
  lat: number;
  lng: number;
  name?: string;
}

interface LiveMapProps {
  selectedMode: Mode;
  locations: Location[];
  selectedLocation: string | null;
  onLocationSelect: (id: string) => void;
  onMapReady?: (map: L.Map) => void;
  theme?: 'dark' | 'light';
}

const MODE_COLORS = {
  eat: '#14b8a6',
  focus: '#f43f5e',
  chill: '#6366f1',
};

// Delete default icon to prevent Leaflet from trying to load marker images
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '',
  iconRetinaUrl: '',
  shadowUrl: '',
});

function buildIcon(modeColor: string, isSelected: boolean, enterDelay = 0, animate = false) {
  const size = isSelected ? 36 : 28;
  const pinHeight = isSelected ? 46 : 36;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${pinHeight}px;
      cursor: pointer;
      ${animate ? `animation: markerDrop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${enterDelay}ms both;` : ''}
    ">
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
          opacity: 0.4;
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        "></div>
      ` : ''}
      <svg
        width="${size}"
        height="${pinHeight}"
        viewBox="0 0 28 36"
        style="position: relative; z-index: 10; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); cursor: pointer;"
      >
        <path
          d="M14 0C7.373 0 2 5.373 2 12c0 8 12 24 12 24s12-16 12-24c0-6.627-5.373-12-12-12z"
          fill="${modeColor}"
        />
        <circle cx="14" cy="12" r="4" fill="white" />
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
  modeColor: string,
  markersRef: React.MutableRefObject<{ [key: string]: L.Marker }>,
  onLocationSelect: (id: string) => void,
  stagger: boolean,
) {
  locations.forEach((location, index) => {
    const isSelected = selectedLocation === location.id;
    const delay = stagger ? index * 80 : 0;
    const icon = buildIcon(modeColor, isSelected, delay, stagger);

    const marker = L.marker([location.lat, location.lng], { icon, interactive: true })
      .addTo(map)
      .on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onLocationSelect(location.id);
      });

    markersRef.current[location.id] = marker;
  });
}

export default function LiveMap({
  selectedMode,
  locations,
  selectedLocation,
  onLocationSelect,
  onMapReady,
  theme = 'dark',
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const prevModeRef = useRef<Mode>(selectedMode);
  const transitionLockRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [35.1856, 33.3823],
      zoom: 14,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${theme}_all/{z}/{x}/{y}{r}.png`,
      { attribution: '\u00a9 OpenStreetMap \u00a9 CARTO', maxZoom: 19 }
    ).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    if (onMapReady) onMapReady(map);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) tileLayerRef.current.remove();

    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '\u00a9 OpenStreetMap \u00a9 CARTO',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [theme]);

  // Update markers — with transition when mode changes, instant otherwise
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const modeColor = MODE_COLORS[selectedMode];
    const isModeChange = prevModeRef.current !== selectedMode;
    prevModeRef.current = selectedMode;

    if (isModeChange && !transitionLockRef.current && Object.keys(markersRef.current).length > 0) {
      // Lock to prevent re-entry during async transition
      transitionLockRef.current = true;

      // 1. Animate existing markers out
      Object.values(markersRef.current).forEach((marker) => {
        const el = marker.getElement();
        if (el) {
          el.style.animation = 'markerPop 0.2s cubic-bezier(0.55, 0, 1, 0.45) forwards';
        }
      });

      // 2. After exit, swap in new markers with staggered drop
      const exitDuration = 220;
      const timer = setTimeout(() => {
        Object.values(markersRef.current).forEach((m) => m.remove());
        markersRef.current = {};
        addMarkersToMap(map, locations, selectedLocation, modeColor, markersRef, onLocationSelect, true);
        transitionLockRef.current = false;
      }, exitDuration);

      return () => clearTimeout(timer);
    } else if (!isModeChange) {
      // Selection change or initial load — just refresh markers instantly
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      addMarkersToMap(map, locations, selectedLocation, modeColor, markersRef, onLocationSelect, false);
    }
  }, [locations, selectedLocation, selectedMode, onLocationSelect]);

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
        .custom-marker {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
      `}</style>
    </>
  );
}