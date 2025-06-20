import React from "react";
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
  const currentWord = activeChunk[currentWordIndex];
  const cardStudyMode = studyMode === "story" ? "mixed" : studyMode as "jp" | "translate" | "mixed" | "grid";

  return (
    <>
      <div
        className="flex items-center justify-between w-full space-x-2"
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
          onClick={() => {
            onRotateSide();
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