// Утилиты для работы с цветами в приложении

export const getCardColors = (type: "kanji" | "hiragana" | "translation") => {
  const baseColors = {
    kanji: {
      bg: "white",
      border: "blue.200",
      text: "gray.900",
      hint: "gray.600",
    },
    hiragana: {
      bg: "gray.50",
      border: "gray.200",
      text: "gray.900",
      hint: "gray.600",
    },
    translation: {
      bg: "blue.50",
      border: "blue.200",
      text: "gray.900",
      hint: "gray.600",
    },
  };
  return baseColors[type];
};

export const getLearningStatusColor = (
  status: "new" | "studying" | "learned" | "forgotten",
) => {
  const statusColors = {
    new: "red.500",
    studying: "blue.500",
    learned: "green.500",
    forgotten: "orange.500",
  };
  return statusColors[status];
};

export const getStatusBadgeColors = (
  status: "new" | "studying" | "learned" | "forgotten",
) => {
  const badgeColors = {
    new: {
      colorScheme: "red",
      bg: "red.50",
      color: "red.700",
    },
    studying: {
      colorScheme: "blue",
      bg: "blue.50",
      color: "blue.700",
    },
    learned: {
      colorScheme: "green",
      bg: "green.50",
      color: "green.700",
    },
    forgotten: {
      colorScheme: "orange",
      bg: "orange.50",
      color: "orange.700",
    },
  };
  return badgeColors[status];
};

export const getAudioButtonHoverColor = () => {
  return "blue.100";
};

export const getDeckColors = () => ({
  learned: {
    bg: "green.50",
    border: "green.200",
    text: "green.800",
  },
  inProgress: {
    bg: "blue.50",
    border: "blue.200",
    text: "blue.800",
  },
  unlearned: {
    bg: "red.50",
    border: "red.200",
    text: "red.800",
  },
  add: {
    bg: "gray.50",
    border: "gray.200",
    text: "gray.800",
  },
});

export const getSetStateColors = (state: "Tobe" | "Current") => {
  const stateColors = {
    Tobe: {
      bg: "orange.50",
      border: "orange.200",
      text: "orange.800",
      badge: "orange",
    },
    Current: {
      bg: "blue.50",
      border: "blue.200",
      text: "blue.800",
      badge: "blue",
    },
  };
  return stateColors[state];
};

export const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return "green.500";
  if (percentage >= 60) return "blue.500";
  if (percentage >= 40) return "yellow.500";
  return "red.500";
};
