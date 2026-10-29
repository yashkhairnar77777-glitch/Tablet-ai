import React, { useEffect, useState } from 'react';

interface Props {
  enabled: boolean;
  color: 'cyan' | 'violet' | 'amber';
}

export const MousePointerOverlay: React.FC<Props> = ({ enabled, color }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

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

  if (!enabled || !pos || !visible) return null;

  const colorStyles = {
    cyan: {
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_16px_rgba(6,182,212,0.6)]',
      centerDot: 'bg-cyan-300',
      ripple: 'bg-cyan-400/30'
    },
    violet: {
      border: 'border-purple-400',
      glow: 'shadow-[0_0_16px_rgba(168,85,247,0.6)]',
      centerDot: 'bg-purple-300',
      ripple: 'bg-purple-400/30'
    },
    amber: {
      border: 'border-amber-400',
      glow: 'shadow-[0_0_16px_rgba(251,191,36,0.6)]',
      centerDot: 'bg-amber-300',
      ripple: 'bg-amber-400/30'
    }
  }[color];

  return (
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
  );
};
