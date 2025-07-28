import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { WordResponse } from "@/api";

export interface WordCardProps {
  word: WordResponse;
  variant?: "compact" | "full" | "table" | "selection";
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (wordId: string, selected: boolean) => void;
  onClick?: (word: WordResponse) => void;
  actions?: ReactNode;
  showStatus?: boolean;
  showActions?: boolean;
  isInteractive?: boolean;
}

export const WordCard = ({
  word,
  variant = "full",
  selectable = false,
  selected = false,
  onSelect,
  onClick,
  actions,
  showStatus = false,
  showActions = false,
  isInteractive = false,
}: WordCardProps) => {
  const handleCardClick = () => {
    if (onClick && isInteractive) {
      onClick(word);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onSelect?.(word.id, event.target.checked);
  };

  if (variant === "compact") {
    return (
      <Box
        p={3}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        cursor={isInteractive && onClick ? "pointer" : "default"}
        _hover={isInteractive && onClick ? { bg: "gray.50" } : undefined}
        onClick={handleCardClick}
      >
        <HStack justify="space-between" align="center" gap={2}>
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
            />
          )}

          <VStack align="start" gap={0} flex={1}>
            <Text fontWeight="bold" fontSize="md">
              {word.word}
            </Text>
            {word.reading && (
              <Text fontSize="sm" color="gray.600">
                {word.reading}
              </Text>
            )}
          </VStack>

          {showStatus && (
            <Badge colorScheme="blue" variant="subtle" size="sm">
              Новое
            </Badge>
          )}

          {actions && (
            <Box onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              {actions}
            </Box>
          )}
        </HStack>
      </Box>
    );
  }

  if (variant === "table") {
    return (
      <Box
        p={2}
        borderRadius="md"
        _hover={isInteractive ? { bg: "gray.50" } : undefined}
        cursor={isInteractive && onClick ? "pointer" : "default"}
        onClick={handleCardClick}
      >
        <HStack gap={3} align="center">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
            />
          )}

          <VStack align="start" gap={0} flex={1} minW={0}>
            <Text fontWeight="medium" fontSize="sm" truncate>
              {word.word}
            </Text>
            {word.reading && (
              <Text fontSize="xs" color="gray.500" truncate>
                {word.reading}
              </Text>
            )}
          </VStack>

          <Text fontSize="sm" color="gray.600" flex={2} truncate minW={0}>
            {(word as WordResponse & { meaning?: string }).meaning ||
              "Значение"}
          </Text>

          {showStatus && (
            <Badge colorScheme="blue" variant="subtle" size="sm">
              Новое
            </Badge>
          )}

          {actions && (
            <Box onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              {actions}
            </Box>
          )}
        </HStack>
      </Box>
    );
  }

  if (variant === "selection") {
    return (
      <Box
        p={4}
        bg={selected ? "blue.50" : "white"}
        border="1px solid"
        borderColor={selected ? "blue.200" : "gray.200"}
        borderRadius="md"
        cursor="pointer"
        _hover={{ borderColor: "blue.300" }}
        onClick={handleCardClick}
      >
        <HStack gap={3} align="start">
          {selectable && (
            <Box mt={1}>
              <input
                type="checkbox"
                checked={selected}
                onChange={handleSelectChange}
              />
            </Box>
          )}

          <VStack align="start" gap={2} flex={1}>
            <Text fontWeight="bold" fontSize="lg">
              {word.word}
            </Text>

            {word.reading && (
              <Text color="gray.600" fontSize="md">
                {word.reading}
              </Text>
            )}

            <Text color="gray.700" fontSize="sm" lineHeight="1.4">
              {(word as WordResponse & { meaning?: string }).meaning ||
                "Значение слова"}
            </Text>

            {word.part_of_speech && (
              <Badge variant="subtle" colorScheme="gray" size="sm">
                {word.part_of_speech}
              </Badge>
            )}
          </VStack>
        </HStack>
      </Box>
    );
  }

  // Default "full" variant
  return (
    <Box
      p={6}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      cursor={isInteractive && onClick ? "pointer" : "default"}
      _hover={
        isInteractive && onClick
          ? { shadow: "md", borderColor: "blue.200" }
          : undefined
      }
      transition="all 0.2s"
      onClick={handleCardClick}
    >
      <VStack align="stretch" gap={4}>
        {/* Заголовок с выбором */}
        <Flex justify="space-between" align="start">
          <HStack gap={3} flex={1}>
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={handleSelectChange}
              />
            )}

            <VStack align="start" gap={1} flex={1}>
              <Text fontWeight="bold" fontSize="xl">
                {word.word}
              </Text>

              {word.reading && (
                <Text color="gray.600" fontSize="md">
                  {word.reading}
                </Text>
              )}
            </VStack>
          </HStack>

          {showStatus && (
            <Badge colorScheme="blue" variant="subtle">
              Новое
            </Badge>
          )}
        </Flex>

        {/* Значение */}
        <Text color="gray.700" fontSize="md" lineHeight="1.5">
          {(word as WordResponse & { meaning?: string }).meaning ||
            "Значение слова"}
        </Text>

        {/* Дополнительная информация */}
        <HStack gap={2} wrap="wrap">
          {word.part_of_speech && (
            <Badge variant="outline" colorScheme="gray">
              {word.part_of_speech}
            </Badge>
          )}
        </HStack>

        {/* Действия */}
        {showActions && (actions || isInteractive) && (
          <Flex justify="space-between" align="center" pt={2}>
            <HStack gap={2}>{actions}</HStack>

            {isInteractive && onClick && (
              <HStack gap={1}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onClick?.(word);
                  }}
                >
                  Просмотр
                </Button>
              </HStack>
            )}
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

// Предустановленные варианты
export const CompactWordCard = (props: Omit<WordCardProps, "variant">) => (
  <WordCard {...props} variant="compact" />
);

export const SelectableWordCard = (
  props: Omit<WordCardProps, "variant" | "selectable">,
) => <WordCard {...props} variant="selection" selectable />;

export const TableWordCard = (props: Omit<WordCardProps, "variant">) => (
  <WordCard {...props} variant="table" />
);

// Компонент действий для слова
export const WordCardActions = ({
  onEdit,
  onDelete,
  onStudy,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onStudy?: () => void;
}) => (
  <HStack gap={1}>
    {onStudy && (
      <Button size="sm" variant="ghost" colorScheme="blue" onClick={onStudy}>
        Изучать
      </Button>
    )}
    {onEdit && (
      <Button size="sm" variant="ghost" onClick={onEdit}>
        Редактировать
      </Button>
    )}
    {onDelete && (
      <Button size="sm" variant="ghost" colorScheme="red" onClick={onDelete}>
        Удалить
      </Button>
    )}
  </HStack>
);
