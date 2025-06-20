import React, { useState } from "react";
import { WordRepository } from "../shared/repository";
import { colors } from "@/lib/theme";
import { Trash2, Plus } from "lucide-react";
import { ExtractedWord } from "@/api";
import { Button, Input, Text, Field, Card, Spinner } from "@fluentui/react-components";

interface ExtractedWordsEditorProps {
    initialWords: ExtractedWord[];
    onSave: () => void;
    onCancel: () => void;
}

export const ExtractedWordsEditor = ({
    initialWords,
    onSave,
    onCancel,
}: ExtractedWordsEditorProps) => {
    const [words, setWords] = useState<ExtractedWord[]>(initialWords);
    const [loading, setLoading] = useState(false);

    const handleWordChange = (
        index: number,
        field: keyof ExtractedWord,
        value: string
    ) => {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], [field]: value };
        setWords(newWords);
    };

    const handleDeleteWord = (index: number) => {
        setWords(words.filter((_, i) => i !== index));
    };

    const handleAddWord = () => {
        setWords([...words, { word: "", reading: null, translation: "" }]);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const repository = WordRepository.getInstance();
            await repository.saveWords(words);
            onSave();
        } catch (error) {
            console.error("Error saving words:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size={500} weight="semibold" style={{ color: colors.ui.text.default }}>
                    Редактирование слов
                </Text>
                <Button
                    onClick={handleAddWord}
                    appearance="secondary"
                    icon={<Plus className="h-4 w-4" />}
                >
                    Добавить слово
                </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {words.map((word, index) => (
                    <Card
                        key={index}
                        style={{ padding: '1rem', borderColor: colors.ui.border.default }}
                    >
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Field label="Кандзи">
                                    <Input
                                        value={word.word}
                                        onChange={(e, data) =>
                                            handleWordChange(index, "word", data.value)
                                        }
                                    />
                                </Field>
                                <Field label="Чтение">
                                    <Input
                                        value={word.reading || ""}
                                        onChange={(e, data) =>
                                            handleWordChange(index, "reading", data.value)
                                        }
                                    />
                                </Field>
                                <Field label="Перевод">
                                    <Input
                                        value={word.translation}
                                        onChange={(e, data) =>
                                            handleWordChange(index, "translation", data.value)
                                        }
                                    />
                                </Field>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '1.5rem' }}>
                                <Button
                                    onClick={() => handleDeleteWord(index)}
                                    appearance="primary"
                                    style={{ backgroundColor: "#ef4444" }}
                                    icon={<Trash2 className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button
                    onClick={onCancel}
                    appearance="secondary"
                >
                    Отмена
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={loading || words.length === 0}
                    appearance="primary"
                >
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Spinner size="tiny" />
                            Сохранение...
                        </div>
                    ) : (
                        "Сохранить"
                    )}
                </Button>
            </div>
        </div>
    );
};