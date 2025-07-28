"use client";

import {
  VStack,
  HStack,
  Button,
  Text,
  Box,
  Card,
  Heading,
} from "@chakra-ui/react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuPlay } from "react-icons/lu";
import { useState, useEffect } from "react";
import { WordResponse } from "@/api";
import StudyCard from "./StudyCard";
import { StudyStep } from "./StudyProgress";

interface StudyModeProps {
  words: WordResponse[];
  mixedWords?: (WordResponse & { showJapanese: boolean })[];
  currentStep: StudyStep;
  currentWordIndex: number;
  onWordComplete: () => void;
  onPreviousWord: () => void;
  onStepComplete: () => void;
  onAudioPlay: (text: string) => void;
  isStepComplete: boolean;
}

export default function StudyMode({
  words,
  mixedWords,
  currentStep,
  currentWordIndex,
  onWordComplete,
  onPreviousWord,
  onStepComplete,
  onAudioPlay,
  isStepComplete,
}: StudyModeProps) {
  const [cardSide, setCardSide] = useState(0);

  useEffect(() => {
    setCardSide(0);
  }, [currentWordIndex]);

  const getCurrentWord = () => {
    if (currentStep === StudyStep.MIXED && mixedWords) {
      return mixedWords[currentWordIndex];
    }
    return words[currentWordIndex];
  };

  const getTotalWords = () => {
    if (currentStep === StudyStep.MIXED && mixedWords) {
      return mixedWords.length;
    }
    return words.length;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case StudyStep.JAPANESE_TO_RUSSIAN:
        return "Японский → Русский";
      case StudyStep.RUSSIAN_TO_JAPANESE:
        return "Русский → Японский";
      case StudyStep.MIXED:
        return "Смешанное изучение";
      default:
        return "Изучение";
    }
  };

  const getDisplayWord = () => {
    const word = getCurrentWord();
    if (!word) return null;

    if (currentStep === StudyStep.MIXED && "showJapanese" in word) {
      // В смешанном режиме показываем в зависимости от флага
      if (word.showJapanese) {
        return {
          main: word.word,
          reading: word.reading,
          answer: word.translation,
          isJapaneseFirst: true,
        };
      } else {
        return {
          main: word.translation,
          reading: null,
          answer: word.word + (word.reading ? ` (${word.reading})` : ""),
          isJapaneseFirst: false,
        };
      }
    } else {
      // В обычных режимах
      const isJapaneseToRussian = currentStep === StudyStep.JAPANESE_TO_RUSSIAN;

      if (isJapaneseToRussian) {
        return {
          main: word.word,
          reading: word.reading,
          answer: word.translation,
          isJapaneseFirst: true,
        };
      } else {
        return {
          main: word.translation,
          reading: null,
          answer: word.word + (word.reading ? ` (${word.reading})` : ""),
          isJapaneseFirst: false,
        };
      }
    }
  };

  const handleCardSideChange = (side: number) => {
    setCardSide(side);

    if (side === 0 && cardSide === 2) {
      setTimeout(() => {
        onWordComplete();
      }, 1000);
    }
  };

  const handleCardComplete = () => {
    onWordComplete();
  };

  const currentWord = getCurrentWord();
  const displayWord = getDisplayWord();
  const totalWords = getTotalWords();

  if (isStepComplete) {
    return (
      <Card.Root>
        <Card.Body>
          <VStack gap={6} textAlign="center" py={8}>
            <Heading size="xl" color="green.500">
              {currentStep === StudyStep.MIXED
                ? "🎉 Изучение завершено!"
                : "✅ Шаг завершен!"}
            </Heading>

            <Text fontSize="lg">
              {currentStep === StudyStep.MIXED
                ? "Вы прошли все этапы изучения набора"
                : `Шаг "${getStepTitle()}" завершен`}
            </Text>

            <VStack gap={3}>
              <Text fontSize="md" color="gray.600">
                Изучено слов: {totalWords}
              </Text>

              {currentStep !== StudyStep.MIXED && (
                <Text fontSize="sm" color="gray.500">
                  Переходим к следующему этапу изучения
                </Text>
              )}
            </VStack>

            <Button
              onClick={onStepComplete}
              colorScheme={currentStep === StudyStep.MIXED ? "green" : "blue"}
              size="lg"
            >
              {currentStep === StudyStep.MIXED ? (
                <LuCheck style={{ marginRight: "0.5rem" }} />
              ) : (
                <LuPlay style={{ marginRight: "0.5rem" }} />
              )}
              {currentStep === StudyStep.MIXED
                ? "Завершить изучение"
                : "Следующий этап"}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (!currentWord || !displayWord) {
    return (
      <Card.Root>
        <Card.Body>
          <Text textAlign="center">Слово не найдено</Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      <Box maxW="500px" mx="auto" w="100%">
        <StudyCard
          word={currentWord}
          onAudioPlay={onAudioPlay}
          cardSide={cardSide}
          onCardSideChange={handleCardSideChange}
          onCardComplete={handleCardComplete}
          isAutoMode={true}
        />
      </Box>

      <HStack justify="space-between" gap={4}>
        <Button
          variant="outline"
          onClick={onPreviousWord}
          disabled={currentWordIndex === 0}
        >
          <LuArrowLeft style={{ marginRight: "0.5rem" }} />
          Предыдущее
        </Button>

        <VStack gap={1}>
          <Text fontSize="sm" fontWeight="medium">
            {currentWordIndex + 1} / {totalWords}
          </Text>
        </VStack>

        <Button variant="outline" onClick={onWordComplete}>
          Следующее
          <LuArrowRight style={{ marginLeft: "0.5rem" }} />
        </Button>
      </HStack>
    </VStack>
  );
}
