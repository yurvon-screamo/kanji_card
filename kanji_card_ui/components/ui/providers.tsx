"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { system } from "@/lib/theme";
import { OpenAPI } from "@/api";

export function Providers(props: ColorModeProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = "include";
    OpenAPI.HEADERS = {
      "Content-Type": "application/json",
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ColorModeProvider {...props}>
          {props.children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
