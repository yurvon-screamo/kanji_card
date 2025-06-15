import React, { useCallback, useEffect, useState } from "react";
import { CardSide } from "./CardSide";
import { CardSide as CardSideType, JapaneseWord } from "../types";
import { getCardColors } from "@/lib/colors";

interface CardProps {
  currentWord: JapaneseWord;
  currentSide: CardSideType;
  studyMode: "jp" | "translate" | "mixed" | "grid";
}

interface CardData {
  primary: string;
  bgColor: string;
  borderColor: string;
  color: string;
  hintColor: string;
  textSize: string;
  gradientBgColor: string;
  onPlayAudio?: () => void;
}

export const Card = ({ currentWord, currentSide, studyMode }: CardProps) => {
  const [japaneseVoice, setJapaneseVoice] =
    useState<SpeechSynthesisVoice | null>(null);

  const getAdaptiveTextSize = (
    text: string,
    type: "kanji" | "hiragana" | "translation",
  ): string => {
    const length = text.length;

    if (type === "kanji") {
      if (length <= 2) return "text-3xl";
      if (length <= 4) return "text-2xl";
      if (length <= 6) return "text-xl";
      if (length <= 8) return "text-lg";
      return "text-sm";
    }

    if (type === "hiragana") {
      if (length <= 3) return "text-3xl";
      if (length <= 6) return "text-xl";
      if (length <= 10) return "text-lg";
      return "text-sm";
    }

    // translation
    if (length <= 10) return "text-2xl";
    if (length <= 20) return "text-xl";
    if (length <= 30) return "text-lg";
    return "text-base";
  };

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const japaneseVoice =
        voices.find(
          (voice) => voice.lang === "ja-JP" && voice.name.includes("Google"),
        ) || voices.find((voice) => voice.lang === "ja-JP");
      setJapaneseVoice(japaneseVoice || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const playAudio = useCallback(() => {
    if (!japaneseVoice || !currentWord) return;

    const utterance = new SpeechSynthesisUtterance(currentWord.reading);
    utterance.voice = japaneseVoice;
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [currentWord, japaneseVoice]);

  if (!currentWord) {
    return null;
  }

  const isTwoSided = currentWord.word === currentWord.reading;

  const kanjiCardData: CardData = {
    primary: currentWord.word,
    ...getCardColors("kanji"),
    textSize: getAdaptiveTextSize(currentWord.word, "kanji"),
    onPlayAudio: isTwoSided ? playAudio : undefined,
  };

  const hiraganaCardData: CardData = {
    primary: currentWord.reading,
    ...getCardColors("hiragana"),
    textSize: getAdaptiveTextSize(currentWord.reading, "hiragana"),
    onPlayAudio: playAudio,
  };

  const translationCardData: CardData = {
    primary: currentWord.meaning,
    ...getCardColors("translation"),
    textSize: getAdaptiveTextSize(currentWord.meaning, "translation"),
  };

  const getMainCardData = () => {
    switch (studyMode) {
      case "jp":
        return kanjiCardData;
      case "translate":
        return translationCardData;
      case "mixed":
        return Math.random() > 0.5 ? translationCardData : kanjiCardData;
      case "grid":
        return kanjiCardData;
      default:
        return kanjiCardData;
    }
  };

  const mainCardContent = getMainCardData();
  const nextCardContent =
    mainCardContent === kanjiCardData ? hiraganaCardData : kanjiCardData;
  const otherCardContent =
    mainCardContent === kanjiCardData ? translationCardData : hiraganaCardData;

  const cardSides = isTwoSided
    ? [mainCardContent, otherCardContent]
    : [mainCardContent, nextCardContent, otherCardContent];

  const hintText = "Нажмите для поворота";

  if (studyMode === "grid") {
    return (
      <div className="relative w-full h-full">
        <div className="relative w-full h-full">
          {cardSides.map((sideData, index) => (
            <CardSide
              key={index}
              {...sideData}
              hintText={hintText}
              transformStyle=""
              positioningStyle={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: currentSide === index ? 1 : 0,
                transition: "opacity 0.2s ease-in-out",
                pointerEvents: currentSide === index ? "auto" : "none",
              }}
            />
          ))}
        </div>
      </div>
    );
  } else {
    const getRotationAngle = () => {
      const anglePerSide = isTwoSided ? 180 : 120;
      return currentSide * -anglePerSide;
    };

    return (
      <div
        className="relative transition-transform duration-1400 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(-10deg) rotateY(${getRotationAngle()}deg)`,
          width: "200px",
          height: "280px",
        }}
      >
        {cardSides.map((sideData, index) => {
          const angle = isTwoSided ? index * 180 : index * 120;

          return (
            <CardSide
              key={index}
              {...sideData}
              hintText={hintText}
              transformStyle={`rotateY(${angle}deg) translateZ(174px)`}
            />
          );
        })}

        {cardSides.map((_, index) => {
          let nextIndex = index - 1;
          if (nextIndex < 0) {
            nextIndex = cardSides.length - 1;
          }

          const angle = isTwoSided
            ? (index * 180 + 60) % 360
            : (index * 120 + 60) % 360;

          return (
            <div
              key={`bg-${index}`}
              className={`absolute ${cardSides[nextIndex].gradientBgColor} shadow-inner`}
              style={{
                width: "174px",
                height: "280px",
                backfaceVisibility: "hidden",
                transform: `rotateY(${angle}deg) translateZ(-87px)`,
                opacity: 0.7,
              }}
            />
          );
        })}
      </div>
    );
  }
};
