import { useEffect, useRef } from 'react';

type Mode = 'eat' | 'focus' | 'chill';
type Theme = 'dark' | 'light';

interface ModeTransitionOverlayProps {
  isActive: boolean;
  fromMode: Mode;
  toMode: Mode;
  triggerX: number;
  triggerY: number;
  theme: Theme;
  onComplete: () => void;
}

const MODE_COLORS = {
  eat: '#0ea5a6',
  focus: '#fb7185',
  chill: '#818cf8',
};

function blendHexWithWhite(hex: string, whiteMix: number) {
  const mix = Math.min(1, Math.max(0, whiteMix));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rr = Math.round(r + (255 - r) * mix);
  const gg = Math.round(g + (255 - g) * mix);
  const bb = Math.round(b + (255 - b) * mix);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

export default function ModeTransitionOverlay({
  isActive,
  fromMode,
  toMode,
  triggerX,
  triggerY,
  theme,
  onComplete,
}: ModeTransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If we're re-triggered quickly (toMode/trigger changes while active),
    // cancel any in-flight frame and restart timing deterministically.
    runIdRef.current += 1;
    const runId = runIdRef.current;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    startTimeRef.current = 0;

    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const duration = 1000; // Increase duration for smoother feel
    const baseToColor = MODE_COLORS[toMode];
    // On light backgrounds we want a brighter/pastel bloom (less muddy than multiplying saturated color).
    const toColor = theme === 'light' ? blendHexWithWhite(baseToColor, 0.55) : baseToColor;

    // Calculate the maximum distance from trigger point to any corner
    // This ensures the circle always covers the entire screen
    const distances = [
      Math.sqrt(Math.pow(triggerX, 2) + Math.pow(triggerY, 2)), // top-left
      Math.sqrt(Math.pow(canvas.width - triggerX, 2) + Math.pow(triggerY, 2)), // top-right
      Math.sqrt(Math.pow(triggerX, 2) + Math.pow(canvas.height - triggerY, 2)), // bottom-left
      Math.sqrt(Math.pow(canvas.width - triggerX, 2) + Math.pow(canvas.height - triggerY, 2)), // bottom-right
    ];
    // Use 1.5x maxDistance to ensure the gradient tail also clears the screen
    const maxDistance = Math.max(...distances) * 1.5;

    const animate = (currentTime: number) => {
      if (runIdRef.current !== runId) return; // stale animation (newer run started)
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Expand radius to cover entire screen
      const currentRadius = maxDistance * progress;

      // Create radial gradient from trigger point
      const gradient = ctx.createRadialGradient(
        triggerX,
        triggerY,
        0,
        triggerX,
        triggerY,
        currentRadius
      );

      // Light mode needs a stronger, more contrasty wash (screen blending on white can be too subtle).
      const maxOpacity = theme === 'light' ? 0.55 : 0.6;
      const fadeStart = theme === 'light' ? 0.18 : 0.3;
      let opacity = maxOpacity;
      if (progress > fadeStart) {
        opacity = maxOpacity * (1 - (progress - fadeStart) / (1 - fadeStart));
      }
      
      // Convert hex to rgba for dynamic opacity
      const r = parseInt(toColor.slice(1, 3), 16);
      const g = parseInt(toColor.slice(3, 5), 16);
      const b = parseInt(toColor.slice(5, 7), 16);
      const baseColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      const fadeColor = `rgba(${r}, ${g}, ${b}, 0)`;

      // Gradient stops: semi-opaque center, smooth fade to transparent at edge
      // In light mode, keep the center a bit tighter so it reads as a "color bloom".
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(theme === 'light' ? 0.22 : 0.5, baseColor);
      gradient.addColorStop(1, fadeColor);

      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (runIdRef.current === runId) {
          onComplete();
        }
        startTimeRef.current = 0;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // Invalidate this run immediately so any in-flight callback no-ops.
      runIdRef.current += 1;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = 0;
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, toMode, triggerX, triggerY, theme, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1500] pointer-events-none"
      style={{
        mixBlendMode: theme === 'light' ? 'normal' : 'screen',
        opacity: 1,
      }}
    />
  );
}
