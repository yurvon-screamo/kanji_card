import React, { useState, useEffect } from "react";
import { Button } from "@fluentui/react-components";
import { Languages, Volume2 } from "lucide-react";
import { StoryResponse } from "../../../api";
import { rubyStyles, createFuriganaFromReading } from "@/lib/furigana";
import { colors } from "@/lib/theme";

interface StoryProps {
  story: StoryResponse;
  showFullControls?: boolean;
  onSentenceClick?: (index: number) => void;
  selectedSentenceIndex?: number;
}

const StoryText = React.memo(({
  originalText,
  readingText,
  className,
  showFurigana
}: {
  originalText: string;
  readingText: string;
  className?: string;
  showFurigana: boolean;
}) => {
  const displayText = showFurigana 
    ? createFuriganaFromReading(originalText, readingText)
    : originalText;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: displayText
      }}
    />
  );
});

StoryText.displayName = 'StoryText';

export const Story = ({
  story,
  showFullControls = true,
  onSentenceClick,
  selectedSentenceIndex = 0
}: StoryProps) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(selectedSentenceIndex);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sentenceTranslations, setSentenceTranslations] = useState<{ [key: number]: boolean }>({});


  // Text-to-speech functionality
  const speakText = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const speakFullStory = () => {
    if (story?.story) {
      const fullText = story.story.join('。');
      speakText(fullText);
    }
  };

  const speakSentence = (index: number) => {
    if (story && story.story[index]) {
      speakText(story.story[index]);
    }
  };

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
    if (onSentenceClick) {
      onSentenceClick(index);
    }
  };

  useEffect(() => {
    setCurrentSentenceIndex(selectedSentenceIndex);
  }, [selectedSentenceIndex]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style dangerouslySetInnerHTML={{ __html: rubyStyles }} />

      {showFullControls && (
        <div className="text-center space-y-6">
          <h2 className={`text-2xl font-bold ${colors.ui.text.default}`}>История</h2>
          <div className="flex justify-center space-x-2">
            <Button
              appearance="outline"
              onClick={speakFullStory}
              disabled={isPlaying}
              size="small"
              className="p-2"
              title="Воспроизвести всю историю"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button
              appearance={showTranslation ? "primary" : "outline"}
              onClick={() => setShowTranslation(!showTranslation)}
              size="small"
              className="p-2"
              title={showTranslation ? "Скрыть перевод всей истории" : "Показать перевод всей истории"}
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              appearance={showFurigana ? "primary" : "outline"}
              onClick={() => setShowFurigana(!showFurigana)}
              size="small"
              className="p-3"
              title={showFurigana ? "Скрыть фуригану" : "Показать фуригану"}
            >
              あ
            </Button>
          </div>
        </div>
      )}

      {/* Story Content */}
      <div className="space-y-4">
        {story.story.map((sentence, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer ${index === currentSentenceIndex
              ? `${colors.ui.border.default.replace('border-', 'border-blue-')} bg-blue-50 dark:bg-blue-900/20 shadow-lg`
              : `${colors.ui.border.default} bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md`
              }`}
            onClick={() => handleSentenceClick(index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${colors.ui.text.secondary} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded`}>
                    {index + 1}
                  </span>
                  <Button
                    appearance="subtle"
                    size="small"
                    onClick={(e: { stopPropagation: () => void; }) => {
                      e.stopPropagation();
                      speakSentence(index);
                    }}
                    disabled={isPlaying}
                    className="p-1 h-8 w-8"
                    title="Воспроизвести предложение"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  {showFullControls && (
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={(e: { stopPropagation: () => void; }) => {
                        e.stopPropagation();
                        setSentenceTranslations(prev => ({
                          ...prev,
                          [index]: !prev[index]
                        }));
                      }}
                      className="p-1 h-8 w-8"
                      title="Показать/скрыть перевод предложения"
                    >
                      <Languages className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <StoryText
                  originalText={sentence}
                  readingText={story.story_reading[index]}
                  className={`text-lg leading-relaxed ${colors.ui.text.default} font-medium`}
                  showFurigana={showFurigana}
                />
                {(showTranslation || sentenceTranslations[index]) && story.story_translate[index] && (
                  <p className={`text-base ${colors.ui.text.secondary} italic border-l-4 border-blue-200 dark:border-blue-600 pl-4`}>
                    {story.story_translate[index]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};