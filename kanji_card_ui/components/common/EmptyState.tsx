import { VStack, Text, Box, Button, Icon, Heading } from "@chakra-ui/react";
import { ReactElement } from "react";
import { LuInbox, LuPlus, LuSearch, LuBook } from "react-icons/lu";

interface EmptyStateProps {
  icon?: ReactElement;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: ReactElement;
  variant?: "default" | "search" | "create" | "minimal";
  centered?: boolean;
  minHeight?: string;
}

const getDefaultIcon = (variant: string) => {
  switch (variant) {
    case "search":
      return LuSearch;
    case "create":
      return LuPlus;
    case "minimal":
      return LuInbox;
    default:
      return LuBook;
  }
};

const getDefaultContent = (variant: string) => {
  switch (variant) {
    case "search":
      return {
        title: "Ничего не найдено",
        description: "Попробуйте изменить поисковый запрос или фильтры",
      };
    case "create":
      return {
        title: "Пока ничего нет",
        description: "Создайте первый элемент, чтобы начать работу",
        actionText: "Создать",
      };
    case "minimal":
      return {
        title: "Нет данных",
        description: "",
      };
    default:
      return {
        title: "Список пуст",
        description: "Здесь пока нет элементов для отображения",
      };
  }
};

export const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  variant = "default",
  centered = true,
  minHeight = "300px",
}: EmptyStateProps) => {
  const defaultContent = getDefaultContent(variant);
  const defaultIcon = getDefaultIcon(variant);

  const finalTitle = title ?? defaultContent.title;
  const finalDescription = description ?? defaultContent.description;
  const finalActionText = actionText ?? defaultContent.actionText;

  const renderContent = () => {
    if (variant === "minimal") {
      return (
        <VStack gap={2}>
          {icon ? (
            <Box boxSize={8} color="gray.400">
              {icon}
            </Box>
          ) : (
            <Icon as={defaultIcon} boxSize={8} color="gray.400" />
          )}
          <Text color="gray.500" fontSize="sm" fontWeight="medium">
            {finalTitle}
          </Text>
          {finalDescription && (
            <Text color="gray.400" fontSize="xs">
              {finalDescription}
            </Text>
          )}
        </VStack>
      );
    }

    return (
      <VStack gap={6} textAlign="center" maxW="md">
        {icon ? (
          <Box boxSize={16} color="gray.300">
            {icon}
          </Box>
        ) : (
          <Icon as={defaultIcon} boxSize={16} color="gray.300" />
        )}

        <VStack gap={3}>
          <Heading size="md" color="gray.600">
            {finalTitle}
          </Heading>
          {finalDescription && (
            <Text color="gray.500" fontSize="sm" lineHeight="1.5">
              {finalDescription}
            </Text>
          )}
        </VStack>

        {finalActionText && onAction && (
          <Button
            colorScheme="blue"
            variant={variant === "create" ? "solid" : "outline"}
            onClick={onAction}
          >
            {actionIcon && (
              <span style={{ marginRight: "0.5rem" }}>{actionIcon}</span>
            )}
            {finalActionText}
          </Button>
        )}
      </VStack>
    );
  };

  const content = renderContent();

  if (centered && variant !== "minimal") {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={minHeight}
        width="100%"
        py={8}
      >
        {content}
      </Box>
    );
  }

  return content;
};
