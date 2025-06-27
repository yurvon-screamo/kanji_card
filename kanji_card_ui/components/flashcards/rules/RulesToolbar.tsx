import React from "react";
import { Input, Button } from "@fluentui/react-components";
import { ArrowLeft, Plus } from "lucide-react";
import { Toolbar } from "../../ui/Toolbar";

type ViewMode = "grid" | "detail" | "test" | "add";

interface RulesToolbarProps {
  viewMode: ViewMode;
  searchQuery: string;
  onBack: () => void;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
}

export const RulesToolbar = ({
  viewMode,
  searchQuery,
  onBack,
  onSearchChange,
  showSearch,
}: RulesToolbarProps) => {
  const getTitle = () => {
    switch (viewMode) {
      case "grid":
        return "Правила";
      case "detail":
        return "Детали правила";
      case "test":
        return "Тест";
      case "add":
        return "Добавить правило";
      default:
        return "Правила";
    }
  };

  return (
    <Toolbar>
      <div className="flex items-center justify-between w-full">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button appearance="subtle" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <h2 className="text-lg font-semibold">{getTitle()}</h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {showSearch && (
            <>
              <Input
                type="text"
                placeholder="Поиск правил..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </>
          )}
        </div>
      </div>
    </Toolbar>
  );
};