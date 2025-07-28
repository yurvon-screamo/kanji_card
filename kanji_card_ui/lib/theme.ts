import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-maple-mono), system-ui, sans-serif" },
        body: { value: "var(--font-maple-mono), system-ui, sans-serif" },
        mono: { value: "var(--font-maple-mono), Consolas, monospace" },
      },
      colors: {
        brand: {
          50: { value: "#e3f2fd" },
          100: { value: "#bbdefb" },
          200: { value: "#90caf9" },
          300: { value: "#64b5f6" },
          400: { value: "#42a5f5" },
          500: { value: "#2196f3" },
          600: { value: "#1e88e5" },
          700: { value: "#1976d2" },
          800: { value: "#1565c0" },
          900: { value: "#0d47a1" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          default: { value: "{colors.gray.50}" },
          _dark: { value: "{colors.gray.900}" },
        },
        fg: {
          default: { value: "{colors.gray.900}" },
          _dark: { value: "{colors.gray.100}" },
        },
        border: {
          default: { value: "{colors.gray.200}" },
          _dark: { value: "{colors.gray.600}" },
        },
        accent: {
          default: { value: "{colors.brand.500}" },
          _dark: { value: "{colors.brand.400}" },
        },
        muted: {
          default: { value: "{colors.gray.100}" },
          _dark: { value: "{colors.gray.800}" },
        },
      },
    },
  },
  globalCss: {
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body",
    },
    "*::placeholder": {
      color: "gray.400",
    },
    "*, *::before, *::after": {
      borderColor: "border",
    },
  },
});

export const system = createSystem(defaultConfig, config);
