import React, { useState, useEffect, useRef } from 'react';

/**
 * LiveOnlineTicker for Admin Panel:
 * Continuous real-time animated ticker with directional rolling transitions
 * and organic presence dynamics.
 */
export default function LiveOnlineTicker({
  baseCount = 0,
  showLabel = true,
  label = 'nafar onlayn',
  className = '',
  size = 'sm', // 'sm', 'md', 'lg'
}) {
  const currentVal = Math.max(0, Number(baseCount) || 0);
  const [displayCount, setDisplayCount] = useState(currentVal);
  const [isChanging, setIsChanging] = useState(false);
  const [direction, setDirection] = useState('up');
  const prevCountRef = useRef(currentVal);

  useEffect(() => {
    const val = Math.max(0, Number(baseCount) || 0);
    if (val !== prevCountRef.current) {
      setDirection(val > prevCountRef.current ? 'up' : 'down');
      setIsChanging(true);
      setDisplayCount(val);
      prevCountRef.current = val;
      const timer = setTimeout(() => setIsChanging(false), 500);
      return () => clearTimeout(timer);
    }
  }, [baseCount]);

  const sizeClasses = {
    sm: { height: 'h-4', font: 'text-xs', ping: 'h-1.5 w-1.5' },
    md: { height: 'h-5', font: 'text-sm', ping: 'h-2 w-2' },
    lg: { height: 'h-9', font: 'text-3xl font-black', ping: 'h-2.5 w-2.5' },
  }[size] || { height: 'h-4', font: 'text-xs', ping: 'h-1.5 w-1.5' };

  return (
    <div className={`inline-flex items-center gap-1.5 font-bold ${className}`}>
      {/* Radar Ping Dot */}
      <span className={`relative flex ${sizeClasses.ping} shrink-0`}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-full w-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
      </span>

      {/* Rolling Animated Number */}
      <div className={`relative overflow-hidden ${sizeClasses.height} flex items-center justify-center min-w-[14px]`}>
        <span
          key={displayCount}
          style={{
            animation: direction === 'up'
              ? 'tickerSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              : 'tickerSlideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className={`font-mono ${sizeClasses.font} tracking-tight transition-all duration-300 ${
            isChanging
              ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] scale-110'
              : 'text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]'
          }`}
        >
          {displayCount}
        </span>
      </div>

      {showLabel && (
        <span className={`font-mono ${size === 'lg' ? 'text-sm font-sans' : 'text-xs'} text-emerald-400 tracking-tight`}>
          {label}
        </span>
      )}
    </div>
  );
}
