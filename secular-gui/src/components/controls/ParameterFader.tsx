import { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { getPositionSpring } from '../../hooks/useAnimation';

export interface ParameterFaderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  snapValues?: number[];
  height?: number;
  disabled?: boolean;
  showScale?: boolean;
}

/**
 * ParameterFader - Vertical slider control with audio mixer aesthetic
 * Features:
 * - Vertical slider with smooth track
 * - LED-style level indicator
 * - Snap-to-value behavior
 * - Touch-friendly handle
 * - Optional scale markings
 */
export function ParameterFader({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  snapValues = [],
  height = 200,
  disabled = false,
  showScale = true,
}: ParameterFaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleHeight = 24;
  const trackPadding = handleHeight / 2;
  const usableHeight = height - handleHeight;

  // Convert value to position
  const valueToPosition = (val: number): number => {
    const normalized = (val - min) / (max - min);
    return trackPadding + (1 - normalized) * usableHeight;
  };

  // Convert position to value
  const positionToValue = (pos: number): number => {
    const normalized = 1 - ((pos - trackPadding) / usableHeight);
    let val = min + normalized * (max - min);

    // Apply step
    if (step) {
      val = Math.round(val / step) * step;
    }

    // Check snap values
    if (snapValues.length > 0) {
      const snapThreshold = (max - min) * 0.02; // 2% snap range
      for (const snapVal of snapValues) {
        if (Math.abs(val - snapVal) < snapThreshold) {
          return snapVal;
        }
      }
    }

    return Math.max(min, Math.min(max, val));
  };

  const updateValueFromEvent = (e: globalThis.MouseEvent) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clampedY = Math.max(trackPadding, Math.min(height - trackPadding, y));

    const newValue = positionToValue(clampedY);
    onChange(newValue);
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDragging) return;
    updateValueFromEvent(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValueFromEvent(e.nativeEvent);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Handle double-click to edit
  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value.toString());
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditComplete = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handlePosition = valueToPosition(value);
  const fillHeight = height - handlePosition;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <label className="text-xs font-medium text-white/70 uppercase tracking-wider">
        {label}
      </label>

      <div className="flex gap-3">
        {/* Scale */}
        {showScale && (
          <div className="flex flex-col justify-between text-xs text-white/40 font-mono" style={{ height }}>
            <span>{max}{unit}</span>
            <span>{((max + min) / 2).toFixed(0)}</span>
            <span>{min}{unit}</span>
          </div>
        )}

        {/* Fader Track */}
        <div className="relative" style={{ height }}>
          <div
            ref={trackRef}
            data-fader-track
            className={`relative w-8 rounded-lg glass overflow-hidden ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{ height }}
            onMouseDown={handleMouseDown}
          >
            {/* Track background with LED segments */}
            <div className="absolute inset-0 flex flex-col gap-0.5 p-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-colors duration-150"
                  style={{
                    backgroundColor: i * (height / 20) >= handlePosition
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                />
              ))}
            </div>

            {/* Fill indicator */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: fillHeight,
                background: 'linear-gradient(to top, rgb(34, 197, 94), rgb(250, 204, 21), rgb(239, 68, 68))',
                opacity: 0.6,
                mixBlendMode: 'screen',
              }}
            />

            {/* Snap indicators */}
            {snapValues.map((snapVal) => (
              <div
                key={snapVal}
                className="absolute left-0 right-0 h-px bg-white/30"
                style={{
                  top: valueToPosition(snapVal),
                }}
              />
            ))}

            {/* Handle */}
            <motion.div
              className={`absolute left-1/2 -translate-x-1/2 w-10 h-6 glass rounded-md border-2 border-primary-500/50 shadow-lg ${
                disabled ? '' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{
                top: handlePosition - handleHeight / 2,
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.4)',
              }}
              animate={{ y: 0 }}
              transition={getPositionSpring()}
            >
              {/* Handle grip lines */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-6 h-px bg-white/30 rounded-full" />
                ))}
              </div>
            </motion.div>

            {/* Dragging overlay */}
            {isDragging && (
              <div className="absolute inset-0 ring-2 ring-primary-500/50 rounded-lg pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Value Display */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleEditKeyDown}
          className="text-sm w-20 px-2 py-1 text-center bg-black/30 border border-primary-500/50 rounded text-cyan-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          step={step}
          min={min}
          max={max}
        />
      ) : (
        <div
          className="text-sm font-mono font-bold text-primary-400 cursor-pointer hover:text-primary-300 transition-colors"
          onDoubleClick={handleDoubleClick}
        >
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit && <span className="text-cyan-200/50 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );
}
