import React, { useState, useEffect } from "react";
import { LayoutContainer } from "../../ui/LayoutContainer";
import { HorizontalCardDeck } from "./components/HorizontalCardDeck";
import { WordRepository } from "../shared/repository";
import { Collection, JapaneseWord, ViewMode } from "../shared";
import { WordResponse, WordOverview } from "../../../api";
import { colors } from "../../../lib/theme";
import { Toolbar } from "../../ui/Toolbar";
import Image from "next/image";
import { Button } from "@fluentui/react-components";
import { BookOpen } from "lucide-react";

interface PoolViewProps {
  setViewMode: (mode: ViewMode, collection?: Collection) => void;
}

export const PoolView = ({
  setViewMode,
}: PoolViewProps) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<WordOverview | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    setMounted(true);
    setLoading(false);
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const repository = WordRepository.getInstance();
      const overviewData = await repository.getOverview();
      console.log(overviewData)
      setOverview(overviewData);
      setError(null);
    } catch (error) {
      console.error("Error loading overview:", error);
      setError("Ошибка загрузки данных. Попробуйте обновить страницу.");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const mapWordResponseToJapaneseWord = (
    wordResponse: WordResponse,
  ): JapaneseWord => {
    return {
      id: wordResponse.id,
      word: wordResponse.word,
      reading: wordResponse.reading || "",
      meaning: wordResponse.translation,
    };
  };

  const handleSetClick = (collection: Collection) => {
    setViewMode("set-selection", collection);
  };

  if (!mounted || loading) {
    return (
      <>
        <Toolbar>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">日本語</h1>
          </div>
        </Toolbar>
        <LayoutContainer>
          <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4 pt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="group cursor-pointer p-6 bg-gray-200 animate-pulse rounded-lg"
                  style={{
                    width: "300px",
                    height: "200px",
                  }}
                />
              ))}
            </div>
          </div>
        </LayoutContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Toolbar>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">日本語</h1>
          </div>
        </Toolbar>
        <LayoutContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Ошибка загрузки</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadOverview();
                }}
                appearance="primary"
              >
                Повторить попытку
              </Button>
            </div>
          </div>
        </LayoutContainer>
      </>
    );
  }

  return (
    <>
      <Toolbar>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.svg"
              alt="Kanji Card"
              width={32}
              height={32}
              className="rounded-md"
            />
            <h1 className="text-xl font-semibold">日本語</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              appearance="outline"
              size="small"
              onClick={() => setViewMode('rules')}
              className="text-xs"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Правила
            </Button>
          </div>
        </div>
      </Toolbar>
      <LayoutContainer>
        <div className="w-full space-y-2 max-w-screen-lg mx-auto px-4">
          <div className="grid grid-cols-2 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
            <HorizontalCardDeck
              count={overview?.finished.total_words || 0}
              bgColor={colors.deck.learned.bg}
              borderColor={colors.deck.learned.border}
              onClick={() => setViewMode("learned")}
              words={
                overview?.finished.preview_words.map(
                  mapWordResponseToJapaneseWord,
                ) || []
              }
              title="Изученные слова"
            />

            <HorizontalCardDeck
              count={overview?.current.total_words || 0}
              bgColor={colors.deck.inProgress.bg}
              borderColor={colors.deck.inProgress.border}
              onClick={() => handleSetClick(Collection.IN_PROGRESS)}
              words={
                overview?.current.preview_words.map(
                  mapWordResponseToJapaneseWord,
                ) || []
              }
              title="В процессе"
            />

            <HorizontalCardDeck
              count={overview?.tobe.total_words || 0}
              bgColor={colors.deck.unlearned.bg}
              borderColor={colors.deck.unlearned.border}
              onClick={() => handleSetClick(Collection.NEW)}
              words={
                overview?.tobe.preview_words.map(
                  mapWordResponseToJapaneseWord,
                ) || []
              }
              title="Новые слова"
            />

            <HorizontalCardDeck
              count={0}
              bgColor={colors.deck.add.bg}
              borderColor={colors.deck.add.border}
              onClick={() => {
                setViewMode("add-cards");
              }}
              isAddDeck={true}
              title="Добавить карточки"
            />
          </div>
        </div>
      </LayoutContainer>
    </>
  );
};
