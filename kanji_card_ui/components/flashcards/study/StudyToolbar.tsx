import React from "react";
import { ArrowLeft, Check, Grid, Languages, Dice3 } from "lucide-react";
import { Button } from "@fluentui/react-components";
import { ArrowShuffle24Regular } from "@fluentui/react-icons";
import { StudyMode, ViewMode } from "../shared";
import { Toolbar } from "@/components/ui/Toolbar";

interface StudyToolbarProps {
  studyMode: StudyMode;
  onViewModeChange: (mode: ViewMode) => void;
  onStudyModeChange: (mode: StudyMode) => void;
  onToNextLearnIter: () => void;
  onWordsUpdated: () => void;
  onShuffleWords: () => void;
}

export const StudyToolbar = ({
  studyMode,
  onViewModeChange,
  onStudyModeChange,
  onToNextLearnIter,
  onWordsUpdated,
  onShuffleWords,
}: StudyToolbarProps) => {
  const handleToNextLearnIter = () => {
    onToNextLearnIter();
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

      </div>


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
        onClick={handleToNextLearnIter}
      >
        <Check className="h-4 w-4 mr-1" />
        Выучил
      </Button>
    </Toolbar>
  );
};