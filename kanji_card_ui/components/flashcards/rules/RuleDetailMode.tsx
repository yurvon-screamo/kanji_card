import React, { useState } from 'react';
import { RuleDetailResponse, DefaultService, ReleaseRuleRequest } from "@/api";
import { Button, Card, CardHeader } from "@fluentui/react-components";
import { Play, BookOpen, Eye, EyeOff, CheckCircle, Trash2 } from "lucide-react";
import { colors } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getPartOfSpeechLabel } from "@/lib/partOfSpeechUtils";
import ReactMarkdown from "react-markdown";

interface RuleDetailModeProps {
  rule: RuleDetailResponse;
  onStartTest: () => void;
  onRuleUpdated?: (updatedRule: RuleDetailResponse) => void;
  onRuleDeleted?: () => void;
}

export const RuleDetailMode = ({
  rule,
  onStartTest,
  onRuleUpdated,
  onRuleDeleted,
}: RuleDetailModeProps) => {
  const [showTranslations, setShowTranslations] = useState<{ [key: number]: boolean }>({});
  const [isReleasing, setIsReleasing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReleaseRule = async () => {
    if (rule.is_released || isReleasing) return;

    setIsReleasing(true);
    try {
      const request: ReleaseRuleRequest = { rule_id: rule.id };
      await DefaultService.releaseRule(request);

      // Обновляем правило локально
      const updatedRule: RuleDetailResponse = {
        ...rule,
        is_released: true,
        release_time: new Date().toISOString(),
      };

      if (onRuleUpdated) {
        onRuleUpdated(updatedRule);
      }
    } catch (error) {
      console.error('Ошибка при отметке правила как изученного:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleDeleteRule = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm('Вы уверены, что хотите удалить это правило? Это действие нельзя отменить.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await DefaultService.removeRule(rule.id);

      if (onRuleDeleted) {
        onRuleDeleted();
      }
    } catch (error) {
      console.error('Ошибка при удалении правила:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Заголовок правила */}
      <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
        <CardHeader
          header={
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className={cn("h-6 w-6", colors.ui.text.primary)} />
                  <h1 className={cn("text-2xl font-bold", colors.ui.text.primary)}>
                    {rule.title}
                  </h1>
                </div>
                {rule.is_released && (
                  <span className={cn(
                    "px-3 py-1 text-sm rounded-full",
                    "bg-green-100 text-green-800"
                  )}>
                    Изучено
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <span className={cn(
                  "px-3 py-1 text-sm rounded-full",
                  "bg-blue-100 text-blue-800"
                )}>
                  {getPartOfSpeechLabel(rule.part_of_speech)}
                </span>
                <Button
                  appearance="subtle"
                  onClick={handleDeleteRule}
                  disabled={isDeleting}
                  className={cn(
                    "px-3 py-1",
                    "text-red-600 hover:text-red-700 hover:bg-red-50"
                  )}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Удаляю..." : "Удалить"}
                </Button>
                {!rule.is_released && (
                  <Button
                    className={cn(
                      "px-3 py-1",
                      "text-green-600 hover:text-green-700 hover:bg-green-50"
                    )}
                    appearance="subtle"
                    onClick={handleReleaseRule}
                    disabled={isReleasing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isReleasing ? "Отмечаю..." : "Выучено"}
                  </Button>
                )}
                {rule.tests.length > 0 && (
                  <Button
                    className="px-3 py-1"
                    appearance="primary"
                    onClick={onStartTest}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Начать тест ({rule.tests.length})
                  </Button>
                )}
              </div>
            </div>
          }
        />
      </Card>

      {/* Описание */}
      <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
        <CardHeader
          header={
            <div className="space-y-3">
              <h2 className={cn("text-lg font-semibold", colors.ui.text.primary)}>
                Конспект
              </h2>
              <div className={cn("text-base leading-relaxed prose prose-sm max-w-none", colors.ui.text.secondary)}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className={cn("text-lg font-semibold mt-4 mb-2", colors.ui.text.primary)}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className={cn("text-base font-semibold mt-3 mb-2", colors.ui.text.primary)}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className={cn("mb-3 leading-relaxed", colors.ui.text.secondary)}>
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className={cn("list-disc list-inside mb-3 space-y-1", colors.ui.text.secondary)}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className={cn("list-decimal list-inside mb-3 space-y-1", colors.ui.text.secondary)}>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className={cn("leading-relaxed", colors.ui.text.secondary)}>
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className={cn("font-semibold", colors.ui.text.primary)}>
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className={cn("italic", colors.ui.text.secondary)}>
                        {children}
                      </em>
                    ),
                    code: ({ children }) => (
                      <code className={cn(
                        "px-1 py-0.5 rounded text-sm font-mono",
                        "bg-gray-100 text-gray-800"
                      )}>
                        {children}
                      </code>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className={cn(
                          "min-w-full border-collapse",
                          "border border-gray-300"
                        )}>
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-gray-50">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="bg-white">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="border-b border-gray-200">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className={cn(
                        "px-4 py-2 text-left font-semibold",
                        "border-r border-gray-300 last:border-r-0",
                        colors.ui.text.primary
                      )}>
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className={cn(
                        "px-4 py-2",
                        "border-r border-gray-300 last:border-r-0",
                        colors.ui.text.secondary
                      )}>
                        {children}
                      </td>
                    ),
                  }}
                >
                  {rule.description}
                </ReactMarkdown>
              </div>
            </div>
          }
        />
      </Card>

      {/* Примеры */}
      {rule.examples.length > 0 && (
        <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
          <CardHeader
            header={
              <div className="space-y-3">
                <h2 className={cn("text-lg font-semibold", colors.ui.text.primary)}>
                  Примеры
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rule.examples.map((example, index) => {
                    const isTranslationVisible = showTranslations[index] || false;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg space-y-3",
                          "bg-gray-50 border border-gray-200"
                        )}
                      >
                        {/* Заголовок примера */}
                        {example.title && (
                          <h4 className={cn("text-sm font-semibold", colors.ui.text.primary)}>
                            {example.title}
                          </h4>
                        )}

                        {/* Описание примера */}
                        {example.description && (
                          <p className={cn("text-sm", colors.ui.text.secondary)}>
                            {example.description}
                          </p>
                        )}

                        {/* Основной контент */}
                        <div className="flex items-start justify-between">
                          <p className={cn("text-base flex-1", colors.ui.text.primary)}>
                            {example.content}
                          </p>
                          <Button
                            appearance="subtle"
                            size="small"
                            onClick={() => setShowTranslations(prev => ({
                              ...prev,
                              [index]: !prev[index]
                            }))}
                            className="ml-3 flex-shrink-0"
                          >
                            {isTranslationVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Перевод */}
                        {isTranslationVisible && (
                          <div className={cn(
                            "p-3 rounded border-l-4 border-blue-400",
                            "bg-blue-50 text-blue-800"
                          )}>
                            <p className="text-sm">
                              {example.content_translation || "Перевод отсутствует"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            }
          />
        </Card>
      )}
    </div>
  );
};