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
  Spinner,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DefaultService } from "@/api";
import {
  LuSearch,
  LuFilter,
  LuDownload,
  LuRefreshCw,
  LuCalendar,
  LuTrendingUp,
} from "react-icons/lu";

interface ReviewWord {
  id: string;
  word: string;
  reading?: string | null;
  translation: string;
  part_of_speech?: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "with_reading" | "no_reading"
  >("all");
  const [sortBy, setSortBy] = useState<"word" | "translation">("word");

  // Fetch review words
  const {
    data: words = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["words", "review", sortBy],
    queryFn: async () => {
      const response = await DefaultService.listReleasedWords();
      return response
        .map(
          (word): ReviewWord => ({
            id: word.id,
            word: word.word,
            reading: word.reading,
            translation: word.translation,
            part_of_speech: word.part_of_speech || undefined,
          }),
        )
        .sort((a, b) => {
          switch (sortBy) {
            case "word":
              return a.word.localeCompare(b.word);
            case "translation":
              return a.translation.localeCompare(b.translation);
            default:
              return 0;
          }
        });
    },
  });

  // Re-study words mutation
  const restudyMutation = useMutation({
    mutationFn: async () => {
      // This would call an API to move words back to new/study state
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
    },
  });

  // Filter words
  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (word.reading || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterBy === "all" ||
      (filterBy === "with_reading" && word.reading) ||
      (filterBy === "no_reading" && !word.reading);

    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const csvData = filteredWords
      .map((word) => [
        word.word,
        word.reading || "",
        word.translation,
        word.part_of_speech || "",
      ])
      .map((row) => row.join(","))
      .join("\n");

    const header = ["Слово", "Чтение", "Перевод", "Часть речи"].join(",");

    const blob = new Blob([header + "\n" + csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learned_words.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestudyAll = () => {
    restudyMutation.mutate();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner size="lg" label="Загружаем данные для повторения..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorBoundary>
          <Box p={8}>
            <Text color="red.500">
              Не удалось загрузить данные для повторения
            </Text>
          </Box>
        </ErrorBoundary>
      </AppLayout>
    );
  }

  const wordsWithReading = words.filter((word) => word.reading).length;
  const wordsWithoutReading = words.length - wordsWithReading;

  return (
    <AppLayout>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>
              Повторение слов
            </Heading>
            <Text color="gray.600">
              Просматривайте историю изучения и управляйте словами
            </Text>
          </Box>
          <HStack gap={3}>
            <Button
              colorPalette="orange"
              onClick={handleRestudyAll}
              disabled={restudyMutation.isPending}
              size="sm"
            >
              <HStack gap={2}>
                <LuRefreshCw />
                {restudyMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <Text>Изучить заново</Text>
                )}
              </HStack>
            </Button>
            <Button variant="outline" onClick={handleExport} size="sm">
              <HStack gap={2}>
                <LuDownload />
                <Text>Экспорт CSV</Text>
              </HStack>
            </Button>
          </HStack>
        </Flex>

        {/* Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
          <Box
            bg="blue.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="blue.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuTrendingUp color="blue" />
              <Text fontSize="sm" fontWeight="medium" color="blue.700">
                Всего слов
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {words.length}
            </Text>
          </Box>

          <Box
            bg="green.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="green.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuCalendar color="green" />
              <Text fontSize="sm" fontWeight="medium" color="green.700">
                С чтением
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {wordsWithReading}
            </Text>
          </Box>

          <Box
            bg="orange.50"
            p={4}
            borderRadius="lg"
            border="1px"
            borderColor="orange.200"
          >
            <Flex align="center" gap={2} mb={2}>
              <LuRefreshCw color="orange" />
              <Text fontSize="sm" fontWeight="medium" color="orange.700">
                Без чтения
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
              {wordsWithoutReading}
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
              <LuTrendingUp color="purple" />
              <Text fontSize="sm" fontWeight="medium" color="purple.700">
                Отфильтровано
              </Text>
            </Flex>
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              {filteredWords.length}
            </Text>
          </Box>
        </Grid>

        {/* Filters and Search */}
        <Flex gap={4} align="center" flexWrap="wrap">
          <Box flex="1" maxW="400px" position="relative">
            <Input
              placeholder="Поиск слов..."
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

          <HStack gap={3}>
            <HStack gap={2}>
              <LuFilter color="gray" />
              <select
                value={filterBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilterBy(
                    e.target.value as "all" | "with_reading" | "no_reading",
                  )
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  width: "150px",
                }}
              >
                <option value="all">Все слова</option>
                <option value="with_reading">С чтением</option>
                <option value="no_reading">Без чтения</option>
              </select>
            </HStack>

            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value as "word" | "translation")
              }
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                width: "150px",
              }}
            >
              <option value="word">По слову</option>
              <option value="translation">По переводу</option>
            </select>
          </HStack>

          <Text color="gray.600" fontSize="sm">
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
                    {!word.reading && (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        Без чтения
                      </Badge>
                    )}
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
                ? "Нет слов для повторения. Начните изучать, чтобы создать словарь!"
                : "Нет слов, соответствующих текущим фильтрам."}
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
