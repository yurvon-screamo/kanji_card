import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { JapaneseWord } from "../types";
import { colors } from "@/lib/colors";
import { CardFan } from "./CardFan";

interface HorizontalCardDeckProps {
  count: number;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  isAddDeck?: boolean;
  words?: JapaneseWord[];
}

export const HorizontalCardDeck = ({
  count,
  bgColor,
  borderColor,
  onClick,
  isAddDeck = false,
  words = [],
}: HorizontalCardDeckProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="group cursor-pointer p-6"
        style={{
          width: "300px",
          height: "200px",
        }}
      />
    );
  }

  // If we have words, use the CardFan component
  if (!isAddDeck && words.length > 0) {
    return (
      <div className="group cursor-pointer p-6">
        <div
          className="flex justify-center items-center"
          style={{ width: "300px", height: "200px" }}
        >
          <CardFan
            words={words}
            onClick={onClick}
            bgColor={bgColor}
            borderColor={borderColor}
          />
        </div>
      </div>
    );
  }

  // Original stacked deck logic for empty states and add deck
  return (
    <div className="group cursor-pointer p-6" onClick={onClick}>
      <div
        className="relative flex-shrink-0 mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          perspective: "1000px",
          width: "300px",
          height: "200px",
        }}
      >
        {Array.from({
          length: isAddDeck ? 3 : 4,
        }).map((_, index) => {
          const zIndex = index + 1;
          const baseOffset = index * 2;
          const hoverOffset = isHovered ? index * 3 : baseOffset;
          const isTopCard = index === (isAddDeck ? 2 : 3);

          return (
            <div
              key={`deck-${index}`}
              className={`absolute rounded-xl border-2 shadow-lg transition-all duration-700 ease-out ${
                isAddDeck
                  ? `${colors.deck.add.bg} ${colors.deck.add.border}`
                  : count === 0
                    ? `bg-gray-100 border-gray-300 animate-pulse`
                    : `${bgColor} ${borderColor}`
              }`}
              style={{
                width: "120px",
                height: "160px",
                transform: `
                 translateX(${40 + hoverOffset}px)
                 translateY(${-hoverOffset}px)
                 rotateX(2deg)
               `,
                zIndex: zIndex,
                transformStyle: "preserve-3d",
              }}
            >
              {isAddDeck && index === 2 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className={`h-8 w-8 ${colors.deck.add.text}`} />
                </div>
              )}
              {!isAddDeck && count === 0 && isTopCard && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-8 w-8 bg-gray-300 rounded mb-2 animate-pulse"></div>
                  <div className="h-8 w-12 bg-gray-300 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
