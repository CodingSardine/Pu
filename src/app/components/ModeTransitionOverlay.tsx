import { useEffect, useRef } from 'react';

type Mode = 'eat' | 'focus' | 'chill';

const MODE_COLORS = { eat: '#14b8a6', focus: '#f43f5e', chill: '#6366f1' };

interface Props {
  isActive: boolean;
  toMode: Mode;
  onMidpoint: () => void;
  onComplete: () => void;
}

export default function ModeTransitionOverlay({ isActive, toMode, onMidpoint, onComplete }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!isActive || !overlayRef.current) return;

    const el = overlayRef.current;

    // Start: invisible
    el.style.transition = 'none';
    el.style.opacity = '0';

    requestAnimationFrame(() => {
      // Fade IN over 220ms
      el.style.transition = 'opacity 220ms ease-out';
      el.style.opacity = '1';

      // At 220ms: fully opaque - NOW change the mode (markers animate hidden)
      timersRef.current.push(
        setTimeout(() => {
          onMidpoint();
        }, 220),
      );

      // At 320ms: start fade OUT (markers have had 100ms to begin their animation)
      timersRef.current.push(
        setTimeout(() => {
          el.style.transition = 'opacity 380ms ease-in';
          el.style.opacity = '0';
        }, 320),
      );

      // At 700ms: done
      timersRef.current.push(
        setTimeout(() => {
          onComplete();
        }, 700),
      );
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [isActive, toMode]);

  if (!isActive) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1500] pointer-events-none"
      style={{
        backgroundColor: MODE_COLORS[toMode],
        opacity: 0,
      }}
    />
  );
}
