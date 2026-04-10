import resolved from './locations.resolved.json';
import { BASE_LOCATIONS, type BaseLocation, type Mode } from './locations.base';

export interface ResolvedLocation extends BaseLocation {
  placeId: string;
  googleMapsUri: string;
  lat: number;
  lng: number;
}

function isResolvedLocation(x: any): x is ResolvedLocation {
  return !!x &&
    typeof x.id === 'string' &&
    typeof x.mode === 'string' &&
    typeof x.name === 'string' &&
    Array.isArray(x.features) &&
    typeof x.placeId === 'string' &&
    typeof x.googleMapsUri === 'string' &&
    typeof x.lat === 'number' &&
    typeof x.lng === 'number';
}

const resolvedList: ResolvedLocation[] =
  Array.isArray(resolved) && resolved.every(isResolvedLocation)
    ? (resolved as ResolvedLocation[])
    : [];

export const LOCATIONS: (BaseLocation | ResolvedLocation)[] =
  resolvedList.length === BASE_LOCATIONS.length ? resolvedList : BASE_LOCATIONS;

export const LOCATIONS_BY_MODE: Record<Mode, (BaseLocation | ResolvedLocation)[]> = {
  eat: LOCATIONS.filter((l) => l.mode === 'eat'),
  focus: LOCATIONS.filter((l) => l.mode === 'focus'),
  chill: LOCATIONS.filter((l) => l.mode === 'chill'),
};

