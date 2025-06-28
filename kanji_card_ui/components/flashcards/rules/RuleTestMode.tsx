import React, { useState } from "react";
import { RuleTestResponse } from "@/api";
import { Button, Card, CardHeader, ProgressBar } from "@fluentui/react-components";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { colors } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface RuleTestModeProps {
  tests: RuleTestResponse[];
  onComplete: () => void;
}

interface TestResult {
  testId: string;
  isCorrect: boolean;
  userAnswer: string;
}

export const RuleTestMode = ({
  tests,
  onComplete,
}: RuleTestModeProps) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentTest = tests[currentTestIndex];
  const progress = ((currentTestIndex + (showResult ? 1 : 0)) / tests.length) * 100;

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    // Сравниваем с правильным ответом
    const correct = userAnswer.trim().toLowerCase() === currentTest.answer.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);

    const result: TestResult = {
      testId: currentTest.id,
      isCorrect: correct,
      userAnswer: userAnswer.trim(),
    };

    setResults(prev => [...prev, result]);
  };

  const handleNext = () => {
    if (currentTestIndex < tests.length - 1) {
      setCurrentTestIndex(prev => prev + 1);
      setUserAnswer("");
      setShowResult(false);
      setShowCorrectAnswer(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentTestIndex(0);
    setUserAnswer("");
    setShowResult(false);
    setShowCorrectAnswer(false);
    setResults([]);
    setIsCompleted(false);
  };

  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalAnswers = results.length;

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
          <CardHeader
            header={
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  {correctAnswers === totalAnswers ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <XCircle className="h-16 w-16 text-orange-500" />
                  )}
                </div>
                <h2 className={cn("text-2xl font-bold", colors.ui.text.primary)}>
                  Тест завершен!
                </h2>
                <p className={cn("text-lg", colors.ui.text.secondary)}>
                  Правильных ответов: {correctAnswers} из {totalAnswers}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    appearance="secondary"
                    onClick={handleRestart}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Пройти заново
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={onComplete}
                  >
                    Завершить
                  </Button>
                </div>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Прогресс */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={colors.ui.text.secondary}>
            Вопрос {currentTestIndex + 1} из {tests.length}
          </span>
          <span className={colors.ui.text.secondary}>
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Вопрос */}
      <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
        <CardHeader
          header={
            <div className="space-y-4">
              <h2 className={cn("text-xl font-semibold", colors.ui.text.primary)}>
                {currentTest.question}
              </h2>
              {currentTest.description && (
                <p className={cn("text-base", colors.ui.text.secondary)}>
                  {currentTest.description}
                </p>
              )}
            </div>
          }
        />
      </Card>

      {/* Ответ */}
      <Card className={cn(colors.ui.card.bg, colors.ui.card.border)}>
        <CardHeader
          header={
            <div className="space-y-4">
              <label className={cn("text-lg font-medium", colors.ui.text.primary)}>
                Ваш ответ:
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !showResult && userAnswer.trim()) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Введите ваш ответ... (Enter для отправки)"
                className={cn(
                  "w-full min-w-0 p-3 border rounded-lg resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "box-border",
                  colors.ui.card.bg
                )}
                rows={4}
                disabled={showResult}
                style={{ width: '100%', maxWidth: '100%' }}
              />

              {showResult && (
                <div className="space-y-3">
                  <div className={cn(
                    "p-3 rounded-lg flex items-center space-x-2",
                    isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  )}>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={cn(
                      "font-medium",
                      isCorrect ? "text-green-800" : "text-red-800"
                    )}>
                      {isCorrect ? "Правильно!" : "Неправильно"}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="flex justify-start">
                      <Button
                        appearance="subtle"
                        onClick={() => setShowCorrectAnswer(!showCorrectAnswer)}
                      >
                        {showCorrectAnswer ? "Скрыть правильный ответ" : "Показать правильный ответ"}
                      </Button>
                    </div>
                  )}

                  {showCorrectAnswer && !isCorrect && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      "bg-blue-50 border-blue-200"
                    )}>
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-blue-800">
                          Правильный ответ:
                        </span>
                        <p className="text-blue-900">
                          {currentTest.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 w-full">
                {!showResult ? (
                  <Button
                    appearance="primary"
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                  >
                    Проверить
                  </Button>
                ) : (
                  <Button
                    appearance="primary"
                    onClick={handleNext}
                  >
                    {currentTestIndex < tests.length - 1 ? "Следующий" : "Завершить"}
                  </Button>
                )}
              </div>
            </div>
          }
        />
      </Card>
    </div>
  );
};