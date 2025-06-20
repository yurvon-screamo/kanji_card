import React from "react";
import { Input, Button } from "@fluentui/react-components";
import { ArrowLeft, Eye, BookOpen, GraduationCap } from "lucide-react";
import { Toolbar } from "../../ui/Toolbar";

type ViewMode = "grid" | "test" | "stories";

interface LearnedWordsToolbarProps {
  viewMode: ViewMode;
  searchQuery: string;
  onBack: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSearchChange: (query: string) => void;
}

export const LearnedWordsToolbar = ({
  viewMode,
  searchQuery,
  onBack,
  onViewModeChange,
  onSearchChange,
}: LearnedWordsToolbarProps) => {
  return (
    <Toolbar>
      <div className="flex items-center justify-between w-full">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button appearance="subtle" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
          className="pr-10"
        >

          <Button
            appearance={viewMode === "grid" ? "primary" : "outline"}
            size="small"
            onClick={() => onViewModeChange("grid")}
            className="text-xs"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            appearance={viewMode === "test" ? "primary" : "outline"}
            size="small"
            onClick={() => onViewModeChange("test")}
            className="text-xs"
          >
            <GraduationCap className="h-3 w-3" />
          </Button>
          <Button
            appearance={viewMode === "stories" ? "primary" : "outline"}
            size="small"
            onClick={() => onViewModeChange("stories")}
            className="text-xs "
          >
            <BookOpen className="h-3 w-3" />
          </Button>

          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </Toolbar >
  );
};