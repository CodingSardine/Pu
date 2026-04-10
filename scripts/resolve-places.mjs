import fs from 'node:fs';
import path from 'node:path';

const API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Missing API key. Set VITE_GOOGLE_PLACES_API_KEY or GOOGLE_PLACES_API_KEY in your environment.');
  process.exit(1);
}

const root = process.cwd();
const basePath = path.join(root, 'src', 'app', 'data', 'locations.base.ts');
const outPath = path.join(root, 'src', 'app', 'data', 'locations.resolved.json');

const baseText = fs.readFileSync(basePath, 'utf8');
const entries = [...baseText.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*mode:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'[\s\S]*?\}/g)]
  .map((m) => ({ id: m[1], mode: m[2], name: m[3] }));

if (entries.length !== 81) {
  console.error(`Expected 81 entries in locations.base.ts, got ${entries.length}.`);
  process.exit(1);
}

async function searchText(textQuery) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.googleMapsUri,places.location',
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}`);
  return res.json();
}

const resolved = [];
for (const e of entries) {
  const q = `${e.name} Nicosia Cyprus`;
  try {
    const data = await searchText(q);
    const place = data.places?.[0];
    if (!place?.id || !place?.googleMapsUri || !place?.location) throw new Error('No place found');
    resolved.push({
      id: e.id,
      mode: e.mode,
      name: e.name,
      features: [],
      placeId: place.id,
      googleMapsUri: place.googleMapsUri,
      lat: place.location.latitude,
      lng: place.location.longitude,
    });
    console.log(`✓ ${e.id} → ${place.id}`);
  } catch (err) {
    console.error(`✗ ${e.id} (${e.name})`, err?.message ?? err);
    process.exitCode = 1;
  }
  await new Promise((r) => setTimeout(r, 120)); // gentle pacing
}

fs.writeFileSync(outPath, JSON.stringify(resolved, null, 2) + '\n', 'utf8');
console.log(`Wrote ${resolved.length} entries to ${outPath}`);

