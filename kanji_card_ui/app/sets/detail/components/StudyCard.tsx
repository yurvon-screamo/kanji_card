"use client";

import {
  Card,
  VStack,
  Text,
  Heading,
  IconButton,
  HStack,
  Box,
  Badge,
} from "@chakra-ui/react";
import { LuVolume2, LuRotateCcw } from "react-icons/lu";
import { WordResponse } from "@/api";

interface StudyCardProps {
  word: WordResponse;
  onAudioPlay: (text: string) => void;
  onCardComplete?: () => void;
  cardSide?: number;
  onCardSideChange?: (side: number) => void;
  isAutoMode?: boolean;
}

enum CardSide {
  KANJI = 0,
  READING = 1,
  TRANSLATION = 2,
}

export default function StudyCard({
  word,
  onAudioPlay,
  onCardComplete,
  cardSide = 0,
  onCardSideChange,
  isAutoMode = false,
}: StudyCardProps) {
  const currentSide = cardSide;

  const handleCardClick = () => {
    const nextSide = (currentSide + 1) % 3;

    if (onCardSideChange) {
      onCardSideChange(nextSide);
    }

    if (nextSide === 0 && isAutoMode && onCardComplete) {
      setTimeout(() => {
        onCardComplete();
      }, 1000);
    }
  };

  const resetCard = () => {
    if (onCardSideChange) {
      onCardSideChange(0);
    }
  };

  const getSideContent = () => {
    switch (currentSide) {
      case CardSide.KANJI:
        return {
          main: word.word,
          secondary: null,
          bgColor: "blue.50",
          borderColor: "blue.200",
        };
      case CardSide.READING:
        return {
          main: word.reading || word.word,
          secondary: word.part_of_speech,
          audioText: word.reading || word.word,
          bgColor: "green.50",
          borderColor: "green.200",
        };
      case CardSide.TRANSLATION:
        return {
          main: word.translation,
          secondary: word.part_of_speech,
          bgColor: "orange.50",
          borderColor: "orange.200",
        };
      default:
        return {
          main: word.word,
          secondary: null,
          audioText: word.word,
          bgColor: "blue.50",
          borderColor: "blue.200",
        };
    }
  };

  const getSideLabel = () => {
    switch (currentSide) {
      case CardSide.KANJI:
        return "Кандзи";
      case CardSide.READING:
        return "Чтение";
      case CardSide.TRANSLATION:
        return "Перевод";
      default:
        return "Кандзи";
    }
  };

  const content = getSideContent();

  return (
    <Card.Root
      cursor="pointer"
      onClick={handleCardClick}
      _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
      transition="all 0.3s ease"
      minH="300px"
      bg={content.bgColor}
      borderColor={content.borderColor}
      borderWidth="2px"
      position="relative"
    >
      {/* Индикатор стороны карточки */}
      <Box position="absolute" top={3} left={3}>
        <Badge
          colorPalette={
            currentSide === 0 ? "blue" : currentSide === 1 ? "green" : "orange"
          }
        >
          {getSideLabel()}
        </Badge>
      </Box>

      {/* Индикатор прогресса */}
      <Box position="absolute" top={3} right={3}>
        <HStack gap={1}>
          {[0, 1, 2].map((side) => (
            <Box
              key={side}
              w={2}
              h={2}
              borderRadius="full"
              bg={side <= currentSide ? "blue.500" : "gray.300"}
              transition="all 0.2s"
            />
          ))}
        </HStack>
      </Box>

      <Card.Body>
        <VStack gap={4} justify="center" minH="200px" textAlign="center">
          <Heading
            size={currentSide === CardSide.KANJI ? "3xl" : "2xl"}
            fontFamily={currentSide === CardSide.KANJI ? "serif" : "inherit"}
            lineHeight="1.2"
          >
            {content.main}
          </Heading>

          {content.secondary && (
            <Text fontSize="md" color="gray.600">
              {content.secondary}
            </Text>
          )}

          {/* Кнопки управления */}
          <HStack gap={2} pt={4}>
            {content.audioText && (
              <IconButton
                aria-label="Озвучить"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAudioPlay(content.audioText);
                }}
              >
                <LuVolume2 />
              </IconButton>
            )}

            {currentSide > 0 && (
              <IconButton
                aria-label="Сбросить"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  resetCard();
                }}
              >
                <LuRotateCcw />
              </IconButton>
            )}
          </HStack>

          {/* Подсказка */}
          <Text fontSize="sm" color="gray.500" mt={2}>
            {currentSide < 2
              ? "Нажмите для продолжения"
              : "Нажмите для следующего слова"}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
