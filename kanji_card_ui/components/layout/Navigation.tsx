"use client";

import {
  Box,
  Flex,
  HStack,
  Link,
  Container,
  Text,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { LuMenu } from "react-icons/lu";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { ColorModeButton, useColorModeValue } from "@/components/ui/color-mode";
import { useState } from "react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavLink = ({ href, children, isActive }: NavLinkProps) => {
  return (
    <Link
      as={NextLink}
      href={href}
      px={3}
      py={2}
      rounded="md"
      fontWeight={isActive ? "bold" : "medium"}
      color={isActive ? "brand.600" : "gray.600"}
      bg={isActive ? "brand.50" : "transparent"}
      _hover={{
        textDecoration: "none",
        bg: isActive ? "brand.100" : "gray.100",
        color: isActive ? "brand.700" : "gray.800",
      }}
      _dark={{
        color: isActive ? "brand.300" : "gray.300",
        bg: isActive ? "brand.900" : "transparent",
        _hover: {
          bg: isActive ? "brand.800" : "gray.700",
          color: isActive ? "brand.200" : "gray.200",
        },
      }}
    >
      {children}
    </Link>
  );
};

export const Navigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const navItems = [
    { href: "/words/new", label: "Новые слова" },
    { href: "/sets", label: "Наборы для изучения" },
    { href: "/words/learned", label: "Изученные слова" },
    { href: "/words/review", label: "Повторение" },
  ];

  const isActivePath = (href: string) => {
    if (href === "/sets") {
      return pathname === "/" || pathname === "/sets";
    }
    return pathname.startsWith(href);
  };

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <Link as={NextLink} href="/sets" _hover={{ textDecoration: "none" }}>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="brand.600"
              _dark={{ color: "brand.300" }}
            >
              Kanji Card
            </Text>
          </Link>

          {/* Desktop Navigation */}
          <HStack as="nav" gap={1} display={{ base: "none", md: "flex" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                isActive={isActivePath(item.href)}
              >
                {item.label}
              </NavLink>
            ))}
          </HStack>

          {/* Right side actions */}
          <HStack gap={3}>
            <ColorModeButton />

            {/* Mobile menu button */}
            <IconButton
              aria-label="Открыть меню"
              onClick={onOpen}
              variant="ghost"
              size="sm"
              display={{ base: "flex", md: "none" }}
            >
              <LuMenu />
            </IconButton>
          </HStack>
        </Flex>
      </Container>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={1000}
          onClick={onClose}
        >
          <Box
            position="absolute"
            right={0}
            top={0}
            bottom={0}
            width="300px"
            bg={bgColor}
            boxShadow="lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px"
              borderColor={borderColor}
            >
              <Text fontWeight="bold">Навигация</Text>
              <IconButton
                aria-label="Закрыть меню"
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                ×
              </IconButton>
            </Flex>
            <VStack gap={4} align="stretch" p={4}>
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  isActive={isActivePath(item.href)}
                >
                  {item.label}
                </NavLink>
              ))}
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};
