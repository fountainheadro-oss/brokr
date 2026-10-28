/**
 * ============================================================================
 * BROKR. DESIGN SYSTEM & THEME - SINGLE SOURCE OF TRUTH
 * ============================================================================
 * 
 * Modifică oricare valoare din acest fișier pentru a schimba instantaneu
 * culorile, fonturile, rotunjirile și stilul întregii aplicații,
 * fără hardcoding în componente individuale!
 */

export const THEME = {
  // Brand Colors
  colors: {
    // Primary - Brand Navy (#051D35)
    brandNavy: "#051D35",
    brandNavyHover: "#0a2b4a",
    brandNavyLight: "rgba(5, 29, 53, 0.06)",
    brandNavyBorder: "rgba(5, 29, 53, 0.15)",

    // Accent - Brand Gold / Bronze (#BE9662)
    brandGold: "#BE9662",
    brandGoldHover: "#a8824f",
    brandGoldLight: "rgba(190, 150, 98, 0.12)",
    brandGoldBorder: "rgba(190, 150, 98, 0.28)",

    // Neutral Text Colors
    textMain: "#051D35",
    textSecondary: "#4b5563",
    textMuted: "#6b7280",
    textPlaceholder: "#9ca3af",

    // Backgrounds
    bgApp: "#f9fafb",
    bgCard: "#ffffff",
    bgHeader: "#ffffff",
    bgSidebar: "#ffffff",
    bgMuted: "#f3f4f6",

    // Borders
    border: "#e5e7eb",
    borderHover: "#d1d5db",

    // Status Colors
    status: {
      success: "#10b981",
      successLight: "rgba(16, 185, 129, 0.10)",
      warning: "#f59e0b",
      warningLight: "rgba(245, 158, 11, 0.10)",
      danger: "#ef4444",
      dangerLight: "rgba(239, 68, 68, 0.10)",
      info: "#BE9662", // Unified with brand gold
      infoLight: "rgba(190, 150, 98, 0.12)"
    }
  },

  // Typography
  fonts: {
    sans: '"Neue Montreal", "PP Neue Montreal", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  },

  // Border Radii
  radii: {
    standard: "6px",
    badge: "4px",
    modal: "12px",
    card: "8px",
    pill: "9999px"
  },

  // Layout Spacing
  spacing: {
    edge: "16px",
    headerHeight: "50px",
    componentHeight: "36px"
  }
} as const;

/**
 * Backward compatibility exports
 */
export const COLORS = {
  primary: THEME.colors.brandNavy,
  accent: THEME.colors.brandGold,
  accentLight: THEME.colors.brandGoldLight,
  textSecondary: THEME.colors.textSecondary,
};

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

/**
 * Injects CSS variables onto the root document so that all components,
 * modals, and Tailwind classes inherit them reactively and centrally.
 */
export const applyTheme = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Primary & Brand Navy
  root.style.setProperty('--color-brand-navy', THEME.colors.brandNavy);
  root.style.setProperty('--color-brand-navy-hover', THEME.colors.brandNavyHover);
  root.style.setProperty('--color-brand-navy-light', THEME.colors.brandNavyLight);
  root.style.setProperty('--color-brand-navy-border', THEME.colors.brandNavyBorder);
  root.style.setProperty('--color-primary', THEME.colors.brandNavy);

  // Accent & Brand Gold
  root.style.setProperty('--color-brand-gold', THEME.colors.brandGold);
  root.style.setProperty('--color-brand-gold-hover', THEME.colors.brandGoldHover);
  root.style.setProperty('--color-brand-gold-light', THEME.colors.brandGoldLight);
  root.style.setProperty('--color-brand-gold-border', THEME.colors.brandGoldBorder);
  root.style.setProperty('--color-accent', THEME.colors.brandGold);
  root.style.setProperty('--color-accent-light', THEME.colors.brandGoldLight);

  // Text
  root.style.setProperty('--color-text-main', THEME.colors.textMain);
  root.style.setProperty('--color-text-secondary', THEME.colors.textSecondary);
  root.style.setProperty('--color-text-placeholder', THEME.colors.textPlaceholder);

  // Backgrounds & Borders
  root.style.setProperty('--color-bg-app', THEME.colors.bgApp);
  root.style.setProperty('--color-bg-card', THEME.colors.bgCard);
  root.style.setProperty('--color-border', THEME.colors.border);
  root.style.setProperty('--color-border-hover', THEME.colors.borderHover);

  // Fonts
  root.style.setProperty('--font-sans', THEME.fonts.sans);
  root.style.setProperty('--font-mono', THEME.fonts.mono);
};
