import React, { useState, useRef, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { colors } from "@/lib/theme";
import { WordRepository } from "../shared/repository";
import { ExtractedWordsEditor } from "./ExtractedWordsEditor";
import { ExtractedWord } from "@/api";
import { Button } from "@fluentui/react-components";

export const ImageInput = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleFileSelect(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const repository = WordRepository.getInstance();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const words = await repository.extractWordsFromImage(new Uint8Array(arrayBuffer));
      setExtractedWords(words);
    } catch (error) {
      console.error("Error extracting words:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedWords(null);
  };

  if (extractedWords) {
    return (
      <ExtractedWordsEditor
        initialWords={extractedWords}
        onSave={handleSave}
        onCancel={handleSave}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-medium ${colors.ui.text.default}`}>
          Загрузка изображения
        </h3>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Поддерживаемые форматы: JPG, PNG. Или просто вставьте изображение из буфера обмена (Ctrl+V).
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={loading}
            appearance="primary"
            style={{ width: "100%" }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Извлечение слов...
              </div>
            ) : (
              "Извлечь слова"
            )}
          </Button>
        </div>
      )}

      {!preview && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Перетащите изображение сюда или вставьте из буфера обмена (Ctrl+V)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};