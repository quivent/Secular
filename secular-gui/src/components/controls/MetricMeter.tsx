import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ThresholdMarker {
  value: number;
  label: string;
  color?: string;
}

export interface MetricMeterProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  thresholds?: ThresholdMarker[];
  showPeak?: boolean;
  showSparkline?: boolean;
  history?: number[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * MetricMeter - VU meter style horizontal bar
 * Features:
 * - Animated gradient fill (green → yellow → red)
 * - Peak hold indicator (white line)
 * - Optional sparkline history
 * - Threshold markers
 * - Smooth animations
 */
export function MetricMeter({
  label,
  value,
  min = 0,
  max = 100,
  unit = '',
  thresholds = [],
  showPeak = true,
  showSparkline = false,
  history = [],
  size = 'md',
}: MetricMeterProps) {
  const [peak, setPeak] = useState(value);
  const [localHistory, setLocalHistory] = useState<number[]>(history);
  const peakTimeoutRef = useRef<NodeJS.Timeout>();

  const sizeConfig = {
    sm: { height: 16, fontSize: 'text-xs' },
    md: { height: 24, fontSize: 'text-sm' },
    lg: { height: 32, fontSize: 'text-base' },
  };

  const config = sizeConfig[size];

  // Update peak value
  useEffect(() => {
    if (value > peak) {
      setPeak(value);

      // Reset peak after 2 seconds
      if (peakTimeoutRef.current) {
        clearTimeout(peakTimeoutRef.current);
      }

      peakTimeoutRef.current = setTimeout(() => {
        setPeak(value);
      }, 2000);
    }
  }, [value, peak]);

  // Update history
  useEffect(() => {
    if (showSparkline) {
      setLocalHistory((prev) => {
        const newHistory = [...prev, value];
        return newHistory.slice(-50); // Keep last 50 values
      });
    }
  }, [value, showSparkline]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (peakTimeoutRef.current) {
        clearTimeout(peakTimeoutRef.current);
      }
    };
  }, []);

  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const peakNormalized = Math.max(0, Math.min(1, (peak - min) / (max - min)));

  // Determine color based on value
  const getColor = (val: number): string => {
    if (val < 0.6) return 'rgb(34, 197, 94)'; // green-500
    if (val < 0.85) return 'rgb(250, 204, 21)'; // yellow-400
    return 'rgb(239, 68, 68)'; // red-500
  };

  const currentColor = getColor(normalized);

  return (
    <div className="flex flex-col gap-2">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className={`${config.fontSize} font-medium text-white/70 uppercase tracking-wider`}>
          {label}
        </label>
        <div className={`${config.fontSize} font-mono font-bold`} style={{ color: currentColor }}>
          {value.toFixed(1)}
          {unit && <span className="text-white/50 ml-1">{unit}</span>}
        </div>
      </div>

      {/* Meter Container */}
      <div className="relative">
        {/* Background Track */}
        <div
          className="relative w-full glass rounded-full overflow-hidden"
          style={{ height: config.height }}
        >
          {/* Segmented background */}
          <div className="absolute inset-0 flex gap-0.5 p-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-white/5 rounded-sm"
              />
            ))}
          </div>

          {/* Fill with gradient */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(239, 68, 68))',
              boxShadow: `0 0 12px ${currentColor}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${normalized * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* Peak indicator */}
          {showPeak && peak > value && (
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full"
              style={{
                left: `${peakNormalized * 100}%`,
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Threshold markers */}
          {thresholds.map((threshold) => {
            const thresholdPos = ((threshold.value - min) / (max - min)) * 100;
            return (
              <div
                key={threshold.value}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                style={{ left: `${thresholdPos}%` }}
              >
                <div
                  className="w-px h-full"
                  style={{
                    backgroundColor: threshold.color || 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Threshold labels */}
        {thresholds.length > 0 && (
          <div className="relative w-full h-4 mt-1">
            {thresholds.map((threshold) => {
              const thresholdPos = ((threshold.value - min) / (max - min)) * 100;
              return (
                <div
                  key={threshold.value}
                  className="absolute text-[10px] text-white/40 -translate-x-1/2"
                  style={{ left: `${thresholdPos}%` }}
                >
                  {threshold.label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {showSparkline && localHistory.length > 1 && (
        <div className="w-full h-8 glass rounded overflow-hidden p-1">
          <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparklineGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={(() => {
                const points = localHistory.map((val, i) => {
                  const x = (i / (localHistory.length - 1)) * 100;
                  const y = 20 - ((val - min) / (max - min)) * 20;
                  return `${x},${y}`;
                });
                return `M 0,20 L ${points.join(' L ')} L 100,20 Z`;
              })()}
              fill="url(#sparklineGradient)"
            />

            {/* Line */}
            <path
              d={(() => {
                const points = localHistory.map((val, i) => {
                  const x = (i / (localHistory.length - 1)) * 100;
                  const y = 20 - ((val - min) / (max - min)) * 20;
                  return `${x},${y}`;
                });
                return `M ${points.join(' L ')}`;
              })()}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
