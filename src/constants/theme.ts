// Wonderscore AI - Centralized Theme Tokens & Design System
export const THEME = {
  colors: {
    forestGreen: "#15463b",
    darkGreenHover: "#1a5c44",
    creamBg: "#fdfcf8",
    cardWhite: "#ffffff",
    borderSand: "#ece3d1",
    subtleSand: "#efe7d6",
    lightSand: "#faf8f3",
    cardBeige: "#faf3e2",
    accentGreen: "#1e7d4f",
    limeGreen: "#a8d860",
    goldAccent: "#d6a23a",
    warningRed: "#b1442a",
    textPrimary: "#23211b",
    textSecondary: "#6f6757",
    textMuted: "#8a8273",
    textSubtle: "#9b927f",
  },
  fonts: {
    sans: "'Hanken Grotesk', sans-serif",
    serif: "'Spectral', serif",
    mono: "'Spline Sans Mono', monospace",
  },
  models: {
    ChatGPT: { name: "ChatGPT", badgeBg: "#10a37f", badgeText: "G", scoreText: "11 / 20" },
    Claude: { name: "Claude", badgeBg: "#cc6b34", badgeText: "Cl", scoreText: "9 / 20" },
    Perplexity: { name: "Perplexity", badgeBg: "#20808d", badgeText: "Px", scoreText: "7 / 20" },
    Gemini: { name: "Gemini", badgeBg: "#4286f5", badgeText: "Ge", scoreText: "8 / 20" },
  },
} as const;
