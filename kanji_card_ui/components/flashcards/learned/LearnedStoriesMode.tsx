import React from "react";
import { Button } from "@fluentui/react-components";
import { ArrowLeft, BookOpen } from "lucide-react";
import { StoryResponse } from "@/api";
import { Story } from "../words/Story";
import { colors } from "@/lib/theme";

interface LearnedStoriesModeProps {
  stories: StoryResponse[];
  selectedStory: StoryResponse | null;
  onStorySelect: (story: StoryResponse) => void;
  onBackToStories: () => void;
}

export const LearnedStoriesMode = ({
  stories,
  selectedStory,
  onStorySelect,
  onBackToStories,
}: LearnedStoriesModeProps) => {
  if (selectedStory) {
    return (
      <div className="space-y-4">
        <Button
          appearance="outline"
          onClick={onBackToStories}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к историям
        </Button>
        <Story story={selectedStory} showFullControls={true} />
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[420px] ${colors.ui.text.secondary}`}>
        <p>Нет доступных историй</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => (
        <div
          key={story.id}
          className={`${colors.card.translation.bg} rounded-lg border-2 ${colors.ui.border.default} hover:${colors.ui.border.default} hover:shadow-md transition-all duration-300 cursor-pointer p-6`}
          onClick={() => onStorySelect(story)}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${colors.ui.text.default}`}>
                {story.story[0]?.split(' ').slice(0, 4).join(' ') || `История`}
              </h3>
              <BookOpen className={`h-5 w-5 ${colors.ui.icon.default}`} />
            </div>
            <div className="space-y-2">
              {story.story_translate[0] && (
                <p className={`text-sm ${colors.ui.text.secondary} italic line-clamp-2`}>
                  {story.story_translate[0]}
                </p>
              )}
            </div>
            <div className={`flex items-center justify-between text-sm ${colors.ui.text.secondary}`}>
              <span>{story.story.length} предложений</span>
              <span className={`${colors.ui.text.primary} hover:${colors.ui.text.default}`}>Читать →</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};