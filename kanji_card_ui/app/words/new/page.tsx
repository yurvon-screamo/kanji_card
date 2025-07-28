"use client";

import {
  Button,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Container,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LuPlus, LuBookOpen } from "react-icons/lu";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader, PageHeaderActions } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { WordCard } from "@/components/words/WordCard";
import { DefaultService } from "@/api";

export default function NewWordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch unknown words
  const {
    data: words = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["words", "unknown"],
    queryFn: () => DefaultService.listUnknownWords(),
  });

  const set_size = 8;
  // Create study set mutation
  const createSetMutation = useMutation({
    mutationFn: async () => {
      return DefaultService.buildNewSet({ set_size: set_size });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["words"] });
      queryClient.invalidateQueries({ queryKey: ["sets"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      router.push("/sets");
    },
  });

  // Filter words based on search
  const filteredWords = words.filter(
    (word) =>
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (word.reading || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (word.translation || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateSet = () => {
    createSetMutation.mutate();
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message="Загружаем новые слова..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState
          title="Не удалось загрузить слова"
          message="Проверьте подключение к интернету и попробуйте снова"
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  const headerActions = (
    <PageHeaderActions>
      <Button colorScheme="blue" onClick={() => router.push("/extract/text")}>
        <LuPlus style={{ marginRight: "0.5rem" }} />
        Добавить слова
      </Button>
      <Button
        colorScheme="green"
        onClick={handleCreateSet}
        disabled={createSetMutation.isPending}
        loading={createSetMutation.isPending}
        loadingText="Создание..."
      >
        <LuBookOpen style={{ marginRight: "0.5rem" }} />
        Создать набор
      </Button>
    </PageHeaderActions>
  );

  return (
    <AppLayout>
      <Container maxW="6xl" py={8}>
        <VStack gap={6} align="stretch">
          <PageHeader
            title="Новые слова"
            description="Управляйте неизученными словами и создавайте наборы для изучения"
            actions={headerActions}
          />

          {/* Search and Controls */}
          <VStack gap={4} align="stretch">
            <SearchBar
              placeholder="Поиск по слову, чтению или переводу..."
              onSearch={handleSearch}
              value={searchTerm}
            />

            <HStack justify="space-between" align="center">
              <Text color="gray.600">{filteredWords.length} слов</Text>
            </HStack>
          </VStack>

          {/* Words Grid */}
          {filteredWords.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {filteredWords.map((word) => (
                <WordCard key={word.id} word={word} />
              ))}
            </SimpleGrid>
          ) : words.length === 0 ? (
            <EmptyState
              title="Нет новых слов"
              description="Добавьте слова для начала изучения"
              onAction={() => router.push("/extract/text")}
              actionText="Добавить первые слова"
            />
          ) : (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить поисковый запрос"
              onAction={() => setSearchTerm("")}
              actionText="Очистить поиск"
            />
          )}
        </VStack>
      </Container>
    </AppLayout>
  );
}
