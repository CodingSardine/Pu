import { useEffect, useRef } from 'react';

type Mode = 'eat' | 'focus' | 'chill';

interface ModeTransitionOverlayProps {
  isActive: boolean;
  fromMode: Mode;
  toMode: Mode;
  triggerX: number;
  triggerY: number;
  onComplete: () => void;
}

const MODE_COLORS = {
  eat: '#14b8a6',
  focus: '#f43f5e',
  chill: '#6366f1',
};

export default function ModeTransitionOverlay({
  isActive,
  fromMode,
  toMode,
  triggerX,
  triggerY,
  onComplete,
}: ModeTransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const duration = 1000; // Increase duration for smoother feel
    const toColor = MODE_COLORS[toMode];

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

      // Calculate opacity: start at 0.6 max opacity and fade out
      let opacity = 0.6;
      if (progress > 0.3) {
        // Linear fade from 0.6 to 0 between 30% and 100% progress
        opacity = 0.6 * (1 - (progress - 0.3) / 0.7);
      }
      
      // Convert hex to rgba for dynamic opacity
      const r = parseInt(toColor.slice(1, 3), 16);
      const g = parseInt(toColor.slice(3, 5), 16);
      const b = parseInt(toColor.slice(5, 7), 16);
      const baseColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      const fadeColor = `rgba(${r}, ${g}, ${b}, 0)`;

      // Gradient stops: semi-opaque center, smooth fade to transparent at edge
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, fadeColor);

      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        onComplete();
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, toMode, triggerX, triggerY, onComplete]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1500] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
