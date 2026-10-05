/**
 * Centralized color palette for the application
 * Supports both light and dark modes
 */

export const colors = {
  light: {
    // Primary colors
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c3d66",
      950: "#082f49",
    },
    // UI Colors
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#f8fafc",
    cardForeground: "#1e293b",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#06b6d4",
    accentForeground: "#ffffff",
    // Semantic colors
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    // Glass morphism
    glass: "rgba(255, 255, 255, 0.7)",
    glassBorder: "rgba(255, 255, 255, 0.18)",
  },
  dark: {
    // Primary colors
    primary: {
      50: "#082f49",
      100: "#0c3d66",
      200: "#075985",
      300: "#0369a1",
      400: "#0284c7",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c3d66",
      950: "#051e34",
    },
    // UI Colors
    background: "#0f172a",
    foreground: "#f1f5f9",
    card: "#1e293b",
    cardForeground: "#f1f5f9",
    muted: "#334155",
    mutedForeground: "#cbd5e1",
    accent: "#06b6d4",
    accentForeground: "#0f172a",
    // Semantic colors
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    info: "#2563eb",
    // Glass morphism
    glass: "rgba(30, 41, 59, 0.7)",
    glassBorder: "rgba(148, 163, 184, 0.13)",
  },
};

export type ColorScheme = "light" | "dark";

export const getColors = (colorScheme: ColorScheme) => {
  return colors[colorScheme];
};

/**
 * Get a specific color by scheme
 * @param colorScheme - "light" or "dark"
 * @param colorPath - e.g. "primary.500", "success", "glass"
 */
export const getColorByPath = (
  colorScheme: ColorScheme,
  colorPath: string,
): string => {
  const parts = colorPath.split(".");
  let color: any = colors[colorScheme];

  for (const part of parts) {
    if (color && typeof color === "object" && part in color) {
      color = color[part];
    } else {
      return "#0ea5e9"; // fallback to primary
    }
  }

  return typeof color === "string" ? color : "#0ea5e9";
};
