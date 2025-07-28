import { VStack, Text, Box, Button, Icon } from "@chakra-ui/react";
import { LuTriangleAlert, LuRefreshCw } from "react-icons/lu";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: "simple" | "alert" | "minimal";
  centered?: boolean;
  minHeight?: string;
}

export const ErrorState = ({
  title = "Произошла ошибка",
  message = "Не удалось загрузить данные. Попробуйте еще раз.",
  onRetry,
  retryText = "Повторить",
  variant = "simple",
  centered = true,
  minHeight = "200px",
}: ErrorStateProps) => {
  const renderContent = () => {
    switch (variant) {
      case "alert":
        return (
          <Box
            p={4}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            borderRadius="md"
            maxW="md"
          >
            <VStack gap={3} align="start">
              <Box display="flex" alignItems="center" gap={2}>
                <Icon as={LuTriangleAlert} color="red.500" />
                <Text fontWeight="medium" color="red.800">
                  {title}
                </Text>
              </Box>
              <Text color="red.700" fontSize="sm">
                {message}
              </Text>
              {onRetry && (
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={onRetry}
                >
                  <LuRefreshCw style={{ marginRight: "0.5rem" }} />
                  {retryText}
                </Button>
              )}
            </VStack>
          </Box>
        );

      case "minimal":
        return (
          <VStack gap={2}>
            <Text color="red.500" fontSize="sm" fontWeight="medium">
              {title}
            </Text>
            {onRetry && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={onRetry}
              >
                <LuRefreshCw style={{ marginRight: "0.5rem" }} />
                {retryText}
              </Button>
            )}
          </VStack>
        );

      default: // simple
        return (
          <VStack gap={4} textAlign="center" maxW="md">
            <Icon as={LuTriangleAlert} boxSize={12} color="red.500" />
            <VStack gap={2}>
              <Text fontSize="lg" fontWeight="medium" color="gray.900">
                {title}
              </Text>
              <Text color="gray.600" fontSize="sm">
                {message}
              </Text>
            </VStack>
            {onRetry && (
              <Button colorScheme="red" variant="outline" onClick={onRetry}>
                <LuRefreshCw style={{ marginRight: "0.5rem" }} />
                {retryText}
              </Button>
            )}
          </VStack>
        );
    }
  };

  const content = renderContent();

  if (centered && variant !== "alert") {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={minHeight}
        width="100%"
      >
        {content}
      </Box>
    );
  }

  return content;
};
