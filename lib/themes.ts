/**
 * Theme system for personalized twin backgrounds
 */

export type ThemeName =
  | "cosmic"
  | "ocean"
  | "sunset"
  | "forest"
  | "aurora"
  | "galaxy"
  | "neon"
  | "lavender"
  | "ember"
  | "midnight";

export interface Theme {
  name: ThemeName;
  displayName: string;
  gradient: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  cosmic: {
    name: "cosmic",
    displayName: "Cosmic",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.25 0.08 260) 0%, oklch(0.12 0.01 260) 70%)",
    accentColor: "oklch(0.7 0.15 200)",
    secondaryColor: "oklch(0.6 0.12 220)",
    glowColor: "oklch(0.7 0.15 200 / 0.3)",
  },
  ocean: {
    name: "ocean",
    displayName: "Ocean",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.25 0.08 210) 0%, oklch(0.12 0.03 220) 70%)",
    accentColor: "oklch(0.65 0.15 210)",
    secondaryColor: "oklch(0.55 0.12 200)",
    glowColor: "oklch(0.65 0.15 210 / 0.3)",
  },
  sunset: {
    name: "sunset",
    displayName: "Sunset",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.3 0.1 40) 0%, oklch(0.15 0.05 30) 70%)",
    accentColor: "oklch(0.7 0.18 50)",
    secondaryColor: "oklch(0.65 0.15 30)",
    glowColor: "oklch(0.7 0.18 50 / 0.3)",
  },
  forest: {
    name: "forest",
    displayName: "Forest",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.2 0.08 150) 0%, oklch(0.1 0.04 140) 70%)",
    accentColor: "oklch(0.65 0.15 140)",
    secondaryColor: "oklch(0.55 0.12 160)",
    glowColor: "oklch(0.65 0.15 140 / 0.3)",
  },
  aurora: {
    name: "aurora",
    displayName: "Aurora",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.25 0.1 180) 0%, oklch(0.12 0.05 200) 50%, oklch(0.1 0.03 280) 100%)",
    accentColor: "oklch(0.7 0.15 180)",
    secondaryColor: "oklch(0.65 0.12 280)",
    glowColor: "oklch(0.7 0.15 180 / 0.3)",
  },
  galaxy: {
    name: "galaxy",
    displayName: "Galaxy",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.2 0.12 280) 0%, oklch(0.08 0.05 260) 70%)",
    accentColor: "oklch(0.75 0.2 280)",
    secondaryColor: "oklch(0.65 0.15 300)",
    glowColor: "oklch(0.75 0.2 280 / 0.3)",
  },
  neon: {
    name: "neon",
    displayName: "Neon",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.25 0.08 330) 0%, oklch(0.1 0.02 300) 70%)",
    accentColor: "oklch(0.7 0.25 330)",
    secondaryColor: "oklch(0.65 0.2 310)",
    glowColor: "oklch(0.7 0.25 330 / 0.4)",
  },
  lavender: {
    name: "lavender",
    displayName: "Lavender",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.3 0.08 290) 0%, oklch(0.15 0.04 280) 70%)",
    accentColor: "oklch(0.7 0.15 290)",
    secondaryColor: "oklch(0.6 0.12 300)",
    glowColor: "oklch(0.7 0.15 290 / 0.3)",
  },
  ember: {
    name: "ember",
    displayName: "Ember",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.25 0.12 20) 0%, oklch(0.12 0.05 10) 70%)",
    accentColor: "oklch(0.65 0.2 25)",
    secondaryColor: "oklch(0.6 0.18 35)",
    glowColor: "oklch(0.65 0.2 25 / 0.3)",
  },
  midnight: {
    name: "midnight",
    displayName: "Midnight",
    gradient:
      "radial-gradient(ellipse at center, oklch(0.18 0.05 250) 0%, oklch(0.08 0.02 260) 70%)",
    accentColor: "oklch(0.6 0.15 240)",
    secondaryColor: "oklch(0.5 0.12 250)",
    glowColor: "oklch(0.6 0.15 240 / 0.3)",
  },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

/**
 * Get a random theme name
 */
export function getRandomTheme(): ThemeName {
  const randomIndex = Math.floor(Math.random() * THEME_NAMES.length);
  return THEME_NAMES[randomIndex];
}

/**
 * Get theme configuration by name
 */
export function getTheme(name: string): Theme {
  return THEMES[name as ThemeName] || THEMES.cosmic;
}

/**
 * Generate CSS custom properties for a theme
 */
export function getThemeCSSVars(theme: Theme): Record<string, string> {
  return {
    "--twin-bg-gradient": theme.gradient,
    "--twin-accent": theme.accentColor,
    "--twin-secondary": theme.secondaryColor,
    "--twin-glow": theme.glowColor,
  };
}

