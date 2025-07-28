"use client";

import {
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Alert,
  IconButton,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuArrowLeft, LuShuffle, LuVolume2 } from "react-icons/lu";
import { SetResponse, DefaultService, WordResponse } from "@/api";
import { getSetStateColors } from "@/lib/colors";

// Импорт новых компонентов
import StudyProgress, { StudyStep } from "./components/StudyProgress";
import SetOverview from "./components/SetOverview";
import StudyMode from "./components/StudyMode";
import AudioMode from "./components/AudioMode";

interface StudySession {
  currentStep: StudyStep;
  currentWordIndex: number;
  studiedWords: Set<string>;
  mixedWords: (WordResponse & { showJapanese: boolean })[];
}

function SetDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setId = searchParams.get("id") || "";

  const [session, setSession] = useState<StudySession>({
    currentStep: StudyStep.OVERVIEW,
    currentWordIndex: 0,
    studiedWords: new Set(),
    mixedWords: [],
  });

  const [isAudioMode, setIsAudioMode] = useState(false);

  const {
    data: setData,
    isLoading: setLoading,
    error: setError,
  } = useQuery({
    queryKey: ["sets", setId],
    queryFn: async (): Promise<SetResponse> => {
      return await DefaultService.getSet(setId);
    },
    enabled: !!setId,
  });

  const nextIterMutation = useMutation({
    mutationFn: () => DefaultService.nextIter(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sets"] });
      router.push("/sets");
    },
    onError: (error) => {
      console.error("Failed to complete study:", error);
    },
  });

  const playAudio = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const isJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);
      utterance.lang = isJapanese ? "ja-JP" : "ru-RU";
      utterance.rate = 0.8;
      utterance.volume = 0.8;

      speechSynthesis.speak(utterance);
    } else {
      console.log("TTS not supported, playing:", text);
    }
  }, []);

  if (!setId) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack gap={6} align="stretch">
          <HStack>
            <IconButton
              aria-label="Назад"
              variant="ghost"
              onClick={() => router.push("/sets")}
            >
              <LuArrowLeft />
            </IconButton>
            <Heading size="lg">Ошибка</Heading>
          </HStack>
          <Alert.Root status="error">
            <Alert.Description>
              ID набора не указан. Пожалуйста, выберите набор из списка.
            </Alert.Description>
          </Alert.Root>
          <Button onClick={() => router.push("/sets")} colorScheme="blue">
            Вернуться к спискам наборов
          </Button>
        </VStack>
      </Container>
    );
  }

  const nextStep = () => {
    if (!setData?.words) return;

    const nextStepValue = session.currentStep + 1;

    if (nextStepValue === StudyStep.MIXED) {
      const mixedWords = [...setData.words, ...setData.words].map(
        (word, index) => ({
          ...word,
          showJapanese: index < setData.words.length,
        }),
      );

      for (let i = mixedWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixedWords[i], mixedWords[j]] = [mixedWords[j], mixedWords[i]];
      }

      setSession((prev) => ({
        ...prev,
        currentStep: nextStepValue,
        currentWordIndex: 0,
        mixedWords,
      }));
    } else {
      setSession((prev) => ({
        ...prev,
        currentStep: nextStepValue,
        currentWordIndex: 0,
      }));
    }
  };

  const completeStudy = () => {
    nextIterMutation.mutate();
  };

  const nextWord = () => {
    if (!setData?.words) return;

    const totalWords =
      session.currentStep === StudyStep.MIXED
        ? session.mixedWords.length
        : setData.words.length;

    const nextIndex = session.currentWordIndex + 1;
    if (nextIndex < totalWords) {
      setSession((prev) => ({
        ...prev,
        currentWordIndex: nextIndex,
      }));
    } else {
      // Шаг завершен
      if (session.currentStep === StudyStep.MIXED) {
        // Завершаем изучение - остаемся на том же шаге, но показываем завершение
        return;
      } else {
        nextStep();
      }
    }
  };

  // Предыдущее слово
  const previousWord = () => {
    if (session.currentWordIndex > 0) {
      setSession((prev) => ({
        ...prev,
        currentWordIndex: prev.currentWordIndex - 1,
      }));
    }
  };

  // Начало изучения
  const startStudy = () => {
    setSession((prev) => ({
      ...prev,
      currentStep: StudyStep.JAPANESE_TO_RUSSIAN,
      currentWordIndex: 0,
    }));
  };

  // Возврат к обзору
  const goToOverview = () => {
    setSession((prev) => ({
      ...prev,
      currentStep: StudyStep.OVERVIEW,
      currentWordIndex: 0,
    }));
  };

  // Запуск аудио режима
  const startAudioMode = () => {
    setIsAudioMode(true);
  };

  // Закрытие аудио режима
  const closeAudioMode = () => {
    setIsAudioMode(false);
  };

  const isLoading = setLoading;
  const error = setError;

  if (isLoading) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack gap={4}>
          <Spinner size="lg" />
          <Text>Загружаем набор...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack gap={6} align="stretch">
          <HStack>
            <IconButton
              aria-label="Назад"
              variant="ghost"
              onClick={() => router.push("/sets")}
            >
              <LuArrowLeft />
            </IconButton>
            <Heading size="lg">Ошибка</Heading>
          </HStack>
          <Alert.Root status="error">
            <Alert.Description>
              {error instanceof Error ? error.message : "Произошла ошибка"}
            </Alert.Description>
          </Alert.Root>
          <Button onClick={() => router.push("/sets")} colorScheme="blue">
            Вернуться к спискам наборов
          </Button>
        </VStack>
      </Container>
    );
  }

  if (!setData) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack gap={4}>
          <Text>Набор не найден</Text>
          <Button onClick={() => router.push("/sets")} colorScheme="blue">
            Вернуться к спискам наборов
          </Button>
        </VStack>
      </Container>
    );
  }

  const stateColors = getSetStateColors("Current");

  // Проверка завершения шага
  const getTotalWords = () => {
    return session.currentStep === StudyStep.MIXED
      ? session.mixedWords.length
      : setData.words.length;
  };

  const isStepComplete = session.currentWordIndex >= getTotalWords();

  // Обработчик завершения шага
  const handleStepComplete = () => {
    if (session.currentStep === StudyStep.MIXED) {
      completeStudy();
    } else {
      nextStep();
    }
  };

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Заголовок */}
        <HStack justify="space-between">
          <HStack>
            <IconButton
              aria-label="Назад"
              variant="ghost"
              onClick={() => router.push("/sets")}
            >
              <LuArrowLeft />
            </IconButton>
            <VStack align="start" gap={1}>
              <Heading size="lg">Изучение набора #{setId.slice(-6)}</Heading>
              <HStack>
                <Badge colorPalette={stateColors.badge}>{setData.state}</Badge>
                <Text fontSize="sm" color="gray.600">
                  {setData.words.length} слов
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack gap={2}>
            {session.currentStep !== StudyStep.OVERVIEW && (
              <Button variant="outline" onClick={goToOverview}>
                <LuShuffle style={{ marginRight: "0.5rem" }} />К обзору
              </Button>
            )}

            <Button variant="outline" onClick={startAudioMode}>
              <LuVolume2 style={{ marginRight: "0.5rem" }} />
              Аудио режим
            </Button>
          </HStack>
        </HStack>

        {/* Прогресс изучения (не показываем в режиме обзора) */}
        {session.currentStep !== StudyStep.OVERVIEW && (
          <StudyProgress
            currentStep={session.currentStep}
            currentWordIndex={session.currentWordIndex}
            totalWords={getTotalWords()}
          />
        )}

        {/* Аудио режим */}
        {isAudioMode && (
          <AudioMode words={setData.words} onClose={closeAudioMode} />
        )}

        {/* Основной контент */}
        {!isAudioMode && (
          <>
            {session.currentStep === StudyStep.OVERVIEW ? (
              <SetOverview
                words={setData.words}
                onStartStudy={startStudy}
                onStartAudioMode={startAudioMode}
                onAudioPlay={playAudio}
              />
            ) : (
              <StudyMode
                words={setData.words}
                mixedWords={session.mixedWords}
                currentStep={session.currentStep}
                currentWordIndex={session.currentWordIndex}
                onWordComplete={nextWord}
                onPreviousWord={previousWord}
                onStepComplete={handleStepComplete}
                onAudioPlay={playAudio}
                isStepComplete={isStepComplete}
              />
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}

export default function SetDetailPageWrapper() {
  return (
    <Suspense
      fallback={
        <Container maxW="4xl" py={8}>
          <VStack gap={4}>
            <Spinner size="lg" />
            <Text>Загружаем страницу...</Text>
          </VStack>
        </Container>
      }
    >
      <SetDetailPage />
    </Suspense>
  );
}
