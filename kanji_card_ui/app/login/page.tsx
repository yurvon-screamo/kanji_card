"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Box, VStack, Text, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  return (
    <Box
      minH="100vh"
      bg="bg"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack gap={4}>
        <LoginForm />
        <Text textAlign="center" color="gray.600">
          Нет аккаунта?{" "}
          <Link
            as={NextLink}
            href="/register"
            color="brand.600"
            _hover={{ color: "brand.500" }}
          >
            Зарегистрироваться
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
