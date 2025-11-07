import { useState, useRef, useEffect, WheelEvent } from 'react';
import { motion } from 'framer-motion';
import { useKnobDrag } from '../../hooks/useKnobDrag';
import { getRotationSpring } from '../../hooks/useAnimation';

export interface ColorZone {
  start: number;
  end: number;
  color: string;
}

export interface ParameterKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  presets?: number[];
  colorZones?: ColorZone[];
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { knob: 48, track: 56, fontSize: 'text-xs' },
  md: { knob: 64, track: 72, fontSize: 'text-sm' },
  lg: { knob: 80, track: 88, fontSize: 'text-base' },
};

/**
 * ParameterKnob - Rotary knob control with audio mixer aesthetic
 * Features:
 * - Click-drag vertical motion to adjust (-135° to +135° rotation)
 * - Scroll wheel for fine tuning
 * - Double-click to type exact value
 * - Color-coded range zones
 * - Smooth animated rotation
 */
export function ParameterKnob({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  presets = [],
  colorZones = [],
  disabled = false,
  size = 'md',
}: ParameterKnobProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { handleMouseDown, isDragging, rotation } = useKnobDrag({
    min,
    max,
    step,
    value,
    onChange,
    sensitivity: 0.5,
  });

  const config = sizeConfig[size];

  // Get color for current value based on zones
  const getValueColor = (): string => {
    if (colorZones.length === 0) return 'rgb(59, 130, 246)'; // blue-500

    for (const zone of colorZones) {
      if (value >= zone.start && value <= zone.end) {
        return zone.color;
      }
    }

    return 'rgb(59, 130, 246)';
  };

  // Handle scroll wheel
  const handleWheel = (e: WheelEvent) => {
    if (disabled) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -step : step;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  // Handle double-click to edit
  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value.toString());
  };

  // Handle edit mode
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

  const valueColor = getValueColor();

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <label className={`${config.fontSize} font-medium text-white/70 uppercase tracking-wider`}>
        {label}
      </label>

      {/* Knob Container */}
      <div
        className="relative select-none"
        style={{ width: config.track, height: config.track }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Track with gradient arc */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 100 100"
          style={{ width: config.track, height: config.track }}
        >
          {/* Background arc */}
          <path
            d="M 15 85 A 40 40 0 1 1 85 85"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Color zones */}
          {colorZones.map((zone, idx) => {
            const startAngle = -135 + ((zone.start - min) / (max - min)) * 270;
            const endAngle = -135 + ((zone.end - min) / (max - min)) * 270;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = endAngle - startAngle > 180 ? 1 : 0;

            return (
              <path
                key={idx}
                d={`M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={zone.color}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.3"
              />
            );
          })}

          {/* Value arc */}
          <path
            d={(() => {
              const angle = rotation;
              const rad = (angle * Math.PI) / 180;
              const x = 50 + 40 * Math.cos(rad);
              const y = 50 + 40 * Math.sin(rad);
              const largeArc = angle > -45 ? 1 : 0;
              return `M 15 85 A 40 40 0 ${largeArc} 1 ${x} ${y}`;
            })()}
            fill="none"
            stroke={valueColor}
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${valueColor})`,
            }}
          />
        </svg>

        {/* Knob */}
        <motion.div
          className={`absolute inset-0 m-auto glass rounded-full cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            width: config.knob,
            height: config.knob,
            boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)`,
          }}
          animate={{ rotate: rotation }}
          transition={getRotationSpring()}
          onMouseDown={disabled ? undefined : handleMouseDown}
        >
          {/* Indicator line */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 rounded-full"
            style={{
              height: config.knob * 0.3,
              backgroundColor: valueColor,
              boxShadow: `0 0 8px ${valueColor}`,
            }}
          />

          {/* Center dot */}
          <div
            className="absolute inset-0 m-auto w-2 h-2 rounded-full"
            style={{
              backgroundColor: valueColor,
              boxShadow: `0 0 8px ${valueColor}`,
            }}
          />
        </motion.div>

        {/* Dragging overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-full ring-2 ring-primary-500/50 pointer-events-none" />
        )}
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
          className={`${config.fontSize} w-20 px-2 py-1 text-center bg-black/30 border border-primary-500/50 rounded text-cyan-300 focus:outline-none focus:ring-2 focus:ring-primary-500`}
          step={step}
          min={min}
          max={max}
        />
      ) : (
        <div
          className={`${config.fontSize} font-mono font-bold text-cyan-300`}
          style={{ color: valueColor }}
        >
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit && <span className="text-cyan-200/50 ml-1">{unit}</span>}
        </div>
      )}

      {/* Presets */}
      {presets.length > 0 && (
        <div className="flex gap-1 mt-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => !disabled && onChange(preset)}
              className={`px-2 py-0.5 text-xs rounded ${
                Math.abs(value - preset) < step / 2
                  ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              } transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={disabled}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
