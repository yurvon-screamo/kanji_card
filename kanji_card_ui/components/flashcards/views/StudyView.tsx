import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Languages,
  Shuffle,
  Check,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutContainer } from "../components/LayoutContainer";
import {
  CardSide,
  JapaneseWord,
  StudyMode,
  ViewMode,
  Collection,
} from "../types";
import { Card } from "../components/Card";
import { Toolbar } from "../components/Toolbar";
import { colors } from "@/lib/colors";

interface StudyViewProps {
  activeChunk: JapaneseWord[];
  currentWordIndex: number;
  currentSide: CardSide;
  studyMode: StudyMode;
  setViewMode: (mode: ViewMode) => void;
  setCurrentWordIndex: (index: number | ((prev: number) => number)) => void;
  setCurrentSide: (side: CardSide | ((prev: CardSide) => CardSide)) => void;
  setStudyMode: (mode: StudyMode) => void;
  onWordsUpdated: () => void;
  collection: Collection;
  onStartLearning: () => void;
  onMarkAsLearned: () => void;
}

export const StudyView = ({
  activeChunk,
  currentWordIndex,
  currentSide,
  studyMode,
  setViewMode,
  setCurrentWordIndex,
  setCurrentSide,
  setStudyMode,
  onWordsUpdated,
  collection,
  onStartLearning,
  onMarkAsLearned,
}: StudyViewProps) => {
  const [gridCardSides, setGridCardSides] = useState<CardSide[]>(() =>
    Array(activeChunk.length).fill(0 as CardSide),
  );

  // Early return if no words available
  if (activeChunk.length === 0) {
    return (
      <LayoutContainer>
        <Toolbar>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setViewMode("set-selection")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
          </div>
        </Toolbar>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Нет слов для изучения
            </h2>
            <p className="text-gray-600">
              Выберите другой набор или добавьте новые слова
            </p>
          </div>
        </div>
      </LayoutContainer>
    );
  }

  const currentWord = activeChunk[currentWordIndex];

  const nextWord = () => {
    setCurrentWordIndex((prev: number) => (prev + 1) % activeChunk.length);
    setCurrentSide(0);
  };

  const prevWord = () => {
    setCurrentWordIndex(
      (prev: number) => (prev - 1 + activeChunk.length) % activeChunk.length,
    );
    setCurrentSide(0);
  };

  const rotateSide = () => {
    setCurrentSide((prev: CardSide) => ((prev + 1) % 3) as CardSide);
  };

  const handleStudyModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setCurrentWordIndex(0);
    setCurrentSide(0);
    if (mode === "grid") {
      setGridCardSides(Array(activeChunk.length).fill(0 as CardSide));
    }
  };

  const handleGridCardClick = (index: number) => {
    setGridCardSides((prev) => {
      const newSides = [...prev];
      const currentWord = activeChunk[index];
      if (!currentWord.reading || currentWord.reading.trim() === '' || currentWord.reading == currentWord.word) {
        newSides[index] = (newSides[index] === 0 ? 1 : 0) as CardSide;
      } else {
        newSides[index] = ((newSides[index] + 1) % 3) as CardSide;
      }
      return newSides;
    });
  };

  return (
    <LayoutContainer>
      <div className="flex justify-center">
        <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
          <Toolbar>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("set-selection")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Наборы
              </Button>
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                variant={studyMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStudyModeChange("grid")}
                className="text-xs"
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={studyMode === "jp" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStudyModeChange("jp")}
                className="text-xs"
              >
                漢字
              </Button>
              <Button
                variant={studyMode === "translate" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStudyModeChange("translate")}
                className="text-xs"
              >
                <Languages className="h-3 w-3" />
              </Button>
              <Button
                variant={studyMode === "mixed" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStudyModeChange("mixed")}
                className="text-xs"
              >
                <Shuffle className="h-3 w-3" />
              </Button>
            </div>
            {collection === Collection.NEW && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStartLearning();
                  onWordsUpdated();
                  setViewMode("set-selection");
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Учить
              </Button>
            )}
            {collection === Collection.IN_PROGRESS && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onMarkAsLearned();
                  onWordsUpdated();
                  setViewMode("set-selection");
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                Выучено
              </Button>
            )}
          </Toolbar>

          {studyMode === "grid" ? (
            <div className="grid grid-cols-4 gap-4">
              {activeChunk.map((word, index) => (
                <div
                  key={index}
                  className="cursor-pointer w-[150px] h-[210px]"
                  onClick={(e) => {
                    // Проверяем, что клик не произошел по кнопке аудио
                    if (!(e.target as HTMLElement).closest("button")) {
                      handleGridCardClick(index);
                    }
                  }}
                >
                  <Card
                    currentWord={word}
                    currentSide={gridCardSides[index]}
                    studyMode={studyMode}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full space-x-2">
              <Button
                variant="outline"
                size="lg"
                onClick={prevWord}
                className="rounded-full shadow-md"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div
                style={{
                  height: 320,
                  perspective: "1200px",
                }}
                onClick={(e) => {
                  // Проверяем, что клик не произошел по кнопке аудио
                  if (!(e.target as HTMLElement).closest("button")) {
                    rotateSide();
                  }
                }}
              >
                <Card
                  currentWord={currentWord}
                  currentSide={currentSide}
                  studyMode={studyMode}
                />
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={nextWord}
                className="rounded-full shadow-md"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}

          {studyMode != "grid" && (
            <div className="flex justify-center mt-8 space-x-2">
              {activeChunk.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentWordIndex ? `${colors.ui.pagination.active} scale-125` : `${colors.ui.pagination.inactive} ${colors.ui.pagination.hover}`}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutContainer>
  );
};
