import React from "react";
import { RuleResponse } from "@/api";
import { Card, CardHeader } from "@fluentui/react-components";
import { Plus, BookOpen } from "lucide-react";
import { colors } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getPartOfSpeechLabel } from "@/lib/partOfSpeechUtils";

interface RulesGridModeProps {
  rules: RuleResponse[];
  onRuleClick: (ruleId: string) => void;
  onAddRule: () => void;
}

export const RulesGridMode = ({
  rules,
  onRuleClick,
  onAddRule,
}: RulesGridModeProps) => {


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Карточка добавления нового правила */}
      <Card
        className={cn(
          "cursor-pointer h-[200px] border-2 border-dashed transition-all duration-200",
          "hover:shadow-md hover:scale-105",
          "flex items-center justify-center",
          colors.ui.card.bg,
          colors.ui.card.border
        )}
        onClick={onAddRule}
      >
        <div className="flex flex-col items-center space-y-2">
          <Plus className={cn("h-8 w-8", colors.ui.text.secondary)} />
          <span className={cn("text-sm font-medium", colors.ui.text.secondary)}>
            Добавить правило
          </span>
        </div>
      </Card>

      {/* Карточки правил */}
      {rules.map((rule) => (
        <Card
          key={rule.id}
          className={cn(
            "cursor-pointer h-[200px] transition-all duration-200",
            "hover:shadow-md hover:scale-105",
            colors.ui.card.bg,
            colors.ui.card.border
          )}
          onClick={() => onRuleClick(rule.id)}
        >
          <CardHeader
            header={
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <BookOpen className={cn("h-5 w-5 mt-1", colors.ui.text.primary)} />
                  {rule.is_released && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      "bg-green-100 text-green-800"
                    )}>
                      Изучено
                    </span>
                  )}
                </div>
                <h3 className={cn(
                  "text-sm font-semibold line-clamp-2",
                  colors.ui.text.primary
                )}>
                  {rule.title}
                </h3>
                <p className={cn(
                  "text-xs line-clamp-3",
                  colors.ui.text.secondary
                )}>
                  {rule.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    "bg-blue-100 text-blue-800"
                  )}>
                    {getPartOfSpeechLabel(rule.part_of_speech)}
                  </span>
                </div>
              </div>
            }
          />
        </Card>
      ))}
    </div>
  );
};