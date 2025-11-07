import { useState, useRef, useEffect, MouseEvent } from 'react';
import { motion } from 'framer-motion';

export interface DataSeries {
  id: string;
  data: number[];
  color: string;
  label: string;
  glow?: boolean;
}

export interface WaveformGraphProps {
  series: DataSeries[];
  width?: number;
  height?: number;
  min?: number;
  max?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showLegend?: boolean;
  zoomable?: boolean;
  pannable?: boolean;
  gridColor?: string;
  backgroundColor?: string;
}

/**
 * WaveformGraph - SVG-based line chart for real-time data
 * Features:
 * - Real-time data updates
 * - Multiple series overlay
 * - Zoom/pan controls
 * - Optional glow effect on lines
 * - Grid background
 * - Responsive sizing
 */
export function WaveformGraph({
  series,
  width = 600,
  height = 200,
  min,
  max,
  showGrid = true,
  showAxes = true,
  showLegend = true,
  zoomable = false,
  pannable = false,
  gridColor = 'rgba(255, 255, 255, 0.1)',
  backgroundColor = 'rgba(0, 0, 0, 0.2)',
}: WaveformGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate min/max from data if not provided
  const dataMin = min ?? Math.min(...series.flatMap(s => s.data));
  const dataMax = max ?? Math.max(...series.flatMap(s => s.data));

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Convert data point to SVG coordinates
  const getPoint = (index: number, value: number, dataLength: number) => {
    const x = (index / (dataLength - 1)) * chartWidth * zoom + pan.x;
    const y = chartHeight - ((value - dataMin) / (dataMax - dataMin)) * chartHeight + pan.y;
    return { x, y };
  };

  // Generate path for a data series
  const generatePath = (data: number[]): string => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => getPoint(index, value, data.length));
    const pathData = points.map((point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${command} ${point.x + padding.left} ${point.y + padding.top}`;
    });

    return pathData.join(' ');
  };

  // Generate area path (for fill under line)
  const generateAreaPath = (data: number[]): string => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => getPoint(index, value, data.length));
    const pathData = points.map((point, i) => {
      const command = i === 0 ? 'M' : 'L';
      return `${command} ${point.x + padding.left} ${point.y + padding.top}`;
    });

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    return `${pathData.join(' ')} L ${lastPoint.x + padding.left} ${chartHeight + padding.top} L ${firstPoint.x + padding.left} ${chartHeight + padding.top} Z`;
  };

  // Handle zoom
  const handleWheel = (e: WheelEvent) => {
    if (!zoomable) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  // Handle pan
  const handleMouseDown = (e: MouseEvent) => {
    if (!pannable) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isPanning || !pannable) return;

    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Set up global mouse listeners
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Generate Y-axis labels
  const yAxisLabels = Array.from({ length: 5 }).map((_, i) => {
    const value = dataMin + ((dataMax - dataMin) / 4) * i;
    const y = chartHeight - ((value - dataMin) / (dataMax - dataMin)) * chartHeight;
    return { value, y };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Graph Container */}
      <div
        className="relative glass rounded-lg overflow-hidden"
        style={{
          width,
          height,
          backgroundColor,
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onWheel={handleWheel as any}
          onMouseDown={handleMouseDown}
          className={pannable ? 'cursor-grab active:cursor-grabbing' : ''}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={`gradient-${s.id}`} id={`gradient-${s.id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.1" />
              </linearGradient>
            ))}

            {series.filter(s => s.glow).map((s) => (
              <filter key={`glow-${s.id}`} id={`glow-${s.id}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
          </defs>

          {/* Grid */}
          {showGrid && (
            <g>
              {/* Horizontal grid lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = (chartHeight / 4) * i + padding.top;
                return (
                  <line
                    key={`h-grid-${i}`}
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                  />
                );
              })}

              {/* Vertical grid lines */}
              {Array.from({ length: 10 }).map((_, i) => {
                const x = (chartWidth / 9) * i + padding.left;
                return (
                  <line
                    key={`v-grid-${i}`}
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke={gridColor}
                    strokeWidth="1"
                  />
                );
              })}
            </g>
          )}

          {/* Axes */}
          {showAxes && (
            <g>
              {/* X-axis */}
              <line
                x1={padding.left}
                y1={height - padding.bottom}
                x2={width - padding.right}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />

              {/* Y-axis */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={height - padding.bottom}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />

              {/* Y-axis labels */}
              {yAxisLabels.map((label, i) => (
                <text
                  key={`y-label-${i}`}
                  x={padding.left - 10}
                  y={label.y + padding.top}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {label.value.toFixed(1)}
                </text>
              ))}
            </g>
          )}

          {/* Data series */}
          {series.map((s) => (
            <g key={s.id}>
              {/* Area fill */}
              <path
                d={generateAreaPath(s.data)}
                fill={`url(#gradient-${s.id})`}
                opacity="0.3"
              />

              {/* Line */}
              <path
                d={generatePath(s.data)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={s.glow ? `url(#glow-${s.id})` : undefined}
              />
            </g>
          ))}
        </svg>

        {/* Zoom/Pan controls */}
        {(zoomable || pannable) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 glass rounded p-1">
            {zoomable && (
              <>
                <button
                  onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                  title="Zoom Out"
                >
                  -
                </button>
              </>
            )}
            {(zoomable || pannable) && (
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                title="Reset"
              >
                ⟲
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <div className="flex gap-4 items-center justify-center">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: s.color,
                  boxShadow: s.glow ? `0 0 8px ${s.color}` : undefined,
                }}
              />
              <span className="text-xs text-white/70">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
