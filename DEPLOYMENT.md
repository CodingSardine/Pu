# Pu - Location Finder for Nicosia, Cyprus

A modern location-finding app for students and remote workers in Nicosia, Cyprus. Features three modes (Eat/Focus/Chill) with dynamic Google Places API integration.

## 🚀 Setup Instructions

### 1. Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/CodingSardine/Pu.git
   cd Pu
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google Places API key:
   ```
   VITE_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

### 2. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API (New)**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key and add it to your `.env` file

⚠️ **Important**: Restrict your API key by:
- Adding HTTP referrers (your domain)
- Limiting to Places API only

### 3. GitHub Pages Deployment

#### Setting up the Secret

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VITE_GOOGLE_PLACES_API_KEY`
5. Value: Your Google Places API key
6. Click **Add secret**

#### Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The site will be deployed automatically on every push to `main`

Your site will be available at: `https://codingsardine.github.io/Pu/`

## 🏗️ Building for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory.

## 🎨 Features

- **Three Modes**: Eat, Focus, Chill
- **Live Map**: Interactive Leaflet map with custom markers
- **Dynamic Data**: Real-time data from Google Places API
- **Search & Filter**: Find locations by name, cuisine, and features
- **Theme Toggle**: Dark and light mode support
- **Responsive**: Desktop-optimized experience

## 📁 Project Structure

```
Pu/
├── src/
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── context/        # Theme context
│   │   └── App.tsx         # Main app component
│   └── styles/             # CSS styles
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow
├── .env.example            # Example environment variables
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

## 🔒 Security Notes

- **Never commit `.env`** - It's in `.gitignore`
- **Use GitHub Secrets** for deployment
- **Restrict your API key** in Google Cloud Console
- The app is for demo purposes - not intended for collecting PII

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

Built with React, TypeScript, Tailwind CSS, and Leaflet
