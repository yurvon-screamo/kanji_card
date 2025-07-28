"use client";

import { VStack, Button, SimpleGrid, HStack } from "@chakra-ui/react";
import { LuPlay } from "react-icons/lu";
import { useState } from "react";
import { WordResponse } from "@/api";
import StudyCard from "./StudyCard";

interface SetOverviewProps {
  words: WordResponse[];
  onStartStudy: () => void;
  onStartAudioMode: () => void;
  onAudioPlay: (text: string) => void;
}

export default function SetOverview({
  words,
  onStartStudy,
  onAudioPlay,
}: SetOverviewProps) {
  const [cardStates, setCardStates] = useState<Record<string, number>>({});

  const handleCardSideChange = (wordId: string, side: number) => {
    setCardStates((prev) => ({
      ...prev,
      [wordId]: side,
    }));
  };

  return (
    <VStack gap={6} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {words.map((word) => (
          <StudyCard
            key={word.id}
            word={word}
            onAudioPlay={onAudioPlay}
            cardSide={cardStates[word.id] || 0}
            onCardSideChange={(side) => handleCardSideChange(word.id, side)}
          />
        ))}
      </SimpleGrid>
      ``{" "}
      <VStack gap={4} pt={4}>
        <HStack gap={4} justify="center">
          <Button onClick={onStartStudy} colorScheme="blue" size="lg">
            <LuPlay style={{ marginRight: "0.5rem" }} />
            Начать изучение
          </Button>
        </HStack>
      </VStack>
    </VStack>
  );
}
