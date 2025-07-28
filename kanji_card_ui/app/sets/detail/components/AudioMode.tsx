"use client";

import {
  Box,
  Card,
  VStack,
  HStack,
  Heading,
  Text,
  IconButton,
  Button,
  Badge,
} from "@chakra-ui/react";
import { LuPlay, LuPause, LuSquare } from "react-icons/lu";
import { useState, useEffect, useCallback } from "react";
import { WordResponse } from "@/api";

interface AudioModeProps {
  words: WordResponse[];
  onClose: () => void;
}

enum PlaybackState {
  STOPPED = "stopped",
  PLAYING = "playing",
  PAUSED = "paused",
}

enum AudioPhase {
  JAPANESE = "japanese",
  PAUSE_AFTER_JAPANESE = "pause_after_japanese",
  TRANSLATION = "translation",
  PAUSE_AFTER_TRANSLATION = "pause_after_translation",
}

export default function AudioMode({ words, onClose }: AudioModeProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    PlaybackState.STOPPED,
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<AudioPhase>(
    AudioPhase.JAPANESE,
  );
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const playAudio = useCallback(
    (text: string) => {
      // Здесь можно интегрировать TTS API
      // Пока что просто консольный лог
      console.log("Playing audio:", text);

      // Имитация TTS с помощью Web Speech API
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang =
          currentPhase === AudioPhase.JAPANESE ? "ja-JP" : "ru-RU";
        speechSynthesis.speak(utterance);
      }
    },
    [currentPhase],
  );

  const nextPhase = useCallback(() => {
    if (playbackState !== PlaybackState.PLAYING) return;

    let nextPhaseValue: AudioPhase;
    let nextWordIndex = currentWordIndex;
    let delay = 0;

    switch (currentPhase) {
      case AudioPhase.JAPANESE:
        nextPhaseValue = AudioPhase.PAUSE_AFTER_JAPANESE;
        delay = 1000;
        break;
      case AudioPhase.PAUSE_AFTER_JAPANESE:
        nextPhaseValue = AudioPhase.TRANSLATION;
        playAudio(currentWord.translation);
        delay = 3000; // Время на произношение перевода
        break;
      case AudioPhase.TRANSLATION:
        nextPhaseValue = AudioPhase.PAUSE_AFTER_TRANSLATION;
        delay = 1000;
        break;
      case AudioPhase.PAUSE_AFTER_TRANSLATION:
        nextWordIndex = (currentWordIndex + 1) % words.length;
        nextPhaseValue = AudioPhase.JAPANESE;

        // Если достигли конца и не зациклено
        if (nextWordIndex === 0) {
          setPlaybackState(PlaybackState.STOPPED);
          setCurrentWordIndex(0);
          setCurrentPhase(AudioPhase.JAPANESE);
          return;
        }

        delay = 1000;
        break;
    }

    const timeout = setTimeout(() => {
      setCurrentPhase(nextPhaseValue);
      if (nextWordIndex !== currentWordIndex) {
        setCurrentWordIndex(nextWordIndex);
      }

      // Воспроизводим японский текст для нового слова
      if (nextPhaseValue === AudioPhase.JAPANESE) {
        const wordToPlay =
          nextWordIndex !== currentWordIndex
            ? words[nextWordIndex]
            : currentWord;
        playAudio(wordToPlay.word);
      }
    }, delay);

    setTimeoutId(timeout);
  }, [
    playbackState,
    currentPhase,
    currentWordIndex,
    words,
    currentWord,
    playAudio,
  ]);

  useEffect(() => {
    if (playbackState === PlaybackState.PLAYING) {
      nextPhase();
    }
  }, [playbackState, currentPhase, nextPhase]);

  const handlePlay = () => {
    if (playbackState === PlaybackState.STOPPED) {
      setCurrentPhase(AudioPhase.JAPANESE);
      playAudio(currentWord.word);
    }
    setPlaybackState(PlaybackState.PLAYING);
  };

  const handlePause = () => {
    setPlaybackState(PlaybackState.PAUSED);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    speechSynthesis.cancel();
  };

  const handleStop = () => {
    setPlaybackState(PlaybackState.STOPPED);
    setCurrentWordIndex(0);
    setCurrentPhase(AudioPhase.JAPANESE);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    speechSynthesis.cancel();
  };

  const getPhaseDisplay = () => {
    switch (currentPhase) {
      case AudioPhase.JAPANESE:
        return { text: "Японский", color: "blue" };
      case AudioPhase.PAUSE_AFTER_JAPANESE:
        return { text: "Пауза", color: "gray" };
      case AudioPhase.TRANSLATION:
        return { text: "Перевод", color: "green" };
      case AudioPhase.PAUSE_AFTER_TRANSLATION:
        return { text: "Пауза", color: "gray" };
    }
  };

  const phaseDisplay = getPhaseDisplay();

  return (
    <Card.Root>
      <Card.Header>
        <HStack justify="space-between">
          <Heading size="md">Аудио режим</Heading>
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </HStack>
      </Card.Header>

      <Card.Body>
        <VStack gap={6}>
          {/* Текущее слово */}
          <Box textAlign="center" p={6} bg="gray.50" borderRadius="md" w="100%">
            <VStack gap={3}>
              <HStack gap={3}>
                <Badge colorPalette={phaseDisplay.color}>
                  {phaseDisplay.text}
                </Badge>
                <Text fontSize="sm" color="gray.600">
                  {currentWordIndex + 1} / {words.length}
                </Text>
              </HStack>

              <Heading size="2xl" fontFamily="serif">
                {currentWord.word}
              </Heading>

              {currentWord.reading && (
                <Text fontSize="lg" color="gray.600">
                  {currentWord.reading}
                </Text>
              )}

              <Text fontSize="xl" fontWeight="medium">
                {currentWord.translation}
              </Text>

              {currentWord.part_of_speech && (
                <Text fontSize="sm" color="gray.500">
                  {currentWord.part_of_speech}
                </Text>
              )}
            </VStack>
          </Box>

          <HStack gap={2}>
            {playbackState === PlaybackState.PLAYING ? (
              <IconButton
                aria-label="Пауза"
                onClick={handlePause}
                colorScheme="blue"
                size="lg"
              >
                <LuPause />
              </IconButton>
            ) : (
              <IconButton
                aria-label="Воспроизвести"
                onClick={handlePlay}
                colorScheme="green"
                size="lg"
              >
                <LuPlay />
              </IconButton>
            )}

            <IconButton
              aria-label="Стоп"
              onClick={handleStop}
              variant="outline"
            >
              <LuSquare />
            </IconButton>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
