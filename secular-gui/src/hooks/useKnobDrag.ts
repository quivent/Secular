import { useState, useCallback, useRef, useEffect, MouseEvent } from 'react';

interface UseKnobDragOptions {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  sensitivity?: number;
}

interface UseKnobDragReturn {
  handleMouseDown: (e: MouseEvent) => void;
  isDragging: boolean;
  rotation: number;
}

/**
 * Custom hook for handling knob drag interactions
 * Converts vertical mouse movement to rotary knob rotation (-135° to +135°)
 */
export function useKnobDrag({
  min,
  max,
  step = 1,
  value,
  onChange,
  sensitivity = 0.5,
}: UseKnobDragOptions): UseKnobDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  // Convert value to rotation angle (-135 to +135 degrees)
  const valueToRotation = useCallback((val: number): number => {
    const normalized = (val - min) / (max - min);
    return -135 + normalized * 270;
  }, [min, max]);

  // Convert rotation angle to value
  const rotationToValue = useCallback((rotation: number): number => {
    const normalized = (rotation + 135) / 270;
    let val = min + normalized * (max - min);

    // Apply step
    if (step) {
      val = Math.round(val / step) * step;
    }

    // Clamp to range
    return Math.max(min, Math.min(max, val));
  }, [min, max, step]);

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - e.clientY;
    const range = max - min;
    const valueChange = (deltaY * sensitivity * range) / 100;
    const newValue = startValueRef.current + valueChange;

    let clampedValue = Math.max(min, Math.min(max, newValue));

    // Apply step
    if (step) {
      clampedValue = Math.round(clampedValue / step) * step;
    }

    onChange(clampedValue);
  }, [isDragging, min, max, step, sensitivity, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  }, [value]);

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
    rotation: valueToRotation(value),
  };
}
