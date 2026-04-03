import { memo } from 'react';
import { X } from 'lucide-react';
import Avo from '../../imports/Avo';
import Yfantourgeio from '../../imports/Yfantourgeio';
import K11 from '../../imports/K11';

interface LocationCardProps {
  locationId: string;
  onClose: () => void;
  mode?: 'eat' | 'focus' | 'chill';
}

const CARD_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  [data-name="Button"] { display: none !important; }
`;

const LocationCard = memo(function LocationCard({ locationId, onClose }: LocationCardProps) {
  // Simple fade-in, no excessive animations
  if (locationId === 'avo') {
    return (
      <div className="relative" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <style>{CARD_STYLES}</style>
        
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-50"
          aria-label="Close"
        >
          <X size={18} className="text-slate-700" />
        </button>
        
        <div className="overflow-hidden rounded-xl shadow-2xl">
          <Avo />
        </div>
      </div>
    );
  }
  
  if (locationId === 'yfantourgeio') {
    return (
      <div className="relative" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <style>{CARD_STYLES}</style>
        
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-50"
          aria-label="Close"
        >
          <X size={18} className="text-slate-700" />
        </button>
        
        <div className="overflow-hidden rounded-xl shadow-2xl">
          <Yfantourgeio />
        </div>
      </div>
    );
  }
  
  if (locationId === 'k11') {
    return (
      <div className="relative" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <style>{CARD_STYLES}</style>
        
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-50"
          aria-label="Close"
        >
          <X size={18} className="text-slate-700" />
        </button>
        
        <div className="overflow-hidden rounded-xl shadow-2xl">
          <K11 />
        </div>
      </div>
    );
  }

  return null;
});

export default LocationCard;