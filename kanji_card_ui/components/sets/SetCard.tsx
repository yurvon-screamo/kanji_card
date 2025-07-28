import { Box, VStack, HStack, Text, Badge, Button } from "@chakra-ui/react";
import { ReactNode } from "react";
import { LuBook, LuPlay, LuClock, LuRefreshCw } from "react-icons/lu";
import { LearnSetState } from "@/api";

export interface SetCardProps {
  id: string;
  state: LearnSetState;
  wordCount: number;
  needToLearn?: boolean;
  timeToLearn?: string | null;
  onClick?: (setId: string) => void;
  variant?: "compact" | "full";
  actions?: ReactNode;
}

const getStateInfo = (state: LearnSetState, needToLearn: boolean = false) => {
  if (needToLearn) {
    return {
      label: "Готов к изучению",
      colorScheme: "red",
      icon: LuPlay,
      description: "Пора изучать!",
    };
  }

  switch (state) {
    case LearnSetState.TOBE:
      return {
        label: "Новый",
        colorScheme: "orange",
        icon: LuBook,
        description: "Еще не изучался",
      };
    case LearnSetState.CURRENT:
      return {
        label: "Изучается",
        colorScheme: "blue",
        icon: LuPlay,
        description: "В процессе изучения",
      };
    case LearnSetState.TWO_DAY:
      return {
        label: "2-й день",
        colorScheme: "green",
        icon: LuRefreshCw,
        description: "Интервальное повторение",
      };
    case LearnSetState.THREE_DAY:
      return {
        label: "3-й день",
        colorScheme: "green",
        icon: LuRefreshCw,
        description: "Интервальное повторение",
      };
    case LearnSetState.FIVE_DAY:
      return {
        label: "5-й день",
        colorScheme: "green",
        icon: LuRefreshCw,
        description: "Интервальное повторение",
      };
    case LearnSetState.SEVEN_DAY:
      return {
        label: "7-й день",
        colorScheme: "green",
        icon: LuRefreshCw,
        description: "Интервальное повторение",
      };
    case LearnSetState.TEN_DAY:
      return {
        label: "10-й день",
        colorScheme: "green",
        icon: LuRefreshCw,
        description: "Интервальное повторение",
      };
    default:
      return {
        label: "Неизвестно",
        colorScheme: "gray",
        icon: LuBook,
        description: "",
      };
  }
};

const formatTimeToLearn = (timeToLearn: string | null): string => {
  if (!timeToLearn) return "";

  try {
    const date = new Date(timeToLearn);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return "Готов";
    } else if (diffHours < 24) {
      return `через ${diffHours}ч`;
    } else {
      return `через ${diffDays}д`;
    }
  } catch {
    return timeToLearn;
  }
};

export const SetCard = ({
  id,
  state,
  wordCount,
  needToLearn = false,
  timeToLearn,
  onClick,
  variant = "full",
  actions,
}: SetCardProps) => {
  const stateInfo = getStateInfo(state, needToLearn);
  const timeText = formatTimeToLearn(timeToLearn ?? null);

  const handleCardClick = () => {
    onClick?.(id);
  };

  if (variant === "compact") {
    return (
      <Box
        p={4}
        bg="white"
        border="1px solid"
        borderColor={needToLearn ? "red.200" : "gray.200"}
        borderRadius="md"
        cursor={onClick ? "pointer" : "default"}
        _hover={
          onClick
            ? {
                borderColor: needToLearn ? "red.300" : "blue.300",
                shadow: "sm",
              }
            : undefined
        }
        onClick={handleCardClick}
        position="relative"
      >
        {needToLearn && (
          <Box
            position="absolute"
            top="-2px"
            right="-2px"
            w="8px"
            h="8px"
            bg="red.500"
            borderRadius="full"
          />
        )}

        <HStack justify="space-between" align="center">
          <HStack gap={3}>
            <VStack align="start" gap={0}>
              <Text fontWeight="medium" fontSize="sm">
                Набор #{id.slice(-6)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {wordCount} слов
              </Text>
            </VStack>
          </HStack>

          <HStack gap={2}>
            <Badge
              colorScheme={stateInfo.colorScheme}
              variant="subtle"
              size="sm"
            >
              {stateInfo.label}
            </Badge>
            {actions}
          </HStack>
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      p={6}
      bg="white"
      border="1px solid"
      borderColor={needToLearn ? "red.200" : "gray.200"}
      borderRadius="lg"
      cursor={onClick ? "pointer" : "default"}
      _hover={
        onClick
          ? { borderColor: needToLearn ? "red.300" : "blue.300", shadow: "md" }
          : undefined
      }
      transition="all 0.2s"
      onClick={needToLearn && onClick ? handleCardClick : undefined}
      position="relative"
    >
      {needToLearn && (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          w="12px"
          h="12px"
          bg="red.500"
          borderRadius="full"
        />
      )}

      <VStack align="stretch" gap={4}>
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" gap={1}>
            <Text fontWeight="bold" fontSize="lg">
              Набор #{id.slice(-6)}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {stateInfo.description}
            </Text>
          </VStack>

          <Badge colorScheme={stateInfo.colorScheme} variant="subtle">
            {stateInfo.label}
          </Badge>
        </HStack>

        {/* Stats */}
        <HStack gap={6}>
          <VStack align="start" gap={1}>
            <Text fontSize="lg" fontWeight="semibold" color="blue.600">
              {wordCount}
            </Text>
            <Text fontSize="sm" color="gray.500">
              слов в наборе
            </Text>
          </VStack>

          {timeToLearn && !needToLearn && (
            <VStack align="start" gap={1}>
              <HStack>
                <LuClock size={16} />
                <Text fontSize="lg" fontWeight="semibold" color="orange.600">
                  {timeText}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                до повторения
              </Text>
            </VStack>
          )}
        </HStack>

        {actions && (
          <HStack gap={3} pt={2}>
            {actions}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export const CompactSetCard = (props: Omit<SetCardProps, "variant">) => (
  <SetCard {...props} variant="compact" />
);

export const SetCardActions = ({
  onEdit,
  onDelete,
  onExport,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}) => (
  <HStack gap={1}>
    {onEdit && (
      <Button size="sm" variant="ghost" onClick={onEdit}>
        Редактировать
      </Button>
    )}
    {onExport && (
      <Button size="sm" variant="ghost" onClick={onExport}>
        Экспорт
      </Button>
    )}
    {onDelete && (
      <Button size="sm" variant="ghost" colorScheme="red" onClick={onDelete}>
        Удалить
      </Button>
    )}
  </HStack>
);
