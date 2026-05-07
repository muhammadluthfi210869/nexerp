import { Variants } from 'framer-motion';

export const DURATIONS = {
  FAST: 0.2,
  STANDARD: 0.5,
  CHOREO: 0.8,
};

export const EASING = [0.16, 1, 0.3, 1] as const;

export const FADE_IN_UP: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.STANDARD,
      ease: EASING,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: DURATIONS.FAST,
      ease: EASING,
    },
  },
};

export const STAGGER_CONTAINER: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const SCALE_HOVER = {
  whileHover: { scale: 1.015, y: -4 },
  whileTap: { scale: 0.985 },
  transition: { duration: 0.2, ease: EASING },
};

export const LAYOUT_TRANSITION = {
  layout: true,
  transition: { duration: DURATIONS.STANDARD, ease: EASING },
};
