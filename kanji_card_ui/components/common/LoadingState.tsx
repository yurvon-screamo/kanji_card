import { VStack, Spinner, Text, Box } from "@chakra-ui/react";

interface LoadingStateProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  centered?: boolean;
  minHeight?: string;
}

export const LoadingState = ({
  size = "lg",
  message = "Загрузка...",
  centered = true,
  minHeight = "200px",
}: LoadingStateProps) => {
  const content = (
    <VStack gap={4}>
      <Spinner size={size} color="blue.500" />
      <Text color="gray.600" fontSize="sm">
        {message}
      </Text>
    </VStack>
  );

  if (centered) {
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
