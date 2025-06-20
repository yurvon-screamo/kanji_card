import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "@fluentui/react-components";
import { colors } from "@/lib/theme";
import { ViewMode } from "../shared";
import { LayoutContainer } from "@/components/ui/LayoutContainer";
import { Toolbar } from "@/components/ui/Toolbar";

interface EmptyStudyStateProps {
  onViewModeChange: (mode: ViewMode) => void;
}

export const EmptyStudyState = ({ onViewModeChange }: EmptyStudyStateProps) => {
  return (
    <LayoutContainer>
      <Toolbar>
        <div className="flex items-center space-x-4">
          <Button
            appearance="subtle"
            onClick={() => onViewModeChange("set-selection")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
        </div>
      </Toolbar>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Нет слов для изучения
          </h2>
          <p className={colors.ui.text.secondary}>
            Выберите другой набор или добавьте новые слова
          </p>
        </div>
      </div>
    </LayoutContainer>
  );
};