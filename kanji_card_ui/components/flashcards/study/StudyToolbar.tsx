import React from "react";
import { ArrowLeft, Check, Grid, BookOpen, Languages, Dice3 } from "lucide-react";
import { Button } from "@fluentui/react-components";
import { ArrowShuffle24Regular } from "@fluentui/react-icons";
import { Collection, StudyMode, ViewMode } from "../shared";
import { StoryResponse } from "@/api";
import { Toolbar } from "@/components/ui/Toolbar";

interface StudyToolbarProps {
  studyMode: StudyMode;
  collection: Collection;
  story?: StoryResponse | null;
  onViewModeChange: (mode: ViewMode) => void;
  onStudyModeChange: (mode: StudyMode) => void;
  onStartLearning: () => void;
  onMarkAsLearned: () => void;
  onWordsUpdated: () => void;
  onShuffleWords: () => void;
}

export const StudyToolbar = ({
  studyMode,
  collection,
  story,
  onViewModeChange,
  onStudyModeChange,
  onStartLearning,
  onMarkAsLearned,
  onWordsUpdated,
  onShuffleWords,
}: StudyToolbarProps) => {
  const handleStartLearning = () => {
    onStartLearning();
    onWordsUpdated();
    onViewModeChange("set-selection");
  };

  const handleMarkAsLearned = () => {
    onMarkAsLearned();
    onWordsUpdated();
    onViewModeChange("set-selection");
  };

  return (
    <Toolbar>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          appearance="outline"
          size="small"
          onClick={() => onViewModeChange("set-selection")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Наборы
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <Button
          appearance={studyMode === "grid" ? "primary" : "outline"}
          size="small"
          onClick={() => onStudyModeChange("grid")}
          className="text-xs"
        >
          <Grid className="h-3 w-3" />
        </Button>
        <Button
          appearance={studyMode === "jp" ? "primary" : "outline"}
          size="small"
          onClick={() => onStudyModeChange("jp")}
          className="text-xs"
        >
          漢字
        </Button>
        <Button
          appearance={studyMode === "translate" ? "primary" : "outline"}
          size="small"
          onClick={() => onStudyModeChange("translate")}
          className="text-xs"
        >
          <Languages className="h-3 w-3" />
        </Button>
        <Button
          appearance={studyMode === "mixed" ? "primary" : "outline"}
          size="small"
          onClick={() => onStudyModeChange("mixed")}
          className="text-xs"
        >
          <Dice3 className="h-3 w-3" />
        </Button>
        {story && (
          <Button
            appearance={studyMode === "story" ? "primary" : "outline"}
            size="small"
            onClick={() => onStudyModeChange("story")}
            className="text-xs"
          >
            <BookOpen className="h-3 w-3" />
          </Button>
        )}
      </div>

      {collection === Collection.NEW && (
        <Button
          appearance="outline"
          size="small"
          onClick={handleStartLearning}
        >
          <Check className="h-4 w-4 mr-1" />
          Учить
        </Button>
      )}
      {collection === Collection.IN_PROGRESS && (
        <>

          <Button
            appearance="outline"
            size="small"
            onClick={onShuffleWords}
            className="text-xs"
            title="Перемешать слова"
          >
            <ArrowShuffle24Regular className="h-4 w-4" />
          </Button>
          <Button
            appearance="outline"
            size="small"
            onClick={handleMarkAsLearned}
          >
            <Check className="h-4 w-4 mr-1" />
            Выучено
          </Button>
        </>
      )}
    </Toolbar>
  );
};