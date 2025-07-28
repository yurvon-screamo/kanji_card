"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { Box, Text, Link as ChakraLink } from "@chakra-ui/react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
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
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <RegisterForm />
      <Text mt={4} textAlign="center" color="gray.600">
        Уже есть аккаунт?{" "}
        <ChakraLink
          as={Link}
          href="/login"
          color="blue.600"
          _hover={{ color: "blue.500" }}
        >
          Войти
        </ChakraLink>
      </Text>
    </Box>
  );
}
