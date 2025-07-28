"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
  Badge,
  Card,
  Alert,
  Separator,
  Tabs,
  Checkbox,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { DefaultService } from "@/api";
import { useMutation } from "@tanstack/react-query";
import type { ExtractedWord } from "@/api/models/ExtractedWord";

type InputMode = "image" | "text";

export default function ExtractTextPage() {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для конвертации файла в Array<number>
  const fileToByteArray = (file: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(Array.from(uint8Array));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Мутация для извлечения слов из изображения
  const extractFromImageMutation = useMutation({
    mutationFn: async (file: File): Promise<ExtractedWord[]> => {
      const imageData = await fileToByteArray(file);
      return DefaultService.extractWordsFromImage({ image_data: imageData });
    },
    onSuccess: (data) => {
      setExtractedWords(data);
    },
  });

  // Мутация для извлечения слов из текста
  const extractFromTextMutation = useMutation({
    mutationFn: async (text: string): Promise<ExtractedWord[]> => {
      return DefaultService.extractWordsFromText({ text });
    },
    onSuccess: (data) => {
      setExtractedWords(data);
    },
  });

  // Мутация для сохранения слов
  const saveWordsMutation = useMutation({
    mutationFn: async (words: ExtractedWord[]): Promise<void> => {
      return DefaultService.saveWords({ words });
    },
    onSuccess: (_, variables) => {
      // Очищаем выбранные слова после успешного сохранения
      setSelectedWords(new Set());
      // Показываем уведомление об успехе
      setSaveSuccess(
        `Успешно сохранено ${variables.length} слов(а) в изучение`,
      );
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Создаем URL для предварительного просмотра
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Сбрасываем предыдущие результаты
      setExtractedWords([]);
      setSelectedWords(new Set());
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
    // Сбрасываем предыдущие результаты при изменении текста
    setExtractedWords([]);
    setSelectedWords(new Set());
  };

  const handleExtractFromImage = () => {
    if (selectedFile) {
      extractFromImageMutation.mutate(selectedFile);
    }
  };

  const handleExtractFromText = () => {
    if (inputText.trim()) {
      extractFromTextMutation.mutate(inputText.trim());
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setInputText("");
    setExtractedWords([]);
    setSelectedWords(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    handleReset();
  };

  const handleWordSelect = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedWords);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedWords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWords.size === extractedWords.length) {
      setSelectedWords(new Set());
    } else {
      setSelectedWords(new Set(extractedWords.map((_, index) => index)));
    }
  };

  const handleSaveSelected = () => {
    const wordsToSave = Array.from(selectedWords).map(
      (index) => extractedWords[index],
    );
    saveWordsMutation.mutate(wordsToSave);
  };

  const handleSaveSingleWord = (word: ExtractedWord) => {
    saveWordsMutation.mutate([word]);
  };

  // Автоматически скрываем уведомление об успехе через 3 секунды
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const isLoading =
    extractFromImageMutation.isPending ||
    extractFromTextMutation.isPending ||
    saveWordsMutation.isPending;
  const error =
    extractFromImageMutation.error ||
    extractFromTextMutation.error ||
    saveWordsMutation.error;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Заголовок */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Извлечение японских слов
          </Heading>
          <Text color="gray.600">
            Загрузите изображение или введите текст для автоматического анализа
            японских слов
          </Text>
        </Box>

        {/* Переключатель режимов */}
        <Tabs.Root
          value={inputMode}
          onValueChange={(e) => handleModeChange(e.value as InputMode)}
        >
          <Tabs.List>
            <Tabs.Trigger value="image">Из изображения</Tabs.Trigger>
            <Tabs.Trigger value="text">Из текста</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="image">
            {/* Карточка загрузки файла */}
            <Card.Root p={6}>
              <Card.Body>
                <VStack gap={4}>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    display="none"
                  />

                  {!selectedFile ? (
                    <VStack gap={4}>
                      <Text textAlign="center" color="gray.500">
                        Выберите изображение с японским текстом
                      </Text>
                      <Button colorScheme="blue" onClick={handleSelectFile}>
                        Выбрать файл
                      </Button>
                    </VStack>
                  ) : (
                    <VStack gap={4} w="full">
                      {/* Предварительный просмотр */}
                      <Box textAlign="center">
                        <Image
                          src={previewUrl}
                          alt="Предварительный просмотр"
                          maxH="300px"
                          maxW="full"
                          objectFit="contain"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                        />
                        <Text mt={2} fontSize="sm" color="gray.600">
                          {selectedFile.name}
                        </Text>
                      </Box>

                      {/* Кнопки действий */}
                      <HStack gap={3}>
                        <Button
                          colorScheme="green"
                          onClick={handleExtractFromImage}
                          loading={isLoading}
                        >
                          Извлечь слова
                        </Button>
                        <Button variant="outline" onClick={handleSelectFile}>
                          Выбрать другой файл
                        </Button>
                        <Button variant="ghost" onClick={handleReset}>
                          Сбросить
                        </Button>
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="text">
            {/* Карточка ввода текста */}
            <Card.Root p={6}>
              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Text color="gray.600">
                    Введите японский текст для анализа
                  </Text>
                  <Textarea
                    placeholder="Введите японский текст..."
                    value={inputText}
                    onChange={handleTextChange}
                    minH="120px"
                    resize="vertical"
                  />
                  <HStack gap={3}>
                    <Button
                      colorScheme="green"
                      onClick={handleExtractFromText}
                      loading={isLoading}
                      disabled={!inputText.trim()}
                    >
                      Извлечь слова
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                      Очистить
                    </Button>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>

        {/* Прогресс обработки */}
        {isLoading && (
          <Card.Root p={4}>
            <Card.Body>
              <VStack gap={3}>
                <Text fontWeight="medium">Извлечение слов...</Text>
                <Box
                  w="full"
                  h="2"
                  bg="gray.200"
                  borderRadius="full"
                  overflow="hidden"
                >
                  <Box h="full" bg="blue.500" borderRadius="full" w="100%" />
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Это может занять несколько минут
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Ошибка */}
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Ошибка!</Alert.Title>
              <Alert.Description>
                {error?.message || "Не удалось извлечь слова"}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Уведомление об успехе */}
        {saveSuccess && (
          <Alert.Root status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Успех!</Alert.Title>
              <Alert.Description>{saveSuccess}</Alert.Description>
            </Alert.Content>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSaveSuccess(null)}
              ml="auto"
            >
              ×
            </Button>
          </Alert.Root>
        )}

        {/* Результаты */}
        {extractedWords.length > 0 && (
          <Stack gap={4}>
            {/* Статистика */}
            <Card.Root p={4}>
              <Card.Body>
                <HStack justify="space-between" align="center">
                  <VStack align="start" gap={1}>
                    <Text fontWeight="medium">Результат обработки</Text>
                    <Text fontSize="sm" color="gray.600">
                      Источник:{" "}
                      {inputMode === "image" ? "изображение" : "текст"}
                    </Text>
                  </VStack>
                  <Badge colorScheme="green" variant="subtle">
                    Найдено слов: {extractedWords.length}
                  </Badge>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root p={4}>
              <Card.Body>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between" align="center">
                    <Heading size="md">Найденные слова</Heading>
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAll}
                      >
                        {selectedWords.size === extractedWords.length
                          ? "Снять выделение"
                          : "Выбрать все"}
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleSaveSelected}
                        disabled={selectedWords.size === 0}
                        loading={saveWordsMutation.isPending}
                      >
                        Сохранить выбранные ({selectedWords.size})
                      </Button>
                      {extractedWords.length > 0 && (
                        <Text fontSize="xs" color="gray.500">
                          {extractedWords.length} слов найдено
                        </Text>
                      )}
                    </HStack>
                  </HStack>
                  <Separator />

                  <Stack gap={3}>
                    {extractedWords.map((word, index) => (
                      <Box
                        key={index}
                        p={3}
                        border="1px solid"
                        borderColor={
                          selectedWords.has(index) ? "blue.300" : "gray.200"
                        }
                        borderRadius="md"
                        bg={selectedWords.has(index) ? "blue.50" : "white"}
                      >
                        <HStack justify="space-between" align="start">
                          <HStack align="start" gap={3}>
                            <Checkbox.Root
                              checked={selectedWords.has(index)}
                              onCheckedChange={(checked) =>
                                handleWordSelect(
                                  index,
                                  checked.checked === true,
                                )
                              }
                              mt={1}
                            >
                              <Checkbox.Control />
                            </Checkbox.Root>
                            <VStack align="start" gap={1}>
                              <Text fontWeight="bold" fontSize="lg">
                                {word.word}
                              </Text>
                              <Text color="gray.700" fontSize="sm">
                                Перевод: {word.translation}
                              </Text>
                              <Badge variant="outline" size="sm">
                                {word.part_of_speech}
                              </Badge>
                            </VStack>
                          </HStack>

                          <VStack align="end" gap={2}>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => handleSaveSingleWord(word)}
                              loading={saveWordsMutation.isPending}
                              disabled={selectedWords.has(index)}
                            >
                              {selectedWords.has(index)
                                ? "Выбрано"
                                : "Сохранить"}
                            </Button>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </Stack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Stack>
        )}
      </VStack>
    </Container>
  );
}
