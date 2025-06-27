import React, { useState } from 'react';
import { Button, Input, Textarea, Card, CardHeader, ToggleButton } from '@fluentui/react-components';
import { ArrowLeft, Plus, FileText, MessageSquare } from 'lucide-react';
import { DefaultService, CreateRuleFromDescriptionRequest, CreateRuleFromTextRequest } from '@/api';
import { colors } from '@/lib/theme';
import { cn } from '@/lib/utils';

type RuleCreationMode = 'description' | 'text';

interface AddRuleFormProps {
  onBack: () => void;
  onRuleAdded: () => void;
}

export const AddRuleForm = ({ onBack, onRuleAdded }: AddRuleFormProps) => {
  const [mode, setMode] = useState<RuleCreationMode>('description');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const inputValue = mode === 'description' ? description.trim() : text.trim();
    if (!inputValue) {
      setError(mode === 'description' ? 'Пожалуйста, введите описание правила' : 'Пожалуйста, введите японский текст');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'description') {
        const request: CreateRuleFromDescriptionRequest = {
          description: description.trim()
        };
        await DefaultService.createRuleFromDescription(request);
      } else {
        const request: CreateRuleFromTextRequest = {
          text: text.trim()
        };
        await DefaultService.createRuleFromText(request);
      }

      setDescription('');
      setText('');
      onRuleAdded();
    } catch (error) {
      console.error('Error creating rule:', error);
      setError('Ошибка при создании правила. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentInputValue = () => {
    return mode === 'description' ? description : text;
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <Card className={cn("p-4", colors.ui.card.bg, colors.ui.card.border)}>
        <div className="space-y-3">
          <h3 className={cn("text-lg font-semibold", colors.ui.text.primary)}>Способ создания правила</h3>
          <div className="flex gap-3">
            <ToggleButton
              checked={mode === 'description'}
              onClick={() => setMode('description')}
              icon={<MessageSquare className="h-4 w-4" />}
              className="flex-1"
            >
              По описанию
            </ToggleButton>
            <ToggleButton
              checked={mode === 'text'}
              onClick={() => setMode('text')}
              icon={<FileText className="h-4 w-4" />}
              className="flex-1"
            >
              Из японского текста
            </ToggleButton>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className={cn("p-6", colors.ui.card.bg, colors.ui.card.border)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'description' ? (
            <div>
              <div className={cn("text-sm mb-3 p-3 rounded-md", colors.ui.card.bg)}>
                <p className={cn("text-sm", colors.ui.text.secondary)}>
                  Опишите грамматическое правило, которое вы хотите изучить. Например: "правило использования частицы は",
                  "конструкция て-формы", "вежливая форма глаголов" и т.д.
                  ИИ создаст подробное объяснение с примерами и тестами.
                </p>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание грамматического правила..."
                rows={4}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <div className={cn("text-sm mb-3 p-3 rounded-md", colors.ui.card.bg)}>
                <p className={cn("text-sm", colors.ui.text.secondary)}>
                  Введите японский текст (хирагана, катакана, кандзи), содержащий грамматическую конструкцию.
                  ИИ проанализирует текст, определит основное грамматическое правило и создаст подробное объяснение
                  с примерами и тестами.
                </p>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите японский текст для анализа..."
                rows={4}
                className="w-full"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="submit"
              appearance="primary"
              icon={<Plus className="h-4 w-4" />}
              disabled={isLoading || !getCurrentInputValue().trim()}
            >
              {isLoading ? 'Создание...' : 'Создать правило'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};