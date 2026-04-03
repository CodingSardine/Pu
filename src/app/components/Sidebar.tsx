import { useState, useRef, useEffect } from 'react';
import { X, Search, Sun, Moon, SlidersHorizontal, UtensilsCrossed, Focus, Coffee } from 'lucide-react';
import svgPaths from '../../imports/svg-btvw69dr9p';

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

interface SidebarProps {
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onSearchToggle: () => void;
  onFiltersToggle: () => void;
  activeFilters: string[];
  searchExpanded?: boolean;
  filtersExpanded?: boolean;
}

const MODE_COLORS = {
  eat: '#14b8a6',
  focus: '#f43f5e',
  chill: '#6366f1',
};

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
  { id: 'budget', label: '\u20ac' },
  { id: 'premium', label: '\u20ac\u20ac\u20ac' },
];

function Logo({ theme }: { theme: Theme }) {
  const fillColor = theme === 'dark' ? '#ffffff' : '#000000';
  const secondaryFillColor = theme === 'dark' ? '#e2e8f0' : '#1e293b';
  
  return (
    <div className="flex h-10 w-10 items-center justify-center">
      <svg 
        className="block h-full w-full"
        fill="none" 
        viewBox="0 0 149 186.129"
      >
        <g id="Logo">
          <path clipRule="evenodd" d={svgPaths.p5904d70} fill={fillColor} fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p3a3fc000} fill={secondaryFillColor} fillRule="evenodd" />
        </g>
      </svg>
    </div>
  );
}

interface ModeButtonProps {
  mode: Mode;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  theme: Theme;
}

function ModeButton({ mode, icon, isActive, onClick, theme }: ModeButtonProps) {
  const color = MODE_COLORS[mode];
  
  return (
    <button
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
        isActive
          ? 'shadow-lg'
          : theme === 'dark'
          ? 'hover:bg-slate-800/50'
          : 'hover:bg-slate-200/50'
      }`}
      style={{
        backgroundColor: isActive ? color : 'transparent',
        boxShadow: isActive ? `0 0 20px ${color}40, 0 4px 12px ${color}30` : undefined,
      }}
    >
      <div className={`flex items-center justify-center ${isActive ? 'text-white' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
        {icon}
      </div>
    </button>
  );
}

export default function Sidebar({ 
  selectedMode, 
  onModeChange, 
  theme = 'dark',
  onThemeChange = () => {},
  onSearchToggle = () => {},
  onFiltersToggle = () => {},
  activeFilters = [],
  searchExpanded = false,
  filtersExpanded = false,
}: SidebarProps) {
  const [modeToast, setModeToast] = useState<{ mode: Mode; label: string; y: number; key: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgColor = theme === 'dark' ? 'bg-slate-900' : 'bg-white';
  const modeColor = MODE_COLORS[selectedMode];
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
      onModeChange(mode);
      return;
    }
    
    // Get button position
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Calculate center of button for vertical alignment
    const buttonCenter = rect.top + (rect.height / 2);
    
    // Set toast
    setModeToast({ mode, label, y: buttonCenter, key: Date.now() });
    
    // Call mode change
    onModeChange(mode);
    
    // Store timeout reference and clear toast after 1.5 seconds
    toastTimerRef.current = setTimeout(() => {
      setModeToast(null);
      toastTimerRef.current = null;
    }, 1500);
  };

  return (
    <>
      {/* Mode Toast */}
      {modeToast && (
        <div
          key={modeToast.key}
          className="fixed z-[1003] pointer-events-none flex items-center"
          style={{
            left: '4.5rem', // 72px (64px sidebar + 8px gap)
            top: `${modeToast.y}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            className="rounded-full px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap flex items-center animate-mode-toast"
            style={{
              backgroundColor: MODE_COLORS[modeToast.mode],
              boxShadow: `0 0 20px ${MODE_COLORS[modeToast.mode]}60, 0 4px 12px ${MODE_COLORS[modeToast.mode]}40`,
            }}
          >
            {modeToast.label}
          </div>
        </div>
      )}
      
      {/* Sidebar - Fixed width icon toolbar (always visible on desktop) */}
      <div 
        className={`fixed left-0 top-0 z-[1001] flex h-full w-16 flex-col items-center pt-5 pb-5 ${bgColor} shadow-2xl`}
      >
        {/* Logo — top anchor */}
        <Logo theme={theme} />

        {/* Nav cluster — vertically centered in remaining space */}
        <div className="flex flex-1 flex-col items-center justify-center">

          {/* Mode buttons */}
          <div className="flex flex-col items-center gap-1.5">
            {modes.map((mode) => (
              <button
                key={mode.key}
                ref={(el) => (modeButtonsRef.current[mode.key] = el)}
                onClick={(e) => handleModeClick(mode.key, mode.label, e)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl outline-none focus:outline-none transition-colors duration-200 ${
                  selectedMode === mode.key
                    ? 'shadow-lg'
                    : theme === 'dark'
                    ? 'hover:bg-slate-800/50'
                    : 'hover:bg-slate-200/50'
                }`}
                style={{
                  backgroundColor: selectedMode === mode.key ? MODE_COLORS[mode.key] : 'transparent',
                  boxShadow: selectedMode === mode.key ? `0 0 20px ${MODE_COLORS[mode.key]}40, 0 4px 12px ${MODE_COLORS[mode.key]}30` : undefined,
                }}
              >
                <div className={`flex items-center justify-center ${selectedMode === mode.key ? 'text-white' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {mode.icon}
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className={`my-4 h-px w-6 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`} />

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
    </>
  );
}