import { Variants, Transition } from 'framer-motion';

/**
 * Shared animation utilities and variants for components
 */

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const pulseVariants: Variants = {
  idle: { scale: 1, opacity: 0.6 },
  active: {
    scale: [1, 1.2, 1],
    opacity: [0.6, 1, 0.6],
  },
};

export const glowVariants: Variants = {
  idle: {
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
  },
  active: {
    boxShadow: [
      '0 0 10px rgba(59, 130, 246, 0.3)',
      '0 0 20px rgba(59, 130, 246, 0.6)',
      '0 0 10px rgba(59, 130, 246, 0.3)',
    ],
  },
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const slowTransition: Transition = {
  duration: 0.6,
  ease: 'easeInOut',
};

export const pulseTransition: Transition = {
  duration: 2,
  ease: 'easeInOut',
  repeat: Infinity,
};

/**
 * Get rotation spring config for smooth knob animation
 */
export const getRotationSpring = (): Transition => ({
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 0.5,
});

/**
 * Get position spring config for smooth fader animation
 */
export const getPositionSpring = (): Transition => ({
  type: 'spring',
  stiffness: 400,
  damping: 30,
});
