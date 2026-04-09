import { useState, useRef } from 'react';
import React from 'react';
import { Search, Sun, Moon, SlidersHorizontal, UtensilsCrossed, Focus, Coffee } from 'lucide-react';
import svgPaths from '../../imports/svg-btvw69dr9p';
import { useTheme } from '../context/ThemeContext';

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

interface SidebarProps {
  selectedMode: Mode;
  showAllMarkers: boolean;
  onModeChange: (mode: Mode, event?: React.MouseEvent<HTMLButtonElement>) => void;
  onThemeChange: (theme: Theme) => void;
  onSearchToggle: () => void;
  onFiltersToggle: () => void;
  activeFilters: string[];
  searchExpanded?: boolean;
  filtersExpanded?: boolean;
  onLogoClick: () => void;
}

const MODE_COLORS = {
  eat: '#14b8a6',
  focus: '#f43f5e',
  chill: '#6366f1',
};

const MODE_COLORS_LIGHT = {
  eat: '#2a9d8f',
  focus: '#9b2335',
  chill: '#4a5568',
};

function getModeColor(mode: Mode, theme: Theme): string {
  return theme === 'light' ? MODE_COLORS_LIGHT[mode] : MODE_COLORS[mode];
}

const MODE_LABELS = {
  eat: 'EAT',
  focus: 'FOCUS',
  chill: 'CHILL',
};

const FILTER_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'power', label: 'Power Outlets' },
  { id: 'outdoor', label: 'Outdoor Seating' },
  { id: 'pet-friendly', label: 'Pet Friendly' },
  { id: 'budget', label: '€' },
  { id: 'premium', label: '€€€' },
];

interface LogoButtonProps {
  theme: Theme;
  showAllMarkers: boolean;
  onClick: () => void;
}

function LogoButton({ theme, showAllMarkers, onClick }: LogoButtonProps) {
  const fillColor = theme === 'dark' ? '#ffffff' : '#000000';
  const secondaryFillColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="relative">
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={showAllMarkers ? 'Return to mode view' : 'Show all markers'}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl outline-none focus:outline-none cursor-pointer"
      style={{
        transition: 'box-shadow 0.6s ease, transform 0.3s ease',
        boxShadow: showAllMarkers
          ? '0 0 0 1.5px rgba(99,102,241,0.7), 0 0 16px #14b8a670, 0 0 28px #f43f5e50, 0 0 44px #6366f140'
          : 'none',
        transform: showAllMarkers ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Spinning conic-gradient border ring */}
      {showAllMarkers && (
        <span
          className="absolute pointer-events-none"
          style={{
            inset: '-3px',
            borderRadius: '14px',
            background: 'conic-gradient(from 0deg, #14b8a6, #f43f5e, #6366f1, #14b8a6cc, #14b8a6)',
            animation: 'logoRingSpin 2.5s linear infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Inner background to mask the ring */}
      {showAllMarkers && (
        <span
          className="absolute pointer-events-none"
          style={{
            inset: '-1px',
            borderRadius: '12px',
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            zIndex: 1,
          }}
        />
      )}

      {/* Outer expanding pulse halo */}
      {showAllMarkers && (
        <span
          className="absolute pointer-events-none"
          style={{
            inset: '-8px',
            borderRadius: '20px',
            border: '1px solid rgba(99,102,241,0.35)',
            animation: 'logoPulse 2s ease-in-out infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Second pulse ring offset */}
      {showAllMarkers && (
        <span
          className="absolute pointer-events-none"
          style={{
            inset: '-14px',
            borderRadius: '26px',
            border: '1px solid rgba(20,184,166,0.2)',
            animation: 'logoPulse 2s ease-in-out 0.4s infinite',
            zIndex: 0,
          }}
        />
      )}

      {/* Logo SVG */}
      <svg
        className="block h-full w-full"
        fill="none"
        viewBox="0 0 149 186.129"
        style={{
          position: 'relative',
          zIndex: 2,
          filter: showAllMarkers
            ? `drop-shadow(0 0 5px #14b8a6cc) drop-shadow(0 0 10px #f43f5e70) drop-shadow(0 0 16px #6366f160)`
            : 'none',
          transition: 'filter 0.6s ease',
        }}
      >
        <g id="Logo">
          <path clipRule="evenodd" d={svgPaths.p5904d70} fill={fillColor} fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p3a3fc000} fill={secondaryFillColor} fillRule="evenodd" />
        </g>
      </svg>
      </button>

      {/* Hover Pill Tooltip */}
      {isHovering && !showAllMarkers && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[1010] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
          style={{
            background: theme === 'dark' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'tooltipFadeIn 0.2s ease forwards',
            backdropFilter: 'blur(8px)',
          }}
        >
          Show All
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  selectedMode,
  showAllMarkers,
  onModeChange,
  onThemeChange = () => {},
  onSearchToggle = () => {},
  onFiltersToggle = () => {},
  activeFilters = [],
  searchExpanded = false,
  filtersExpanded = false,
  onLogoClick,
}: SidebarProps) {
  const theme = useTheme();
  const [modeToast, setModeToast] = useState<{ mode: Mode; label: string; y: number; key: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgColor = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const modeColor = getModeColor(selectedMode, theme);
  const modeButtonsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const modes = [
    { key: 'eat' as Mode, icon: <UtensilsCrossed size={20} />, label: MODE_LABELS.eat },
    { key: 'focus' as Mode, icon: <Focus size={20} />, label: MODE_LABELS.focus },
    { key: 'chill' as Mode, icon: <Coffee size={20} />, label: MODE_LABELS.chill },
  ];

  const handleModeClick = (mode: Mode, label: string, event: React.MouseEvent<HTMLButtonElement>) => {
    // Clear any existing timeout to prevent stacking
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    // Don't show toast when a panel is open
    if (searchExpanded || filtersExpanded) {
      onModeChange(mode, event);
      return;
    }

    // Get button position
    const rect = event.currentTarget.getBoundingClientRect();

    // Calculate center of button for vertical alignment
    const buttonCenter = rect.top + (rect.height / 2);

    // Set toast
    setModeToast({ mode, label, y: buttonCenter, key: Date.now() });

    // Call mode change with event for transition trigger position
    onModeChange(mode, event);

    // Store timeout reference and clear toast after 1.5 seconds
    toastTimerRef.current = setTimeout(() => {
      setModeToast(null);
      toastTimerRef.current = null;
    }, 1500);
  };

  return (
    <>
      {/* Keyframes for logo animations */}
      <style>{`
        @keyframes logoRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.15;
          }
        }
        @keyframes allMarkersToast {
          0% { opacity: 0; transform: translateX(-14px); }
          15% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-14px); }
        }
        .animate-all-markers-toast {
          animation: allMarkersToast 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Mode Toast */}
      {modeToast && (
        <div
          key={modeToast.key}
          className="fixed z-[1003] pointer-events-none flex items-center"
          style={{
            left: '4.5rem',
            top: `${modeToast.y}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="rounded-full px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap flex items-center animate-mode-toast"
            style={{
              backgroundColor: getModeColor(modeToast.mode, theme),
              boxShadow: `0 0 20px ${getModeColor(modeToast.mode, theme)}60, 0 4px 12px ${getModeColor(modeToast.mode, theme)}40`,
            }}
          >
            {modeToast.label}
          </div>
        </div>
      )}

      {/* Sidebar - Fixed width icon toolbar (always visible on desktop) */}
      <div
        className={`fixed left-0 top-0 z-[1001] hidden md:flex h-full w-16 flex-col items-center pt-5 pb-5 ${bgColor} shadow-2xl`}
        style={{
          borderRight: showAllMarkers
            ? '1px solid rgba(99,102,241,0.25)'
            : theme === 'dark'
            ? '1px solid rgba(255,255,255,0.04)'
            : '1px solid rgba(0,0,0,0.06)',
          transition: 'border-color 0.5s ease',
        }}
      >
        {/* Logo — top anchor, now clickable */}
        <LogoButton
          theme={theme}
          showAllMarkers={showAllMarkers}
          onClick={onLogoClick}
        />

        {/* Nav cluster — vertically centered in remaining space */}
        <div className="flex flex-1 flex-col items-center justify-center">

          {/* Mode buttons */}
          <div className="flex flex-col items-center gap-1.5">
            {modes.map((mode) => {
              const isActive = !showAllMarkers && selectedMode === mode.key;
              const modeColorVal = getModeColor(mode.key, theme);
              return (
                <button
                  key={mode.key}
                  ref={(el) => { modeButtonsRef.current[mode.key] = el; }}
                  onClick={(e) => handleModeClick(mode.key, mode.label, e)}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl outline-none focus:outline-none transition-all duration-300 ${
                    isActive
                      ? 'shadow-lg'
                      : theme === 'dark'
                      ? 'hover:bg-slate-800/50'
                      : 'hover:bg-slate-200/50'
                  }`}
                  style={{
                    backgroundColor: isActive ? modeColorVal : 'transparent',
                    boxShadow: isActive
                      ? `0 0 20px ${modeColorVal}40, 0 4px 12px ${modeColorVal}30`
                      : showAllMarkers
                      ? `0 0 8px ${modeColorVal}30`
                      : undefined,
                    opacity: showAllMarkers ? 0.55 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    className={`flex items-center justify-center`}
                    style={{
                      color: isActive
                        ? 'white'
                        : showAllMarkers
                        ? modeColorVal
                        : theme === 'dark'
                        ? '#94a3b8'
                        : '#475569',
                    }}
                  >
                    {mode.icon}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className={`my-4 h-px w-6 rounded-full`}
            style={{
              background: showAllMarkers
                ? 'linear-gradient(to right, #14b8a6, #f43f5e, #6366f1)'
                : theme === 'dark'
                ? '#334155'
                : '#cbd5e1',
              transition: 'background 0.5s ease',
            }}
          />

          {/* Tool buttons */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onSearchToggle}
              className={`flex h-11 w-11 items-center justify-center rounded-xl outline-none focus:outline-none transition-colors duration-200 ${
                searchExpanded
                  ? theme === 'dark' ? 'bg-slate-700/70' : 'bg-slate-200'
                  : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-200/50'
              }`}
            >
              <Search size={18} className={searchExpanded ? (theme === 'dark' ? 'text-slate-200' : 'text-slate-800') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')} />
            </button>

            <button
              onClick={onFiltersToggle}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl outline-none focus:outline-none transition-colors duration-200 ${
                filtersExpanded
                  ? theme === 'dark' ? 'bg-slate-700/70' : 'bg-slate-200'
                  : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-200/50'
              }`}
            >
              <SlidersHorizontal size={18} className={filtersExpanded ? (theme === 'dark' ? 'text-slate-200' : 'text-slate-800') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')} />
              {activeFilters.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: modeColor,
                    boxShadow: `0 0 10px ${modeColor}60`,
                  }}
                >
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Theme toggle — bottom anchor */}
        <button
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          className={`flex h-11 w-11 items-center justify-center rounded-xl outline-none focus:outline-none transition-colors duration-200 ${
            theme === 'dark'
              ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400'
              : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-500'
          }`}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Mode toast - fixed position, centered */}
      <div
        className="fixed z-[1200] top-4 left-1/2 -translate-x-1/2 md:left-[4.5rem] md:translate-x-0"
        style={{
          transition: 'transform 0.6s ease',
        }}
      >
        {modeToast && (
          <div
            className="rounded-full px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap flex items-center animate-mode-toast"
            style={{
              backgroundColor: getModeColor(modeToast.mode, theme),
              boxShadow: `0 0 20px ${getModeColor(modeToast.mode, theme)}60, 0 4px 12px ${getModeColor(modeToast.mode, theme)}40`,
            }}
          >
            {modeToast.label}
          </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1001] flex md:hidden h-16 items-center justify-around px-4 ${bgColor} shadow-[0_-4px_12px_rgba(0,0,0,0.1)]`}
        style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}
      >
        {/* Mode buttons */}
        {modes.map((mode) => {
          const isActive = !showAllMarkers && selectedMode === mode.key;
          const modeColorVal = getModeColor(mode.key, theme);
          return (
            <button
              key={mode.key}
              onClick={(e) => handleModeClick(mode.key, mode.label, e)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-300"
              style={{ color: isActive ? modeColorVal : theme === 'dark' ? '#94a3b8' : '#475569' }}
            >
              {mode.icon}
              <span className="text-[10px] font-semibold">{mode.label}</span>
            </button>
          );
        })}
        {/* Search */}
        <button
          onClick={onSearchToggle}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl"
          style={{ color: theme === 'dark' ? '#94a3b8' : '#475569' }}
        >
          <Search size={20} />
          <span className="text-[10px] font-semibold">SEARCH</span>
        </button>
        {/* Theme toggle */}
        <button
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl"
          style={{ color: theme === 'dark' ? '#94a3b8' : '#475569' }}
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          <span className="text-[10px] font-semibold">THEME</span>
        </button>
      </div>
    </>
  );
}
