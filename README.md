# Pu — Location Finder for Nicosia, Cyprus

**Pu** is a desktop-first location discovery app designed for students and remote workers in Nicosia, Cyprus. It features a clean, modern interface with glow effects and glassmorphic elements, helping users find the perfect spot to eat, focus, or chill.

![Pu App](https://img.shields.io/badge/Status-Production%20Ready-success)
![Built with React](https://img.shields.io/badge/React-18.3.1-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.12-06B6D4)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

## 🌟 Features

### Core Functionality
- **Three Discovery Modes**
  - 🍴 **Eat Mode** — Discover restaurants, cafes, and food spots (teal theme)
  - 🎯 **Focus Mode** — Find coworking spaces and study-friendly locations (rose theme)
  - ☕ **Chill Mode** — Explore relaxing spots and social venues (indigo theme)

- **Interactive Map Interface**
  - Live Leaflet map with custom animated markers
  - Theme-reactive map tiles (CARTO basemaps)
  - Smooth marker transitions (exit fade + staggered enter) on mode switch
  - Smart map panning when selecting locations
  - Custom zoom controls

- **Advanced Search & Filtering**
  - Real-time search by location name and cuisine
  - Multi-filter support (WiFi, Power Outlets, Outdoor Seating, Pet Friendly, Budget, Premium)
  - Mutually exclusive search/filter panels with glassmorphic design
  - Live filtering — markers update instantly

- **Location Details**
  - 81 curated locations across Nicosia (27 per mode)
  - Google Places API integration for live photos, ratings, and hours
  - Detailed location cards with atmosphere, seating, and price info
  - Direct Google Maps navigation links

### Design System
- **Desktop-First Architecture** — Optimized for 1024px+ screens
- **Mode-Reactive Color Theming**
  - Teal (#14b8a6) for Eat mode
  - Rose (#f43f5e) for Focus mode
  - Indigo (#6366f1) for Chill mode
- **Glassmorphism** — Backdrop blur and transparency effects
- **Glow Effects** — Mode-colored shadows and halos
- **Dark/Light Theme Toggle**

### Technical Highlights
- **Icon-Only Sidebar** (64px width)
  - Logo pinned top
  - Mode + tool buttons vertically centered
  - Theme toggle pinned bottom
- **Z-Index Hierarchy**
  - `z-[999]` — Backdrop overlay
  - `z-[1001]` — Sidebar
  - `z-[1002]` — Search/Filter panels
  - `z-[1003]` — Mode toast notifications
- **Animation System**
  - Staggered marker entrance on mode switch
  - Bouncy drop animation with cubic-bezier easing
  - Fast exit animation for markers leaving the filtered set
  - Smooth fade-in for location cards

## 🚀 Tech Stack

- **Framework:** React 18.3.1 with TypeScript
- **Styling:** Tailwind CSS 4.1.12
- **Maps:** Leaflet 1.9.4
- **API Integration:** Google Places API (New)
- **Icons:** Lucide React 0.487.0
- **Build Tool:** Vite 6.3.5
- **Design Components:** Custom-built + shadcn/ui base

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/CodingSardine/Pu.git
cd Pu

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

## 🔧 Configuration

### Google Places API Setup

To enable live location data (photos, ratings, hours), set an environment variable:

- **`VITE_GOOGLE_PLACES_API_KEY`**: your Google Places API key

You can copy `.env.example` to `.env` and fill it in locally.

**Required API:**
- [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/place-id)

**Field Mask Used:**
```
photos,rating,userRatingCount,formattedAddress,regularOpeningHours
```

Without a valid key, the app gracefully falls back to hardcoded values.

### Map Tiles

The app uses **CARTO** basemaps with theme-reactive URLs:
- **Dark Mode:** `dark_all`
- **Light Mode:** `rastertiles/voyager`

No API key is required (subject to CARTO/OpenStreetMap terms).

## 📂 Project Structure

```
Pu/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main app component (state + API)
│   │   └── components/
│   │       ├── Sidebar.tsx            # 64px icon sidebar
│   │       ├── MapView.tsx            # Map container + panels
│   │       ├── LiveMap.tsx            # Leaflet integration
│   │       └── LocationCard.tsx       # Detail cards
│   ├── imports/                       # Figma-imported components
│   │   ├── Avo.tsx                    # Figma card design (Eat)
│   │   ├── Yfantourgeio.tsx           # Figma card design (Focus)
│   │   ├── K11.tsx                    # Figma card design (Chill)
│   │   └── svg-*.ts                   # Imported SVG assets
│   └── styles/
│       ├── index.css                  # Global styles
│       ├── theme.css                  # Tailwind theme + animations
│       ├── tailwind.css               # Tailwind config
│       └── fonts.css                  # Google Fonts (Inter + Bebas Neue)
├── package.json
├── vite.config.ts
└── README.md
```

## 🎨 Key Architectural Decisions

### Responsive layout
The UI is desktop-first, but the app still includes a small-screen experience (e.g. bottom controls and different card placement on mobile).

### Panel Management
- Search and filter panels are **mutually exclusive**
- Opening one auto-closes the other
- Mode toast is **suppressed** when either panel is open
- ESC key closes active panels

### Marker Animation Gating
The `buildIcon` function in `LiveMap.tsx` uses an `animate` flag:
- `true` — Staggered drop animation (initial marker render and mode/all-markers switches)
- `false` — Instant render (selection changes and routine updates)

This prevents animation conflicts during rapid interactions.

### selectedLocation clearing
`selectedLocation` is reset to `null` in `App.tsx` whenever the mode changes, ensuring a clean slate for each mode.

## 📍 Locations

There are **81 total locations** (27 per mode) defined in `src/app/components/MapView.tsx`.

All locations include:
- Coordinates (lat/lng)
- Feature tags (wifi, power, outdoor, pet-friendly, budget, premium)
- Hardcoded metadata (cuisine, price, atmosphere, seating)

## 🛠️ Build & Deploy

```bash
# Production build
npm run build
# or
pnpm build

# Output in /dist folder
```

**Deployment:**
- Static site hosting (Vercel, Netlify, Cloudflare Pages)
- Base path configured for GitHub Pages-style deployment: `base: '/Pu/'` (see `vite.config.ts`)

## 📝 License

This project uses:
- [shadcn/ui](https://ui.shadcn.com/) components under [MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- [Unsplash](https://unsplash.com) photos under [Unsplash License](https://unsplash.com/license)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

- Google Places API quota limits may cause some locations to fall back to hardcoded data
- Map tiles require internet connection (no offline support)
- Desktop-only design — no mobile optimization

## 🚧 Future Enhancements

- [ ] User authentication and saved locations
- [ ] Community reviews and ratings
- [ ] Real-time availability data
- [ ] Venue booking integration
- [ ] Export to calendar/maps apps
- [ ] Multi-language support (Greek/Turkish)

## 📧 Contact

**Repository:** [github.com/CodingSardine/Pu](https://github.com/CodingSardine/Pu)

---

Made with ❤️ for the Nicosia student & remote work community.
