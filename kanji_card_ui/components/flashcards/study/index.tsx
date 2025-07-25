import React from "react";
import { LayoutContainer } from "../../ui/LayoutContainer";
import {
  CardSide,
  JapaneseWord,
  StudyMode,
  ViewMode,
} from "../shared";
import { GridStudyMode } from "./GridStudyMode";
import { SingleCardStudyMode } from "./SingleCardStudyMode";
import { StudyToolbar } from "./StudyToolbar";
import { EmptyStudyState } from "./EmptyStudyState";

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
  onToNextLearnIter: () => void;
  onShuffleWords: () => void;
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
  onToNextLearnIter,
  onShuffleWords,
}: StudyViewProps) => {
  if (activeChunk.length === 0) {
    return <EmptyStudyState onViewModeChange={setViewMode} />;
  }

  const currentWord = activeChunk[currentWordIndex];

  const getInitialSideForStudyMode = (mode: StudyMode): CardSide => {
    switch (mode) {
      case "jp":
        return 0;
      case "translate":
        return 0;
      case "mixed":
        return Math.random() > 0.5 ? 0 : 2;
      default:
        return 0;
    }
  };

  const nextWord = () => {
    const nextIndex = (currentWordIndex + 1) % activeChunk.length;
    setCurrentWordIndex(nextIndex);
    setCurrentSide(getInitialSideForStudyMode(studyMode));
  };

  const prevWord = () => {
    const prevIndex = (currentWordIndex - 1 + activeChunk.length) % activeChunk.length;
    setCurrentWordIndex(prevIndex);
    setCurrentSide(getInitialSideForStudyMode(studyMode));
  };

  const rotateSide = () => {
    const isTwoSided = !currentWord || currentWord.word === currentWord.reading || currentWord.reading === null || currentWord.reading === "";
    const maxSides = isTwoSided ? 2 : 3;
    setCurrentSide((prev: CardSide) => ((prev + 1) % maxSides) as CardSide);
  };

  const handleStudyModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setCurrentWordIndex(0);
    setCurrentSide(getInitialSideForStudyMode(mode));
  };

  const handleShuffleWords = () => {
    onShuffleWords();
    setCurrentWordIndex(0);
    setCurrentSide(getInitialSideForStudyMode(studyMode));
  };

  const renderStudyContent = () => {

    if (studyMode === "grid") {
      return <GridStudyMode activeChunk={activeChunk} />;
    }

    return (
      <SingleCardStudyMode
        activeChunk={activeChunk}
        currentWordIndex={currentWordIndex}
        currentSide={currentSide}
        studyMode={studyMode}
        onNextWord={nextWord}
        onPrevWord={prevWord}
        onRotateSide={rotateSide}
      />
    );
  };

  return (
    <LayoutContainer>
      <div className="flex justify-center">
        <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
          <StudyToolbar
            studyMode={studyMode}
            onViewModeChange={setViewMode}
            onStudyModeChange={handleStudyModeChange}
            onToNextLearnIter={onToNextLearnIter}
            onWordsUpdated={onWordsUpdated}
            onShuffleWords={handleShuffleWords}
          />

          {renderStudyContent()}
        </div>
      </div>
    </LayoutContainer>
  );
};
