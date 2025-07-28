"use client";

import React from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Code,
  Flex,
} from "@chakra-ui/react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <Flex justify="center" align="center" minH="400px" p={8}>
          <Box maxW="lg" w="full">
            <VStack gap={6} align="stretch">
              <Box
                p={4}
                bg="red.50"
                borderRadius="md"
                border="1px"
                borderColor="red.200"
                _dark={{
                  bg: "red.900",
                  borderColor: "red.700",
                }}
              >
                <VStack gap={2} align="start">
                  <Heading
                    size="md"
                    color="red.600"
                    _dark={{ color: "red.300" }}
                  >
                    Something went wrong!
                  </Heading>
                  <Text color="red.700" _dark={{ color: "red.200" }}>
                    An unexpected error occurred. Please try refreshing the page
                    or contact support if the problem persists.
                  </Text>
                </VStack>
              </Box>

              <VStack gap={4}>
                <Button
                  colorPalette="blue"
                  onClick={this.resetError}
                  size="lg"
                  w="full"
                >
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  w="full"
                >
                  Refresh Page
                </Button>
              </VStack>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <Box>
                  <Heading size="sm" mb={3} color="red.600">
                    Error Details (Development Only)
                  </Heading>
                  <Box
                    p={4}
                    bg="red.50"
                    borderRadius="md"
                    border="1px"
                    borderColor="red.200"
                    _dark={{
                      bg: "red.900",
                      borderColor: "red.700",
                    }}
                  >
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      {this.state.error.name}: {this.state.error.message}
                    </Text>
                    {this.state.error.stack && (
                      <Code
                        display="block"
                        whiteSpace="pre-wrap"
                        fontSize="xs"
                        p={2}
                        bg="red.100"
                        _dark={{ bg: "red.800" }}
                        borderRadius="sm"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {this.state.error.stack}
                      </Code>
                    )}
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>
        </Flex>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error caught:", error, errorInfo);
  };
};

// Simple error fallback component
export const SimpleErrorFallback = ({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) => (
  <Box
    p={4}
    bg="red.50"
    borderRadius="md"
    border="1px"
    borderColor="red.200"
    _dark={{
      bg: "red.900",
      borderColor: "red.700",
    }}
  >
    <Flex justify="space-between" align="center">
      <Box>
        <Text fontWeight="bold" color="red.600" _dark={{ color: "red.300" }}>
          Error!
        </Text>
        <Text color="red.700" _dark={{ color: "red.200" }}>
          {error?.message || "Something went wrong"}
        </Text>
      </Box>
      <Button size="sm" onClick={resetError} colorPalette="red">
        Retry
      </Button>
    </Flex>
  </Box>
);
