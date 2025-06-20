import React, { useState } from "react";
import { CardSide, JapaneseWord } from "../shared";
import { Card } from "../words/Card";

interface GridStudyModeProps {
  activeChunk: JapaneseWord[];
}

export const GridStudyMode = ({ activeChunk }: GridStudyModeProps) => {
  const [gridCardSides, setGridCardSides] = useState<CardSide[]>(() =>
    Array(activeChunk.length).fill(0 as CardSide),
  );

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {activeChunk.map((word, index) => (
        <div
          key={index}
          className="cursor-pointer w-[150px] h-[210px]"
          onClick={() => {
            handleGridCardClick(index);
          }}
        >
          <Card
            currentWord={word}
            currentSide={gridCardSides[index]}
            studyMode="grid"
          />
        </div>
      ))}
    </div>
  );
};