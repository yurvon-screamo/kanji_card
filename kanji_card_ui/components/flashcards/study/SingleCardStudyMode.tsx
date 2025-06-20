import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, ProgressBar } from "@fluentui/react-components";
import { colors } from "@/lib/theme";
import { CardSide, JapaneseWord, StudyMode } from "../shared";
import { Card } from "../words/Card";

interface SingleCardStudyModeProps {
  activeChunk: JapaneseWord[];
  currentWordIndex: number;
  currentSide: CardSide;
  studyMode: StudyMode;
  onNextWord: () => void;
  onPrevWord: () => void;
  onRotateSide: () => void;
}

export const SingleCardStudyMode = ({
  activeChunk,
  currentWordIndex,
  currentSide,
  studyMode,
  onNextWord,
  onPrevWord,
  onRotateSide,
}: SingleCardStudyModeProps) => {
  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const currentWord = activeChunk[currentWordIndex];

  // Filter studyMode to only include values accepted by Card component
  const cardStudyMode = studyMode === "story" ? "mixed" : studyMode as "jp" | "translate" | "mixed" | "grid";

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Check if it's a horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous word
        onPrevWord();
      } else {
        // Swipe left - go to next word
        onNextWord();
      }
    }

    // Reset touch coordinates
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <>
      <div
        className="flex items-center justify-between w-full space-x-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Button
          appearance="subtle"
          size="large"
          onClick={onPrevWord}
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
              onRotateSide();
            }
          }}
          onTouchStart={(e) => {
            // Сохраняем начальную позицию касания для всех событий
            const touch = e.touches[0];
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null || touchStartY.current === null) return;

            const touch = e.changedTouches[0];
            const deltaX = Math.abs(touch.clientX - touchStartX.current);
            const deltaY = Math.abs(touch.clientY - touchStartY.current);

            // Проверяем, что это не свайп (движение минимальное)
            if (deltaX < 10 && deltaY < 10) {
              // Проверяем, что касание не произошло по кнопке аудио
              if (!(e.target as HTMLElement).closest("button")) {
                onRotateSide();
              }
            }

            // Сбрасываем координаты
            touchStartX.current = null;
            touchStartY.current = null;
          }}
        >
          <Card
            key={currentWordIndex}
            currentWord={currentWord}
            currentSide={currentSide}
            studyMode={cardStudyMode}
          />
        </div>

        <Button
          appearance="subtle"
          size="large"
          onClick={onNextWord}
          className="rounded-full shadow-md"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-[300px] mx-auto mt-6 space-y-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ProgressBar value={currentWordIndex / activeChunk.length} className="h-2 flex-1" />
          <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', color: colors.ui.text.secondary }}>
            {currentWordIndex + 1}/{activeChunk.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
        {activeChunk.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentWordIndex
              ? `${colors.ui.pagination.active} scale-125`
              : `${colors.ui.pagination.inactive} ${colors.ui.pagination.hover}`
              }`}
          />
        ))}
      </div>
    </>
  );
};