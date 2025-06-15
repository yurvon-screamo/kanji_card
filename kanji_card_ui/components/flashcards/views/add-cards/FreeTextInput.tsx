import { useState } from "react";
import { WordRepository } from "../../data/repository";
import { colors } from "@/lib/colors";
import { ExtractedWordsEditor } from "./ExtractedWordsEditor";
import { ExtractedWord } from "@/api";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className={`text-sm ${colors.ui.text.secondary} mb-2`}>
        Введите текст, содержащий японские слова. ИИ автоматически извлечет
        японские слова, определит чтения для канзи и переведет их на русский.
        Например:
        <br />
        今日は天気がいいですね。桜の花が美しいです。
        <br />
        私は学生です。毎日日本語を勉強しています。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`w-full px-3 py-2 border ${colors.ui.border.default} rounded-md h-48`}
        placeholder="Введите текст с японскими словами..."
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className={`w-full ${loading || !text.trim()
          ? "bg-gray-400 cursor-not-allowed"
          : `${colors.ui.button.primary.bg} ${colors.ui.button.primary.hoverBg}`
          } ${colors.ui.button.primary.text} py-2 px-4 rounded-md transition-colors`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Извлечение слов...
          </div>
        ) : (
          "Извлечь слова"
        )}
      </button>
    </form>
  );
};
