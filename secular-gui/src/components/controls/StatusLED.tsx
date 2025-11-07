import { motion } from 'framer-motion';

export type LEDStatus = 'idle' | 'running' | 'warning' | 'error';

export interface StatusLEDProps {
  status: LEDStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  idle: {
    color: 'rgb(107, 114, 128)', // gray-500
    glow: 'rgba(107, 114, 128, 0.3)',
    label: 'Idle',
    animate: false,
  },
  running: {
    color: 'rgb(34, 197, 94)', // green-500
    glow: 'rgba(34, 197, 94, 0.6)',
    label: 'Running',
    animate: true,
    animationType: 'pulse' as const,
  },
  warning: {
    color: 'rgb(251, 146, 60)', // orange-400
    glow: 'rgba(251, 146, 60, 0.6)',
    label: 'Warning',
    animate: true,
    animationType: 'blink' as const,
  },
  error: {
    color: 'rgb(239, 68, 68)', // red-500
    glow: 'rgba(239, 68, 68, 0.6)',
    label: 'Error',
    animate: true,
    animationType: 'blink' as const,
  },
};

const sizeConfig = {
  sm: { size: 8, fontSize: 'text-xs' },
  md: { size: 12, fontSize: 'text-sm' },
  lg: { size: 16, fontSize: 'text-base' },
};

/**
 * StatusLED - Binary status indicator with glow
 * Features:
 * - States: idle (gray), running (green pulse), warning (amber blink), error (red blink)
 * - Animated glow effects
 * - Accessible labels
 * - Multiple sizes
 */
export function StatusLED({
  status,
  label,
  size = 'md',
  showLabel = true,
}: StatusLEDProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  const pulseAnimation = {
    scale: [1, 1.3, 1],
    opacity: [1, 0.7, 1],
  };

  const blinkAnimation = {
    opacity: [1, 0.3, 1],
  };

  const getAnimation = () => {
    if (!config.animate) {
      return {};
    }

    if (config.animationType === 'pulse') {
      return {
        animate: pulseAnimation,
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };
    }

    if (config.animationType === 'blink') {
      return {
        animate: blinkAnimation,
        transition: {
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };
    }

    return {};
  };

  return (
    <div className="flex items-center gap-2">
      {/* LED Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: sizeConf.size * 2,
          height: sizeConf.size * 2,
        }}
        role="status"
        aria-label={label || config.label}
      >
        {/* Outer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: sizeConf.size * 2,
            height: sizeConf.size * 2,
            backgroundColor: config.glow,
            filter: 'blur(8px)',
            opacity: 0.6,
          }}
        />

        {/* LED */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: sizeConf.size,
            height: sizeConf.size,
            backgroundColor: config.color,
            boxShadow: `0 0 ${sizeConf.size}px ${config.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
          }}
          {...getAnimation()}
        >
          {/* Highlight */}
          <div
            className="absolute top-0 left-1/4 w-1/2 h-1/2 rounded-full bg-white/40 blur-sm"
          />
        </motion.div>
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={`${sizeConf.fontSize} font-medium`}
          style={{ color: config.color }}
        >
          {label || config.label}
        </span>
      )}
    </div>
  );
}

/**
 * StatusLEDGroup - Group multiple LEDs together
 */
export interface StatusLEDGroupProps {
  items: Array<{
    status: LEDStatus;
    label: string;
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusLEDGroup({
  items,
  orientation = 'horizontal',
  size = 'md',
}: StatusLEDGroupProps) {
  return (
    <div
      className={`flex gap-4 ${
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      }`}
    >
      {items.map((item, index) => (
        <StatusLED
          key={index}
          status={item.status}
          label={item.label}
          size={size}
          showLabel={true}
        />
      ))}
    </div>
  );
}
