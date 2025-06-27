export const fluentTheme = {
  // Card colors using Fluent UI CSS custom properties
  card: {
    kanji: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke1)",
      text: "var(--colorNeutralForeground1)",
      hint: "var(--colorNeutralForeground2)",
      gradient: "var(--colorNeutralBackground2)",
    },
    hiragana: {
      bg: "var(--colorNeutralBackground2)",
      border: "var(--colorNeutralStroke1)",
      text: "var(--colorNeutralForeground1)",
      hint: "var(--colorNeutralForeground2)",
      gradient: "var(--colorNeutralBackground3)",
    },
    translation: {
      bg: "var(--colorNeutralBackground3)",
      border: "var(--colorNeutralStroke2)",
      text: "var(--colorNeutralForeground1)",
      hint: "var(--colorNeutralForeground2)",
      gradient: "var(--colorNeutralBackground4)",
    },
  },

  // Audio button colors
  audioButton: {
    hover: "var(--colorNeutralBackground1Hover)",
  },

  // Deck colors using Fluent UI semantic tokens
  deck: {
    learned: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke2)",
      text: "var(--colorNeutralForeground1)",
    },
    inProgress: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke2)",
      text: "var(--colorNeutralForeground1)",
    },
    unlearned: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke2)",
      text: "var(--colorNeutralForeground1)",
    },
    add: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke2)",
      text: "var(--colorNeutralForeground1)",
    },
  },

  // UI colors using Fluent UI design tokens
  ui: {
    toolbar: {
      bg: "var(--colorNeutralBackground3)",
      border: "var(--colorNeutralBorder1)",
    },
    background: {
      main: "var(--colorNeutralBackground3)",
    },
    text: {
      default: "var(--colorNeutralForeground1)",
      secondary: "var(--colorNeutralForeground2)",
      primary: "var(--colorNeutralForeground1)",
      slate: "var(--colorNeutralForeground1)",
      blue: "var(--colorNeutralForeground2)",
      white: "var(--colorNeutralForegroundOnBrand)",
    },
    border: {
      default: "var(--colorNeutralStroke2)",
      dashed: "var(--colorNeutralStroke1)",
    },
    card: {
      bg: "var(--colorNeutralBackground1)",
      border: "var(--colorNeutralStroke1)",
    },
    button: {
      primary: {
        bg: "var(--colorBrandBackground)",
        text: "var(--colorNeutralForegroundOnBrand)",
        hoverBg: "var(--colorBrandBackgroundHover)",
      },
      modeToggle: {
        activeBg: "var(--colorBrandBackground)",
        activeText: "var(--colorNeutralForegroundOnBrand)",
        inactiveBg: "var(--colorNeutralBackground2)",
        inactiveText: "var(--colorNeutralForeground2)",
        inactiveHoverBg: "var(--colorNeutralBackground2Hover)",
      },
    },
    icon: {
      default: "var(--colorNeutralForeground2)",
    },
    pagination: {
      active: "var(--colorBrandBackground)",
      inactive: "var(--colorNeutralBackground2)",
      hover: "var(--colorNeutralBackground2Hover)",
    },
  },
} as const;

// Type for card color configuration
export type CardColorConfig = {
  bgColor: string;
  borderColor: string;
  color: string;
  hintColor: string;
  gradientBgColor: string;
};

// Helper function to get audio button hover color
export const getAudioButtonHoverColor = () => fluentTheme.audioButton.hover;

// Helper function to get card colors
export const getCardColors = (
  type: keyof typeof fluentTheme.card,
): CardColorConfig => {
  const cardColors = fluentTheme.card[type];
  return {
    bgColor: cardColors.bg,
    borderColor: cardColors.border,
    color: cardColors.text,
    hintColor: cardColors.hint,
    gradientBgColor: cardColors.gradient,
  };
};

// Backward compatibility - export as colors for easier migration
export const colors = fluentTheme;