import React from "react";
import { JapaneseWord, CardSide } from "../shared";
import { Card } from "../words/Card";

interface LearnedWordsGridModeProps {
  words: JapaneseWord[];
  cardSides: CardSide[];
  onCardClick: (index: number) => void;
}

export const LearnedWordsGridMode = ({
  words,
  cardSides,
  onCardClick,
}: LearnedWordsGridModeProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {words.map((word, index) => (
        <div
          key={word.id}
          className="cursor-pointer w-[150px] h-[210px]"
          onClick={() => {
            onCardClick(index);
          }}
        >
          <Card
            currentWord={word}
            currentSide={cardSides[index]}
            studyMode="grid"
          />
        </div>
      ))}
    </div>
  );
};