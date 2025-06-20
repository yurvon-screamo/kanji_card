import React, { useState } from "react";
import { WordRepository } from "../shared/repository";
import { ExtractedWordsEditor } from "./ExtractedWordsEditor";
import { ExtractedWord } from "@/api";
import { Button, Textarea, Text, Spinner } from "@fluentui/react-components";

export const FreeTextInput = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;

    setLoading(true);

    try {
      const repository = WordRepository.getInstance();
      const words = await repository.extractWordsFromText(text);
      setExtractedWords(words);
    } catch (error) {
      console.error("Error extracting words:", error);
    } finally {
      setLoading(false);
    }
  };

  if (extractedWords) {
    return (
      <ExtractedWordsEditor
        initialWords={extractedWords}
        onSave={() => {
          setExtractedWords(null);
          setText("");
        }}
        onCancel={() => setExtractedWords(null)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Text size={300} style={{ marginBottom: '0.5rem' }}>
        Введите текст, содержащий японские слова. ИИ автоматически извлечет
        японские слова, определит чтения для канзи и переведет их на русский.
        Например:
        <br />
        今日は天気がいいですね。桜の花が美しいです。
        <br />
        私は学生です。毎日日本語を勉強しています。
      </Text>
      <Textarea
        value={text}
        onChange={(e, data) => setText(data.value)}
        placeholder="Введите текст с японскими словами..."
        disabled={loading}
        resize="vertical"
        style={{ minHeight: "12rem" }}
      />
      <Button
        type="submit"
        disabled={loading || !text.trim()}
        appearance="primary"
        style={{ width: "100%" }}
        icon={loading ? <Spinner size="tiny" /> : undefined}
      >
        {loading ? "Извлечение слов..." : "Извлечь слова"}
      </Button>
    </form>
  );
};
