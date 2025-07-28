"use client";

import { Card, VStack, HStack, Badge, Box } from "@chakra-ui/react";

export enum StudyStep {
  OVERVIEW = 0,
  JAPANESE_TO_RUSSIAN = 1,
  RUSSIAN_TO_JAPANESE = 2,
  MIXED = 3,
}

interface StudyProgressProps {
  currentStep: StudyStep;
  currentWordIndex: number;
  totalWords: number;
  totalSteps?: number;
}

export default function StudyProgress({
  currentStep,
  totalSteps = 4,
}: StudyProgressProps) {
  const stepTitles = [
    "Ознакомление с набором",
    "Японский → Русский",
    "Русский → Японский",
    "Смешанное изучение",
  ];

  const stepColors = ["blue", "green", "orange", "purple"];

  return (
    <Card.Root>
      <Card.Body>
        <VStack gap={4} align="stretch">
          {/* Заголовок с текущим шагом */}
          <HStack justify="space-between" align="center">
            <HStack gap={2}>
              <Badge colorPalette={stepColors[currentStep]}>
                {stepTitles[currentStep]}
              </Badge>
            </HStack>

            <HStack gap={2}>
              {Array.from({ length: totalSteps }, (_, index) => (
                <Box
                  key={index}
                  w={8}
                  h={2}
                  borderRadius="full"
                  bg={
                    index < currentStep
                      ? `${stepColors[index]}.500`
                      : index === currentStep
                        ? `${stepColors[index]}.300`
                        : "gray.200"
                  }
                  transition="all 0.2s"
                />
              ))}
            </HStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
