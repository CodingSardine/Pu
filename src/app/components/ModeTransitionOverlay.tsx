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

    const duration = 600; // milliseconds
    const toColor = MODE_COLORS[toMode];

    // Calculate the maximum distance from trigger point to any corner
    // This ensures the circle always covers the entire screen
    const distances = [
      Math.sqrt(Math.pow(triggerX, 2) + Math.pow(triggerY, 2)), // top-left
      Math.sqrt(Math.pow(canvas.width - triggerX, 2) + Math.pow(triggerY, 2)), // top-right
      Math.sqrt(Math.pow(triggerX, 2) + Math.pow(canvas.height - triggerY, 2)), // bottom-left
      Math.sqrt(Math.pow(canvas.width - triggerX, 2) + Math.pow(canvas.height - triggerY, 2)), // bottom-right
    ];
    const maxDistance = Math.max(...distances);

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

      // Smooth gradient with easing for better fade-out
      // Use easeOutQuad for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      // Gradient stops: opaque center, smooth fade to transparent at edge
      gradient.addColorStop(0, toColor + 'ff'); // Fully opaque at center
      gradient.addColorStop(0.5, toColor + 'cc'); // 80% opacity at midpoint
      gradient.addColorStop(0.85, toColor + '60'); // 37% opacity
      gradient.addColorStop(1, toColor + '00'); // Fully transparent at edge

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
