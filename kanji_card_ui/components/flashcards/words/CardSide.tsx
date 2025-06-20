import React from "react";
import { Volume2 } from "lucide-react";
import { getAudioButtonHoverColor } from "@/lib/theme";
import { Button } from "@fluentui/react-components";

interface CardSideProps {
  primary: string;
  bgColor: string;
  borderColor: string;
  color: string;
  hintColor: string;
  textSize: string;
  hintText: string;
  transformStyle: string;
  positioningStyle?: React.CSSProperties;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export const CardSide = ({
  primary,
  bgColor,
  borderColor,
  color: primaryColor,
  hintColor,
  textSize: primaryTextSize,
  hintText,
  transformStyle,
  positioningStyle,
  onPlayAudio,
  isPlaying = false,
}: CardSideProps) => {
  return (
    <div
      className={`absolute flex flex-col items-center justify-center ${bgColor} border-2 ${borderColor} shadow-2xl rounded-lg w-full h-full`}
      style={{
        backfaceVisibility: "hidden",
        transform: transformStyle,
        ...positioningStyle,
      }}
    >
      {onPlayAudio && (
        <Button
          appearance="subtle"
          size="small"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onPlayAudio();
          }}
          disabled={isPlaying}
          className={`mb-4 rounded-full ${hintColor} ${getAudioButtonHoverColor()} transition-colors touch-manipulation`}
          style={{
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation'
          }}
          aria-label="Воспроизвести произношение"
        >
          <Volume2 className="w-5 h-5" />
        </Button>
      )}
      <div
        className={`${primaryTextSize} font-normal ${primaryColor} mb-6 select-none text-center px-4`}
      >
        {primary}
      </div>
      <div className={`text-xs ${hintColor} text-center px-4`}>{hintText}</div>
    </div>
  );
};