import React from "react";
import { Button, ProgressBar } from "@fluentui/react-components";
import { Check, X } from "lucide-react";
import { JapaneseWord, CardSide } from "../shared";
import { Card } from "../words/Card";
import { colors } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface LearnedWordsTestModeProps {
  words: JapaneseWord[];
  currentWordIndex: number;
  currentCardSide: CardSide;
  onKnow: () => void;
  onDontKnow: () => void;
  onCardClick: () => void;
}

export const LearnedWordsTestMode = ({
  words,
  currentWordIndex,
  currentCardSide,
  onKnow,
  onDontKnow,
  onCardClick,
}: LearnedWordsTestModeProps) => {
  if (words.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[420px] ${colors.ui.text.secondary}`}>
        <p>Нет изученных слов</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className="w-[300px] h-[420px] cursor-pointer flex justify-center"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) {
            onCardClick();
          }
        }}
        onTouchStart={(e) => {
          // Предотвращаем всплытие события касания от кнопки аудио
          if ((e.target as HTMLElement).closest("button")) {
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e) => {
          // Проверяем, что касание не произошло по кнопке аудио
          if (!(e.target as HTMLElement).closest("button")) {
            onCardClick();
          }
        }}
      >
        <Card
          key={currentWordIndex}
          currentWord={words[currentWordIndex]}
          currentSide={currentCardSide}
          studyMode="jp"
        />
      </div>
      <div className="w-full max-w-[300px] space-y-2">
        <div className="flex items-center gap-2">
          <ProgressBar value={currentWordIndex / words.length} className="h-2 flex-1" />
          <span className={cn("text-sm whitespace-nowrap", colors.ui.text.secondary)}>
            {currentWordIndex + 1}/{words.length}
          </span>
        </div>
      </div>
      <div className="flex justify-center w-full space-x-4">
        <Button
          appearance="outline"
          size="large"
          onClick={onDontKnow}
          className={`${colors.ui.button.modeToggle.inactiveBg} ${colors.ui.button.modeToggle.inactiveText} hover:${colors.ui.button.modeToggle.inactiveHoverBg}`}
        >
          <X className="h-4 w-4 mr-2" />
          Не знаю
        </Button>
        <Button
          appearance="outline"
          size="large"
          onClick={onKnow}
          className={`${colors.ui.button.modeToggle.inactiveBg} ${colors.ui.button.modeToggle.inactiveText} hover:${colors.ui.button.modeToggle.inactiveHoverBg}`}
        >
          <Check className="h-4 w-4 mr-2" />
          Знаю
        </Button>
      </div>
    </div>
  );
};