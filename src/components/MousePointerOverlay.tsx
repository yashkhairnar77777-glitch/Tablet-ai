import React, { useEffect, useState } from 'react';

interface TouchRipple {
  id: number;
  x: number;
  y: number;
}

interface Props {
  enabled: boolean;
  color: 'cyan' | 'violet' | 'amber';
  touchRipple?: boolean;
  ghostTouchShield?: boolean;
}

export const MousePointerOverlay: React.FC<Props> = ({ 
  enabled, 
  color,
  touchRipple = true,
  ghostTouchShield = false
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<TouchRipple[]>([]);

  // Mouse move and click handling
  useEffect(() => {
    if (!enabled) return;

    let timeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setVisible(false);
      }, 3500);
    };

    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeout);
    };
  }, [enabled]);

  // Touch handling: Ghost touch blocker OR visual touch ripples
  useEffect(() => {
    // If ghost touch shield is enabled, intercept all touch events to protect USB mouse
    if (ghostTouchShield) {
      const blockTouch = (e: TouchEvent) => {
        // Prevent erratic digitizer phantom taps from triggering buttons
        e.preventDefault();
        e.stopPropagation();
      };

      window.addEventListener('touchstart', blockTouch, { passive: false, capture: true });
      window.addEventListener('touchmove', blockTouch, { passive: false, capture: true });
      window.addEventListener('touchend', blockTouch, { passive: false, capture: true });

      return () => {
        window.removeEventListener('touchstart', blockTouch, { capture: true });
        window.removeEventListener('touchmove', blockTouch, { capture: true });
        window.removeEventListener('touchend', blockTouch, { capture: true });
      };
    }

    // Otherwise, if touchRipple is enabled, create tactile visual ripples on touch
    if (!touchRipple) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Hide mouse cursor ring when user is actually touching
      setVisible(false);

      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const newRipple: TouchRipple = {
          id: Date.now() + Math.random(),
          x: touch.clientX,
          y: touch.clientY
        };

        setRipples((prev) => [...prev.slice(-4), newRipple]);

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 500);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [ghostTouchShield, touchRipple]);

  const colorStyles = {
    cyan: {
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_16px_rgba(6,182,212,0.6)]',
      centerDot: 'bg-cyan-300',
      ripple: 'bg-cyan-400/30',
      touchRing: 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)]'
    },
    violet: {
      border: 'border-purple-400',
      glow: 'shadow-[0_0_16px_rgba(168,85,247,0.6)]',
      centerDot: 'bg-purple-300',
      ripple: 'bg-purple-400/30',
      touchRing: 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.7)]'
    },
    amber: {
      border: 'border-amber-400',
      glow: 'shadow-[0_0_16px_rgba(251,191,36,0.6)]',
      centerDot: 'bg-amber-300',
      ripple: 'bg-amber-400/30',
      touchRing: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.7)]'
    }
  }[color];

  return (
    <>
      {/* Ghost Touch Shield Active Indicator */}
      {ghostTouchShield && (
        <div 
          aria-hidden="true" 
          className="fixed top-16 right-4 z-[9998] pointer-events-none px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-[10px] font-mono text-red-300 flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span>GHOST TOUCH SHIELD: ON (MOUSE ONLY)</span>
        </div>
      )}

      {/* Touch Wave Ripples (Tactile Touch Feedback) */}
      {touchRipple && !ghostTouchShield && ripples.map((r) => (
        <div
          key={r.id}
          aria-hidden="true"
          className="pointer-events-none fixed z-[9998]"
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
        >
          {/* Inner expanding touch wave */}
          <div
            className={`w-14 h-14 rounded-full border-2 ${colorStyles.touchRing} animate-touch-wave`}
          />
          {/* Micro center flash */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-80"
          />
        </div>
      ))}

      {/* USB Mouse Pointer Spotlight (for broken screen targeting) */}
      {enabled && pos && visible && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[9999] transition-opacity duration-150"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer Targeting Ring */}
          <div
            className={`w-9 h-9 rounded-full border border-dashed ${colorStyles.border} ${colorStyles.glow} transition-transform duration-100 ${
              isClicking ? 'scale-75' : 'scale-100 animate-[spin_10s_linear_infinite]'
            }`}
          />

          {/* Tiny Precision Center Dot */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${colorStyles.centerDot}`}
          />

          {/* Click Ping Ripple Effect */}
          {isClicking && (
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full ${colorStyles.ripple} animate-ping`}
            />
          )}
        </div>
      )}
    </>
  );
};
