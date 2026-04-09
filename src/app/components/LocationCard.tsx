import { memo, useState, useRef, useEffect } from 'react';
import { X, MapPin, Clock, UtensilsCrossed, DollarSign, Wind, Armchair, ExternalLink, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Shared type exported for App.tsx and MapView.tsx
export interface PlaceApiData {
  photoUrls?: string[];
  rating?: number;
  userRatingCount?: number;
  address?: string;
  hours?: string;
}

interface LocationData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  hours?: string;
  cuisine?: string;
  price?: string;
  atmosphere?: string;
  seating?: string;
  gmaps?: string;
}

interface LocationCardProps {
  locationId: string;
  locationData?: LocationData | null;
  onClose: () => void;
  mode?: 'eat' | 'focus' | 'chill';
  placeData?: PlaceApiData | null;
}

const CARD_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  [data-name="Button"] { display: none !important; }
`;

const MODE_COLORS = {
  eat: '#14b8a6',
  focus: '#f43f5e',
  chill: '#6366f1',
} as const;

const MODE_COLORS_LIGHT = {
  eat: '#2a9d8f',
  focus: '#9b2335',
  chill: '#4a5568',
} as const;

function getModeColor(mode: 'eat' | 'focus' | 'chill', theme: 'dark' | 'light'): string {
  return theme === 'light' ? MODE_COLORS_LIGHT[mode] : MODE_COLORS[mode];
}

// SVG icon badges
function EatIconBadge() {
  return (
    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 110 110">
      <g>
        <path clipRule="evenodd" d="M102.546 83.4422C97.6409 91.518 90.313 97.8903 82.1978 102.307C74.0825 106.66 65.18 108.994 55.793 109.752C46.406 110.509 36.6555 109.688 28.8431 105.146C21.0307 100.603 15.1563 92.3382 9.94798 83.5053C4.80026 74.6724 0.258158 65.2717 0.0159111 55.7448C-0.286898 46.1548 3.77071 36.5017 8.91843 27.5427C14.0662 18.6467 20.3646 10.5709 28.4192 5.7759C36.4739 0.980906 46.3454 -0.407123 55.9141 0.0976199C65.5434 0.602345 74.8698 2.99984 83.0456 7.66865C91.282 12.4006 98.3677 19.2776 103.091 27.7319C107.815 36.1232 110.117 45.9655 109.995 55.8079C109.874 65.6502 107.391 75.3664 102.546 83.4422Z" fill="white" fillRule="evenodd" />
        <path clipRule="evenodd" d="M82.1978 102.307C90.313 97.8903 97.6409 91.518 102.546 83.4422C107.391 75.3664 109.874 65.6502 109.995 55.8079C110.117 45.9655 107.815 36.1232 103.091 27.7319C98.3677 19.2776 91.282 12.4006 83.0456 7.66865C74.8698 2.99984 65.5434 0.602345 55.9141 0.0976199C46.3454 -0.407123 36.4739 0.980906 28.4192 5.7759C20.3646 10.5709 14.0662 18.6467 8.91843 27.5427C3.77071 36.5017 -0.286898 46.1548 0.0159111 55.7448C0.258158 65.2717 4.80026 74.6724 9.94798 83.5053C15.1563 92.3382 21.0307 100.603 28.8431 105.146C36.6555 109.688 46.406 110.509 55.793 109.752C65.18 108.994 74.0825 106.66 82.1978 102.307ZM54.7194 17.6471C74.6982 17.6471 90.9184 34.6479 90.9184 55.5882C90.9184 76.5286 74.6982 93.5294 54.7194 93.5294C34.7405 93.5294 18.5204 76.5286 18.5204 55.5882C18.5204 34.6479 34.7405 17.6471 54.7194 17.6471ZM84.8852 55.5882C84.8852 65.924 80.1431 75.109 72.8158 80.8792C72.8189 64.4412 72.8219 44.5568 72.8068 42.0211C72.7978 40.7185 71.9018 39.7794 70.7766 39.7794C66.8641 39.7794 61.0783 56.1257 59.0632 74.5588C62.3181 74.5493 65.2653 74.5588 65.2653 74.5588V85.2171C61.9803 86.504 58.4268 87.2059 54.7194 87.2059C52.1311 87.2059 49.6213 86.8644 47.2262 86.2194V70.2778C47.2262 68.6924 48.024 68.0478 49.7546 66.6496C50.043 66.4165 50.3574 66.1625 50.6983 65.8798C52.4901 64.3937 53.7631 62.0477 53.5188 59.6732C52.8219 52.9671 51.1266 39.7794 51.1266 39.7794H49.745V55.5882H47.2262L46.7254 39.7794H45.3106L44.7043 55.5882H42.1825L41.7481 39.7794H40.2217L39.6606 55.5882H37.1387L37.1387 39.7794H35.6304C35.6304 39.7794 34.095 53.0525 33.4645 59.7365C33.2413 62.0793 34.4479 64.3811 36.2006 65.8545C36.5288 66.1299 36.8323 66.3786 37.1118 66.6076C38.8541 68.035 39.6606 68.6957 39.6606 70.2651V82.9849C30.632 77.5182 24.5535 67.2899 24.5535 55.5882C24.5535 38.1385 38.0709 23.9706 54.7194 23.9706C71.3679 23.9706 84.8852 38.1385 84.8852 55.5882Z" fill="#3C787E" fillRule="evenodd" />
      </g>
    </svg>
  );
}

function FocusIconBadge() {
  return (
    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 110 110">
      <g>
        <path clipRule="evenodd" d="M82.0194 100.301C90.1665 94.9266 97.0977 88.1639 101.901 80.1332C106.643 72.1025 109.258 62.7435 109.866 53.0221C110.474 43.3611 109.075 33.3378 104.515 24.8241C100.016 16.3707 92.3553 9.42692 83.6002 5.321C74.8451 1.21508 64.9955 -0.11331 55.2068 0.00745439C45.4181 0.0678449 35.6901 1.57737 27.6646 6.16633C19.639 10.6949 13.3767 18.3029 8.51272 26.6355C3.58796 35.0285 0.0615721 44.2064 0.000787663 53.3844C-0.060014 62.6227 3.40556 71.861 8.20871 80.3143C13.0727 88.7677 19.335 96.4965 27.4214 101.87C35.4469 107.305 45.2965 110.384 54.9028 109.961C64.5091 109.539 73.8723 105.614 82.0194 100.301Z" fill="#FFFEFE" fillRule="evenodd" />
        <path clipRule="evenodd" d="M101.901 80.1332C97.0977 88.1639 90.1665 94.9266 82.0194 100.301C73.8723 105.614 64.5091 109.539 54.9028 109.961C45.2965 110.384 35.4469 107.305 27.4214 101.87C19.335 96.4965 13.0727 88.7677 8.20871 80.3143C3.40556 71.861 -0.060014 62.6227 0.000787663 53.3844C0.0615721 44.2064 3.58796 35.0285 8.51272 26.6355C13.3767 18.3029 19.639 10.6949 27.6646 6.16633C35.6901 1.57737 45.4181 0.0678449 55.2068 0.00745439C64.9955 -0.11331 74.8451 1.21508 83.6002 5.321C92.3553 9.42692 100.016 16.3707 104.515 24.8241C109.075 33.3378 110.474 43.3611 109.866 53.0221C109.258 62.7435 106.643 72.1025 101.901 80.1332ZM25.5357 62.5765H84.4643C85.0447 63.6726 90.3571 76.0771 90.3571 77.3028C90.3571 78.8408 89.1255 80.2551 87.4048 80.2551H22.5952C20.8745 80.2551 19.6428 78.8408 19.6428 77.3028C19.6428 76.0771 24.9553 63.6726 25.5357 62.5765ZM48.4324 77.3087L49.8084 74.3622H60.1886L61.5646 77.3087H48.4324ZM80.9286 21.3265C82.882 21.3265 84.4643 22.9088 84.4643 24.8622V59.6301H25.5357L25.5357 24.8622C25.5357 22.9088 27.1179 21.3265 29.0714 21.3265H80.9286ZM78.5714 53.7372H31.4286L31.4286 27.2194H78.5714V53.7372Z" fill="#BF1A2F" fillRule="evenodd" />
      </g>
    </svg>
  );
}

function ChillIconBadge() {
  return (
    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 110 110">
      <g>
        <path clipRule="evenodd" d="M82.3145 102.018C90.1711 96.8571 96.2751 89.296 101.291 81.0147C106.307 72.7935 110.175 63.7321 109.994 54.8508C109.752 45.9695 105.401 37.2081 100.083 29.467C94.7642 21.7258 88.479 14.9448 80.8641 9.48398C73.1888 4.02316 64.184 -0.117467 55.2396 0.00254355C46.2951 0.122571 37.4112 4.50323 28.7689 9.42396C20.1871 14.2847 11.7866 19.6855 6.77049 27.3066C1.75436 34.9278 0.0621661 44.8293 0.00173268 54.7908C-0.0587093 64.6923 1.45218 74.7138 6.10569 82.875C10.8196 91.0362 18.7367 97.4572 27.4393 102.138C36.142 106.879 45.6908 109.879 55.2395 109.999C64.7883 110.059 74.3975 107.239 82.3145 102.018ZM32.7381 55L39.1654 93.1632H64.4772L70.9014 55H32.7381ZM68.9423 36.6625C66.8942 29.1221 60.0058 23.1973 51.8166 23.1973C43.7768 23.1973 36.987 28.925 34.8053 36.2555C34.449 37.4557 34.2797 38.7463 34.1145 40.0056C33.6796 43.3208 33.2732 46.4188 29.5578 47.0779V51.8197H74.0816V47.0652C70.3365 46.3349 69.8889 42.9138 69.4661 39.6814C69.4574 39.615 69.4487 39.5488 69.44 39.4826C69.3099 38.4914 69.1757 37.5233 68.9423 36.6625ZM51.8197 29.5578C44.7341 29.5578 40.2913 35.5304 40.2913 42.2789L63.2496 42.2789C63.2496 35.5304 58.8386 29.5578 51.8197 29.5578ZM68.6657 28.8741L77.052 16.8367L80.4422 19.1901L70.9332 32.8367C70.313 31.4183 69.5434 30.1017 68.6657 28.8741Z" fill="#2020B4" fillRule="evenodd" />
        <path d="M39.1654 93.1632L32.7381 55H70.9014L64.4772 93.1632H39.1654Z" fill="white" />
        <path clipRule="evenodd" d="M51.8166 23.1973C60.0058 23.1973 66.8942 29.1221 68.9423 36.6625C69.1757 37.5233 69.3099 38.4914 69.44 39.4826L69.4661 39.6814C69.8889 42.9138 70.3365 46.3349 74.0816 47.0652V51.8197H29.5578V47.0779C33.2732 46.4188 33.6796 43.3208 34.1145 40.0056C34.2797 38.7463 34.449 37.4557 34.8053 36.2555C36.987 28.925 43.7768 23.1973 51.8166 23.1973ZM51.8197 29.5578C44.7341 29.5578 40.2913 35.5304 40.2913 42.2789L63.2496 42.2789C63.2496 35.5304 58.8386 29.5578 51.8197 29.5578Z" fill="white" fillRule="evenodd" />
        <path clipRule="evenodd" d="M77.052 16.8367L68.6657 28.8741C69.5434 30.1017 70.313 31.4183 70.9332 32.8367L80.4422 19.1901L77.052 16.8367Z" fill="white" fillRule="evenodd" />
      </g>
    </svg>
  );
}

const MODE_ICON_BADGES = {
  eat: EatIconBadge,
  focus: FocusIconBadge,
  chill: ChillIconBadge,
} as const;

// Image Carousel Component
function ImageCarousel({
  images,
  locationName,
  mode,
}: {
  images: string[];
  locationName: string;
  mode: 'eat' | 'focus' | 'chill';
}) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (images.length === 0) return null;

  const activeDotColor = getModeColor(mode, theme);

  return (
    <div 
      className="absolute h-[192px] left-0 overflow-clip top-0 w-full group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Current Image */}
      <img
        src={images[currentIndex]}
        alt={`${locationName} - Image ${currentIndex + 1}`}
        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full transition-opacity duration-300"
      />

      {/* Navigation Controls - Only show if more than 1 image */}
      {images.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/50"
            aria-label="Next image"
          >
            <ChevronRight size={16} className="text-white" />
          </button>

          {/* Image Indicators (Dots) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'w-6' 
                    : 'w-2'
                }`}
                style={{
                  backgroundColor: index === currentIndex ? activeDotColor : 'rgba(255, 255, 255, 0.5)',
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GenericLocationCard({
  location,
  onClose,
  mode = 'eat',
  placeData,
}: {
  location: LocationData;
  onClose: () => void;
  mode: 'eat' | 'focus' | 'chill';
  placeData?: PlaceApiData | null;
}) {
  const theme = useTheme();
  const color = getModeColor(mode, theme);
  const IconBadge = MODE_ICON_BADGES[mode];

  // Only use Google Places API photos - no fallback
  const images = placeData?.photoUrls && placeData.photoUrls.length > 0 
    ? placeData.photoUrls 
    : [];

  const displayAddress = placeData?.address ?? location.address;
  const displayHours = placeData?.hours ?? location.hours;

  return (
    <div className="relative" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <style>{CARD_STYLES}</style>

      <div
        className="bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[10px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
        style={{ width: '100%', maxWidth: 448 }}
      >
        {/* Image area with carousel - only show if we have Google Photos */}
        {images.length > 0 && (
          <div className="h-[192px] relative shrink-0 w-full">
            <ImageCarousel images={images} locationName={location.name} mode={mode} />

            {/* Icon badge */}
            <div className="absolute left-[306px] size-[110px] top-[137px] z-10">
              <IconBadge />
            </div>
          </div>
        )}

        {/* Close button - positioned differently if no image */}
        <button
          className={`absolute bg-[rgba(255,255,255,0.9)] cursor-pointer flex items-center justify-center rounded-full shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] size-[32px] z-20 ${
            images.length > 0 ? 'right-[12px] top-[12px]' : 'right-[12px] top-[12px]'
          }`}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} className="text-slate-700" />
        </button>

        {/* Content */}
        <div className="relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[8px] items-start pt-[20px] px-[20px] relative w-full">
            {/* Name */}
            <p className="font-['Arimo:Bold',sans-serif] font-bold leading-[28px] text-[#101828] text-[20px]">
              {location.name}
            </p>

            {/* Rating (shown only when Places API data is available) */}
            {placeData?.rating != null && (
              <div className="flex items-center gap-[6px]">
                <Star size={14} fill="#F59E0B" className="text-amber-400 shrink-0" />
                <span className="font-normal text-[14px] text-[#101828] leading-[20px]">
                  {placeData.rating.toFixed(1)}
                </span>
                {placeData.userRatingCount != null && (
                  <span className="font-normal text-[12px] text-[#99a1af] leading-[20px]">
                    ({placeData.userRatingCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Address */}
            {displayAddress && (
              <div className="flex items-center gap-[8px] relative shrink-0 w-full">
                <MapPin size={16} className="text-[#4A5565] shrink-0" strokeWidth={1.33} />
                <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#4a5565] text-[14px]">
                  {displayAddress}
                </p>
              </div>
            )}

            {/* Hours — no "Open now" hardcoding, just the hours string in neutral colour */}
            {displayHours && (
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                <Clock size={16} className="text-[#4A5565] shrink-0" strokeWidth={1.33} />
                <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#4a5565] text-[14px]">
                  {displayHours}
                </p>
              </div>
            )}

            {/* Divider + details grid */}
            <div className="content-stretch flex flex-col items-start pt-[16.8px] relative shrink-0 w-full">
              <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-solid border-t-[0.8px] inset-x-0 top-0 pointer-events-none" />
              <div className="grid grid-cols-2 gap-y-[12px] w-full">
                {location.cuisine && (
                  <div className="flex gap-[8px] items-center">
                    <UtensilsCrossed size={20} className="text-[#6A7282] shrink-0" strokeWidth={1.67} />
                    <div>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[16px] text-[#6a7282] text-[12px]">Cuisine</p>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#101828] text-[14px]">{location.cuisine}</p>
                    </div>
                  </div>
                )}
                {location.price && (
                  <div className="flex gap-[8px] items-center">
                    <DollarSign size={20} className="text-[#6A7282] shrink-0" strokeWidth={1.67} />
                    <div>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[16px] text-[#6a7282] text-[12px]">Price</p>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#101828] text-[14px]">{location.price}</p>
                    </div>
                  </div>
                )}
                {location.atmosphere && (
                  <div className="flex gap-[8px] items-center">
                    <Wind size={20} className="text-[#6A7282] shrink-0" strokeWidth={1.67} />
                    <div>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[16px] text-[#6a7282] text-[12px]">Atmosphere</p>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#101828] text-[14px]">{location.atmosphere}</p>
                    </div>
                  </div>
                )}
                {location.seating && (
                  <div className="flex gap-[8px] items-center">
                    <Armchair size={20} className="text-[#6A7282] shrink-0" strokeWidth={1.67} />
                    <div>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[16px] text-[#6a7282] text-[12px]">Seating</p>
                      <p className="font-['Arimo:Regular',sans-serif] font-normal leading-[20px] text-[#101828] text-[14px]">{location.seating}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Google Maps link */}
            {location.gmaps && (
              <div className="pb-[20px] w-full">
                <a
                  href={location.gmaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-[13px] font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <ExternalLink size={14} />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const LocationCard = memo(function LocationCard({
  locationId,
  locationData,
  onClose,
  mode = 'eat',
  placeData,
}: LocationCardProps) {
  if (locationData) {
    return <GenericLocationCard location={locationData} onClose={onClose} mode={mode} placeData={placeData} />;
  }

  return null;
});

export default LocationCard;