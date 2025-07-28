"use client";

import { Box, Container, Flex } from "@chakra-ui/react";
import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Flex direction="column" minH="100vh">
      <Navigation />
      <Box flex="1" as="main">
        <Container maxW="container.xl" py={8}>
          {children}
        </Container>
      </Box>
    </Flex>
  );
};
