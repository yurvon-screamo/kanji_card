import React, { useState, useEffect } from "react";
import { colors } from "@/lib/theme";
import { Story } from "../words/Story";
import { StoryResponse } from "@/api";

interface StoryStudyModeProps {
  story: StoryResponse;
}

export const StoryStudyMode = ({ story }: StoryStudyModeProps) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  useEffect(() => {
    setCurrentSentenceIndex(0);
  }, [story]);

  return (
    <>
      <Story
        story={story}
        showFullControls={true}
        onSentenceClick={setCurrentSentenceIndex}
        selectedSentenceIndex={currentSentenceIndex}
      />

      <div className="flex justify-center mt-8 space-x-2">
        {story.story.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${index === currentSentenceIndex
              ? `${colors.ui.pagination.active} scale-125`
              : `${colors.ui.pagination.inactive} ${colors.ui.pagination.hover}`
              }`}
            onClick={() => setCurrentSentenceIndex(index)}
          />
        ))}
      </div>
    </>
  );
};