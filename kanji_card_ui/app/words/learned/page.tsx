"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DefaultService } from "@/api";
import { LuSearch, LuBrain, LuTrendingUp, LuClock } from "react-icons/lu";

interface LearnedWord {
  id: string;
  word: string;
  reading?: string | null;
  translation: string;
  part_of_speech?: string;
}

export default function LearnedWordsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch learned words
  const {
    data: words = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["words", "learned"],
    queryFn: async () => {
      const response = await DefaultService.listReleasedWords();
      return response.map(
        (word): LearnedWord => ({
          id: word.id,
          word: word.word,
          reading: word.reading,
          translation: word.translation,
          part_of_speech: word.part_of_speech || undefined,
        }),
      );
    },
  });

  // Filter words based on search
  const filteredWords = words.filter(
    (word) =>
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (word.reading || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner size="lg" label="Загружаем изученные слова..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorBoundary>
          <Box p={8}>
            <Text color="red.500">Не удалось загрузить изученные слова</Text>
          </Box>
        </ErrorBoundary>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>
              Изученные слова
            </Heading>
            <Text color="gray.600">
              Просматривайте изученные слова и проверяйте память
            </Text>
          </Box>
        </Flex>

        {/* Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
          <Box
            bg="green.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="green.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuTrendingUp color="green" />
              <Text fontSize="sm" fontWeight="medium" color="green.700">
                Всего изучено
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {words.length}
            </Text>
            <Text fontSize="sm" color="green.600">
              слов освоено
            </Text>
          </Box>

          <Box
            bg="blue.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="blue.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuBrain color="blue" />
              <Text fontSize="sm" fontWeight="medium" color="blue.700">
                С переводом
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {words.filter((w) => w.reading).length}
            </Text>
            <Text fontSize="sm" color="blue.600">
              с чтением
            </Text>
          </Box>

          <Box
            bg="purple.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="purple.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuClock color="purple" />
              <Text fontSize="sm" fontWeight="medium" color="purple.700">
                Готово к тесту
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              {words.length}
            </Text>
            <Text fontSize="sm" color="purple.600">
              для проверки
            </Text>
          </Box>
        </Grid>

        {/* Search */}
        <Flex gap={4} align="center">
          <Box flex="1" maxW="400px" position="relative">
            <Input
              placeholder="Поиск изученных слов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              pl={10}
            />
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
            >
              <LuSearch color="gray" />
            </Box>
          </Box>
          <Text color="gray.600">
            {filteredWords.length} из {words.length} слов
          </Text>
        </Flex>

        {/* Words Grid */}
        {filteredWords.length > 0 ? (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
            gap={4}
          >
            {filteredWords.map((word) => (
              <Box
                key={word.id}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                _hover={{ boxShadow: "md" }}
              >
                <VStack align="stretch" gap={3}>
                  {/* Word Header */}
                  <VStack align="start" gap={1}>
                    <Text fontSize="xl" fontWeight="bold">
                      {word.word}
                    </Text>
                    {word.reading && (
                      <Text fontSize="sm" color="gray.600">
                        {word.reading}
                      </Text>
                    )}
                  </VStack>

                  {/* Translation */}
                  <Text fontSize="sm">{word.translation}</Text>

                  {/* Tags */}
                  <HStack gap={2} flexWrap="wrap">
                    {word.part_of_speech && (
                      <Badge colorPalette="blue" variant="subtle" size="sm">
                        {word.part_of_speech}
                      </Badge>
                    )}
                    <Badge colorPalette="green" variant="subtle" size="sm">
                      Изучено
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </Grid>
        ) : (
          <Box
            p={8}
            textAlign="center"
            bg="gray.50"
            borderRadius="lg"
            border="2px dashed"
            borderColor="gray.200"
          >
            <Text color="gray.600" mb={4}>
              {words.length === 0
                ? "Изученных слов пока нет. Начните изучать, чтобы увидеть прогресс!"
                : "Нет слов, соответствующих поиску."}
            </Text>
            {words.length === 0 && (
              <Button
                colorPalette="blue"
                onClick={() => router.push("/words/new")}
              >
                Начать изучение слов
              </Button>
            )}
          </Box>
        )}
      </VStack>
    </AppLayout>
  );
}
