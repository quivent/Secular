import { useState, useCallback, useRef, useEffect, MouseEvent } from 'react';

interface UseFaderDragOptions {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  trackHeight: number;
}

interface UseFaderDragReturn {
  handleMouseDown: (e: MouseEvent) => void;
  isDragging: boolean;
  handlePosition: number;
}

/**
 * Custom hook for handling vertical fader drag interactions
 * Converts mouse position to fader value based on track height
 */
export function useFaderDrag({
  min,
  max,
  step = 1,
  value,
  onChange,
  trackHeight,
}: UseFaderDragOptions): UseFaderDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Convert value to handle position (0 to trackHeight)
  const valueToPosition = useCallback((val: number): number => {
    const normalized = (val - min) / (max - min);
    return trackHeight - (normalized * trackHeight);
  }, [min, max, trackHeight]);

  // Convert position to value
  const positionToValue = useCallback((position: number): number => {
    const normalized = 1 - (position / trackHeight);
    let val = min + normalized * (max - min);

    // Apply step
    if (step) {
      val = Math.round(val / step) * step;
    }

    // Clamp to range
    return Math.max(min, Math.min(max, val));
  }, [min, max, step, trackHeight]);

  const updateValueFromEvent = useCallback((e: globalThis.MouseEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clampedY = Math.max(0, Math.min(trackHeight, y));

    const newValue = positionToValue(clampedY);
    onChange(newValue);
  }, [trackHeight, positionToValue, onChange]);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!isDragging) return;
    updateValueFromEvent(e);
  }, [isDragging, updateValueFromEvent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    trackRef.current = (e.target as HTMLElement).closest('[data-fader-track]') as HTMLDivElement;
    updateValueFromEvent(e.nativeEvent);
  }, [updateValueFromEvent]);

  // Set up global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    handleMouseDown,
    isDragging,
    handlePosition: valueToPosition(value),
  };
}
