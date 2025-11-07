export type IconSize = 16 | 20 | 24 | 32 | 40 | 48;
export type IconVariant = 'outlined' | 'filled' | 'gradient';
export type IconCategory = 'navigation' | 'action' | 'file' | 'status' | 'data';

export interface IconProps {
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  active?: boolean;
  gradient?: [string, string]; // Start and end colors for custom gradients
  strokeWidth?: number;
}

export interface CustomIconProps extends IconProps {
  id?: string; // For gradient definitions
}
