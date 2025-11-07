import React from 'react';
import { IconProps } from './types';

interface BaseIconProps extends IconProps {
  children: React.ReactNode;
  viewBox?: string;
}

export const BaseIcon: React.FC<BaseIconProps> = ({
  children,
  size = 24,
  variant = 'outlined',
  className = '',
  active = false,
  gradient,
  strokeWidth = 2,
  viewBox = '0 0 24 24',
}) => {
  const uniqueId = React.useId();
  const gradientId = `gradient-${uniqueId}`;

  // Default gradients based on active state
  const defaultGradient = active
    ? ['#06b6d4', '#8b5cf6'] // cyan to purple
    : undefined;

  const finalGradient = gradient || defaultGradient;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${variant} ${active ? 'active' : ''} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {finalGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={finalGradient[0]} />
            <stop offset="100%" stopColor={finalGradient[1]} />
          </linearGradient>
        </defs>
      )}
      <g
        stroke={finalGradient ? `url(#${gradientId})` : 'currentColor'}
        fill={variant === 'filled' ? (finalGradient ? `url(#${gradientId})` : 'currentColor') : 'none'}
      >
        {children}
      </g>
    </svg>
  );
};
