"use client";

import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { SetCard } from "@/components/sets/SetCard";
import { DefaultService, LearnSetState } from "@/api";

interface StudySet {
  id: string;
  state: LearnSetState;
  word_count: number;
  need_to_learn: boolean;
  time_to_learn?: string | null;
}

type TabKey = "new" | "ready" | "waiting";

export default function StudySetsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("ready");

  // Fetch study sets
  const {
    data: sets = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sets"],
    queryFn: async () => {
      const response = await DefaultService.listSets();
      return response.map(
        (set): StudySet => ({
          id: set.id,
          state: set.state,
          word_count: set.words.length,
          need_to_learn: set.need_to_learn,
          time_to_learn: set.time_to_learn,
        }),
      );
    },
  });

  const filteredSets = sets.filter((set) => {
    switch (activeTab) {
      case "new":
        return set.state === LearnSetState.TOBE;
      case "ready":
        return set.need_to_learn;
      case "waiting":
        return !set.need_to_learn && set.state !== LearnSetState.TOBE;
      default:
        return false;
    }
  });

  const getTabCounts = () => {
    const counts = {
      new: sets.filter((s) => s.state === LearnSetState.TOBE).length,
      ready: sets.filter((s) => s.need_to_learn).length,
      waiting: sets.filter(
        (s) =>
          !s.need_to_learn &&
          s.state !== LearnSetState.TOBE &&
          s.state !== LearnSetState.CURRENT,
      ).length,
    };
    return counts;
  };

  const handleSetClick = (setId: string) => {
    router.push(`/sets/detail?id=${setId}`);
  };

  const counts = getTabCounts();

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingState message="Загружаем наборы для изучения..." />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState
          title="Не удалось загрузить наборы"
          message="Проверьте подключение к интернету и попробуйте снова"
          onRetry={refetch}
        />
      </AppLayout>
    );
  }

  const tabButtons = [
    {
      key: "ready" as const,
      label: "Готовы к изучению",
      count: counts.ready,
      description: "Наборы, которые нужно изучать прямо сейчас",
    },
    {
      key: "new" as const,
      label: "Новые",
      count: counts.new,
      description: "Наборы, которые еще не изучались",
    },
    {
      key: "waiting" as const,
      label: "Ожидают повторения",
      count: counts.waiting,
      description: "Наборы в режиме интервального повторения",
    },
  ];

  const getEmptyStateProps = () => {
    switch (activeTab) {
      case "new":
        return {
          title: "Нет новых наборов",
          description:
            "Создайте новый набор, чтобы начать изучение японского языка",
          actionText: "Создать новый набор",
          onAction: () => router.push("/words/new"),
          variant: "create" as const,
        };
      case "ready":
        return {
          title: "Нет наборов для изучения",
          description: "Все наборы изучены или ожидают следующего повторения",
          actionText: "Создать новый набор",
          onAction: () => router.push("/words/new"),
          variant: "search" as const,
        };
      case "waiting":
        return {
          title: "Нет наборов в ожидании",
          description:
            "Изучите несколько наборов, чтобы они появились в режиме повторения",
          actionText: "Создать новый набор",
          onAction: () => router.push("/words/new"),
          variant: "search" as const,
        };
      default:
        return {
          title: "Нет наборов",
          description: "Создайте первый набор для изучения",
          actionText: "Создать новый набор",
          onAction: () => router.push("/words/new"),
          variant: "create" as const,
        };
    }
  };

  return (
    <AppLayout>
      <Container maxW="6xl" py={8}>
        <VStack gap={6} align="stretch">
          <PageHeader
            title="Наборы для изучения"
            description="Управляйте своими наборами слов и отслеживайте прогресс изучения по системе интервального повторения"
          />

          {/* Tab Navigation */}
          <VStack gap={4} align="stretch">
            <HStack gap={2} wrap="wrap">
              {tabButtons.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "solid" : "outline"}
                  colorScheme={activeTab === tab.key ? "blue" : "gray"}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  position="relative"
                >
                  {tab.label} ({tab.count})
                  {tab.key === "ready" && tab.count > 0 && (
                    <Box
                      position="absolute"
                      top="-2px"
                      right="-2px"
                      w="8px"
                      h="8px"
                      bg="red.500"
                      borderRadius="full"
                    />
                  )}
                </Button>
              ))}
            </HStack>

            {/* Active tab description */}
            <Text fontSize="sm" color="gray.600">
              {tabButtons.find((tab) => tab.key === activeTab)?.description}
            </Text>
          </VStack>

          {/* Sets Grid */}
          {filteredSets.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {filteredSets.map((set) => (
                <SetCard
                  key={set.id}
                  id={set.id}
                  state={set.state}
                  wordCount={set.word_count}
                  needToLearn={set.need_to_learn}
                  timeToLearn={set.time_to_learn}
                  onClick={handleSetClick}
                />
              ))}
            </SimpleGrid>
          ) : sets.length === 0 ? (
            <EmptyState
              title="Нет наборов для изучения"
              description="Создайте первый набор, чтобы начать изучение японского языка"
              onAction={() => router.push("/words/new")}
              actionText="Создать новый набор"
              variant="create"
            />
          ) : (
            <EmptyState {...getEmptyStateProps()} />
          )}
        </VStack>
      </Container>
    </AppLayout>
  );
}
