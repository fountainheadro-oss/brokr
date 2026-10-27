/**
 * Design System Tokens & Animation Variants
 */

export const ANIMATION_VARIANTS = {
  pageTransition: {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      zIndex: 1
    } as const),
    animate: {
      x: 0,
      zIndex: 2,
      transition: {
        x: { type: "tween", ease: "easeInOut", duration: 0.5 } as const
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      zIndex: 0,
      transition: {
        x: { type: "tween", ease: "easeInOut", duration: 0.5 } as const
      }
    } as const)
  } as const,
  tapEffect: {
    scale: 0.98
  }
} as const;

export const COLORS = {
  primary: "#051D35",
  accent: "#BE9662",
  accentLight: "#d4b486",
  textSecondary: "#6a7282",
};
