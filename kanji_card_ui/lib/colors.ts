export const colors = {
  // Card colors - subtle variations of gray
  card: {
    kanji: {
      bg: "bg-slate-100 dark:bg-slate-700",
      border: "border-slate-200 dark:border-slate-500",
      text: "text-slate-800 dark:text-slate-100",
      hint: "text-slate-1000 dark:text-slate-300",
      gradient: "bg-slate-100 dark:bg-slate-600",
    },
    hiragana: {
      bg: "bg-neutral-100 dark:bg-neutral-700",
      border: "border-neutral-200 dark:border-neutral-500",
      text: "text-neutral-800 dark:text-neutral-100",
      hint: "text-neutral-1000 dark:text-neutral-300",
      gradient: "bg-neutral-100 dark:bg-neutral-600",
    },
    translation: {
      bg: "bg-gray-100 dark:bg-zinc-700",
      border: "border-gray-200 dark:border-zinc-500",
      text: "text-gray-800 dark:text-zinc-100",
      hint: "text-gray-1000 dark:text-zinc-300",
      gradient: "bg-gray-100 dark:bg-zinc-600",
    },
  },

  // Audio button colors
  audioButton: {
    hover:
      "hover:bg-slate-100 hover:bg-opacity-60 dark:hover:bg-gray-600 dark:hover:bg-opacity-60",
  },

  // Deck colors - subtle status indication with grays
  deck: {
    learned: {
      bg: "bg-emerald-50 dark:bg-gray-700",
      border: "border-emerald-100 dark:border-gray-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    inProgress: {
      bg: "bg-amber-50 dark:bg-gray-700",
      border: "border-amber-100 dark:border-gray-500",
      text: "text-amber-700 dark:text-amber-300",
    },
    unlearned: {
      bg: "bg-slate-50 dark:bg-gray-700",
      border: "border-slate-200 dark:border-gray-500",
      text: "text-slate-600 dark:text-gray-300",
    },
    add: {
      bg: "bg-stone-50 dark:bg-gray-700",
      border: "border-stone-200 dark:border-gray-500",
      text: "text-stone-500 dark:text-gray-400",
    },
  },

  // UI colors - clean minimalist palette
  ui: {
    toolbar: {
      bg: "bg-white/95 dark:bg-gray-800/95",
      border: "border-b border-slate-200 dark:border-gray-600",
    },
    background: {
      main: "bg-slate-50 dark:bg-gray-800",
    },
    text: {
      default: "text-slate-800 dark:text-gray-200",
      secondary: "text-slate-600 dark:text-gray-400",
      primary: "text-slate-700 dark:text-gray-300",
      slate: "text-slate-700 dark:text-gray-300",
      blue: "text-slate-600 dark:text-gray-400",
      white: "text-white",
    },
    border: {
      default: "border-slate-200 dark:border-gray-600",
      dashed: "border-slate-300 dark:border-gray-500 border-dashed",
    },
    button: {
      primary: {
        bg: "bg-slate-700 dark:bg-gray-600",
        text: "text-white",
        hoverBg: "hover:bg-slate-800 dark:hover:bg-gray-500",
      },
      modeToggle: {
        activeBg: "bg-slate-200 dark:bg-gray-600",
        activeText: "text-slate-800 dark:text-gray-200",
        inactiveBg: "bg-slate-100 dark:bg-gray-700",
        inactiveText: "text-slate-600 dark:text-gray-400",
        inactiveHoverBg: "hover:bg-slate-150 dark:hover:bg-gray-650",
      },
    },
    icon: {
      default: "text-slate-500 dark:text-gray-400",
    },
    pagination: {
      active: "bg-slate-300 dark:bg-gray-600",
      inactive: "bg-slate-150 dark:bg-gray-700",
      hover: "hover:bg-slate-200 dark:hover:bg-gray-650",
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
export const getAudioButtonHoverColor = () => colors.audioButton.hover;

// Helper function to get card colors
export const getCardColors = (
  type: keyof typeof colors.card,
): CardColorConfig => {
  const cardColors = colors.card[type];
  return {
    bgColor: cardColors.bg,
    borderColor: cardColors.border,
    color: cardColors.text,
    hintColor: cardColors.hint,
    gradientBgColor: cardColors.gradient,
  };
};
