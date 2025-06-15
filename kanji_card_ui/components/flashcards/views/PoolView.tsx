import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutContainer } from "../components/LayoutContainer";
import { HorizontalCardDeck } from "../components/HorizontalCardDeck";
import { WordRepository } from "../data/repository";
import {
  ViewMode,
  SetList,
  Collection,
  JapaneseWord,
  Set,
  CardSet,
} from "../types";
import { colors } from "@/lib/colors";
import { Toolbar } from "../components/Toolbar";
import { WordOverview, WordResponse, SetState } from "../../../api";

interface PoolViewProps {
  setViewMode: (mode: ViewMode) => void;
  setSelectedSetList: (setList: SetList) => void;
  setSelectedSet: (set: CardSet) => void;
}

export const PoolView = ({
  setViewMode,
  setSelectedSetList,
  setSelectedSet,
}: PoolViewProps) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<WordOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      const repository = WordRepository.getInstance();
      const overviewData = await repository.getOverview();
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

  const handleSetClick = async (collection: Collection) => {
    try {
      const repository = WordRepository.getInstance();
      let sets: Set[] = [];

      switch (collection) {
        case Collection.LEARNED:
          const learnedWords = await repository.getLearnedWords(undefined);
          sets = [{
            id: "learned",
            words: learnedWords,
            state: Collection.LEARNED
          }];
          break;
        case Collection.IN_PROGRESS:
          sets = await repository.getInProgressSets();
          break;
        case Collection.NEW:
          sets = await repository.getUnlearnedSets();
          break;
      }

      setSelectedSetList({
        type: collection,
        sets: sets,
      });

      // Also update selectedSet to keep it in sync
      setSelectedSet({
        type: collection,
        set: null,
      });

      // Update URL with collection type
      router.push(`?type=${collection}`);

      setViewMode("set-selection");
    } catch (error) {
      console.error("Error loading sets:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      await loadOverview();
    };
    init();
  }, []);

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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
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
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadOverview();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Повторить попытку
              </button>
            </div>
          </div>
        </LayoutContainer>
      </>
    );
  }

  if (!overview) {
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
              <h2 className="text-xl font-semibold mb-2">Нет данных</h2>
              <p className="text-gray-600">Данные не загружены</p>
            </div>
          </div>
        </LayoutContainer>
      </>
    );
  }

  return (
    <>
      <Toolbar>
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">日本語</h1>
        </div>
      </Toolbar>
      <LayoutContainer>
        <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4 pt-20">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
            <HorizontalCardDeck
              count={overview?.finished.total_words || 0}
              bgColor={colors.deck.learned.bg}
              borderColor={colors.deck.learned.border}
              onClick={() => handleSetClick(Collection.LEARNED)}
              words={
                overview?.finished.preview_words.map(
                  mapWordResponseToJapaneseWord,
                ) || []
              }
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
            />

            <HorizontalCardDeck
              count={0}
              bgColor={colors.deck.add.bg}
              borderColor={colors.deck.add.border}
              onClick={() => {
                setViewMode("add-cards");
              }}
              isAddDeck={true}
            />
          </div>
        </div>
      </LayoutContainer>
    </>
  );
};
