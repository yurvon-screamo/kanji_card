import { useState } from "react";
import { WordRepository } from "../../data/repository";
import { colors } from "@/lib/colors";
import { Trash2, Plus } from "lucide-react";
import { ExtractedWord } from "@/api";

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className={`text-lg font-medium ${colors.ui.text.default}`}>
                    Редактирование слов
                </h3>
                <button
                    onClick={handleAddWord}
                    className="flex items-center px-3 py-1.5 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить слово
                </button>
            </div>

            <div className="space-y-4">
                {words.map((word, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg border ${colors.ui.border.default} space-y-3`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label
                                        className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}
                                    >
                                        Кандзи
                                    </label>
                                    <input
                                        type="text"
                                        value={word.word}
                                        onChange={(e) =>
                                            handleWordChange(index, "word", e.target.value)
                                        }
                                        className={`w-full px-3 py-2 border ${colors.ui.border.default} rounded-md`}
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}
                                    >
                                        Чтение
                                    </label>
                                    <input
                                        type="text"
                                        value={word.reading || ""}
                                        onChange={(e) =>
                                            handleWordChange(index, "reading", e.target.value)
                                        }
                                        className={`w-full px-3 py-2 border ${colors.ui.border.default} rounded-md`}
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}
                                    >
                                        Перевод
                                    </label>
                                    <input
                                        type="text"
                                        value={word.translation}
                                        onChange={(e) =>
                                            handleWordChange(index, "translation", e.target.value)
                                        }
                                        className={`w-full px-3 py-2 border ${colors.ui.border.default} rounded-md`}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteWord(index)}
                                className="ml-4 p-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading || words.length === 0}
                    className={`px-4 py-2 rounded-md ${loading || words.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : `${colors.ui.button.primary.bg} ${colors.ui.button.primary.hoverBg}`
                        } ${colors.ui.button.primary.text}`}
                >
                    {loading ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Сохранение...
                        </div>
                    ) : (
                        "Сохранить"
                    )}
                </button>
            </div>
        </div>
    );
}; 