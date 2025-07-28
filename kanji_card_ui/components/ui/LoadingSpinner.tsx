"use client";

import { Flex, Spinner, Text, VStack } from "@chakra-ui/react";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  label?: string;
  centered?: boolean;
  color?: string;
}

export const LoadingSpinner = ({
  size = "md",
  label = "Loading...",
  centered = true,
  color = "brand.500",
}: LoadingSpinnerProps) => {
  const content = (
    <VStack gap={3}>
      <Spinner color={color} size={size} />
      {label && (
        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
          {label}
        </Text>
      )}
    </VStack>
  );

  if (centered) {
    return (
      <Flex justify="center" align="center" minH="200px" w="full">
        {content}
      </Flex>
    );
  }

  return content;
};
