import { useState, useEffect } from "react";
import { JapaneseWord } from "../../shared";
import { colors } from "@/lib/theme";

interface CardFanProps {
  words: JapaneseWord[];
  onClick: () => void;
  bgColor?: string;
  borderColor?: string;
  delay?: number;
}

export const CardFan = ({
  words,
  onClick,
  bgColor = colors.ui.background.main,
  borderColor = colors.ui.border.default,
  delay = 0,
}: CardFanProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="group cursor-pointer"
        style={{
          width: "160px",
          height: "192px",
          animationDelay: `${delay}ms`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 160,
        height: 192,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="relative cursor-pointer group"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {words.slice(0, Math.min(words.length, 5)).map((word, index) => {
          const totalCards = Math.min(words.length, 5);
          const fanRotation = isHovered
            ? (index - Math.floor(totalCards / 2)) * 15
            : (index - Math.floor(totalCards / 2)) * 8;
          const fanTranslateX = isHovered
            ? index * 15 - (totalCards - 1) * 7.5
            : index * 8 - (totalCards - 1) * 4;
          const fanTranslateY = isHovered
            ? Math.abs(index - Math.floor(totalCards / 2)) * 8
            : Math.abs(index - Math.floor(totalCards / 2)) * 4;
          const hoverLift = isHovered ? -8 : 0;
          const scale = isHovered ? 1.05 : 1;

          return (
            <div
              key={`fan-${index}`}
              className="absolute rounded-lg border-2 shadow-xl transition-all duration-500 ease-out"
              style={{
                width: 128,
                height: 160,
                backgroundColor: bgColor,
                borderColor: borderColor,
                transform: `
                  translateX(${fanTranslateX}px)
                  translateY(${fanTranslateY + hoverLift}px)
                  rotateX(2deg)
                  rotateZ(${fanRotation}deg)
                  scale(${scale})
                `,
                zIndex: 50 + index,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                <div
                  className="text-2xl font-normal mb-1"
                  style={{ color: colors.ui.text.slate }}
                >
                  {word.word}
                </div>
                <div 
                  className="text-sm mb-1"
                  style={{ color: colors.ui.text.blue }}
                >
                  {word.reading}
                </div>
                <div
                  className="text-xs text-center px-1 leading-tight"
                  style={{ color: colors.ui.text.slate }}
                >
                  {word.meaning}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};