import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { WordRepository } from "../data/repository";
import { JapaneseWord, CardSide } from "../types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Card } from "../components/Card";
import { ArrowLeft, Search, Eye, Check, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LayoutContainer } from "../components/LayoutContainer";
import { Toolbar } from "../components/Toolbar";
import { colors } from "@/lib/colors";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "test";

interface LearnedWordsViewProps {
    onBack: () => void;
}

export function LearnedWordsView({ onBack }: LearnedWordsViewProps) {
    const [words, setWords] = useState<JapaneseWord[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [cardSides, setCardSides] = useState<CardSide[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        const loadWords = async () => {
            try {
                setLoading(true);
                const repository = WordRepository.getInstance();
                const learnedWords = await repository.getLearnedWords(debouncedSearch || undefined);
                setWords(learnedWords);
                setCardSides(Array(learnedWords.length).fill(0 as CardSide));
            } catch (error) {
                console.error("Error loading words:", error);
            } finally {
                setLoading(false);
            }
        };

        loadWords();
    }, [debouncedSearch]);

    const handleCardClick = (index: number) => {
        setCardSides((prev) => {
            const newSides = [...prev];
            const currentWord = words[index];
            if (!currentWord.reading || currentWord.reading.trim() === '' || currentWord.reading == currentWord.word) {
                newSides[index] = (newSides[index] === 0 ? 1 : 0) as CardSide;
            } else {
                newSides[index] = ((newSides[index] + 1) % 3) as CardSide;
            }
            return newSides;
        });
    };

    const nextWord = () => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
    };

    const handleKnow = () => {
        nextWord();
    };

    const handleDontKnow = async () => {
        const currentWord = words[currentWordIndex];
        try {
            await WordRepository.getInstance().markAsTobe([currentWord.id]);
            setWords(prevWords => prevWords.filter(w => w.id !== currentWord.id));
            setCardSides(prevSides => prevSides.filter((_, i) => i !== currentWordIndex));
            if (currentWordIndex >= words.length - 1) {
                setCurrentWordIndex(0);
            }
        } catch (error) {
            console.error("Error marking word as to be learned:", error);
        }
    };

    const rotateCard = () => {
        setCardSides((prev) => {
            const newSides = [...prev];
            const currentWord = words[currentWordIndex];
            if (!currentWord.reading || currentWord.reading.trim() === '' || currentWord.reading == currentWord.word) {
                newSides[currentWordIndex] = (newSides[currentWordIndex] === 0 ? 1 : 0) as CardSide;
            } else {
                newSides[currentWordIndex] = ((newSides[currentWordIndex] + 1) % 3) as CardSide;
            }
            return newSides;
        });
    };

    return (
        <LayoutContainer>
            <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
                <Toolbar>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex space-x-2">
                            <Button variant="ghost" onClick={onBack}>
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Назад
                            </Button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className={viewMode === "grid" ? colors.ui.button.modeToggle.activeBg : colors.ui.button.modeToggle.inactiveBg}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "test" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("test")}
                                    className={viewMode === "test" ? colors.ui.button.modeToggle.activeBg : colors.ui.button.modeToggle.inactiveBg}
                                >
                                    <BookOpen className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="relative max-w-md">
                                <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colors.ui.icon.default}`} />
                                <Input
                                    type="text"
                                    placeholder="Поиск..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </Toolbar>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {words.map((word, index) => (
                            <div
                                key={word.id}
                                className="cursor-pointer w-[150px] h-[210px]"
                                onClick={(e) => {
                                    if (!(e.target as HTMLElement).closest("button")) {
                                        handleCardClick(index);
                                    }
                                }}
                            >
                                <Card
                                    currentWord={word}
                                    currentSide={cardSides[index]}
                                    studyMode="grid"
                                />
                            </div>
                        ))}
                    </div>
                ) : words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[420px] text-gray-500">
                        <p>Нет изученных слов</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4">
                        <div
                            className="w-[300px] h-[420px] cursor-pointer flex justify-center"
                            onClick={(e) => {
                                if (!(e.target as HTMLElement).closest("button")) {
                                    rotateCard();
                                }
                            }}
                        >
                            <Card
                                currentWord={words[currentWordIndex]}
                                currentSide={cardSides[currentWordIndex]}
                                studyMode="jp"
                            />
                        </div>
                        <div className="w-full max-w-[300px] space-y-2">
                            <div className="flex items-center gap-2">
                                <Progress value={(currentWordIndex / words.length) * 100} className="h-2 flex-1" />
                                <span className={cn("text-sm whitespace-nowrap", colors.ui.text.secondary)}>
                                    {currentWordIndex + 1}/{words.length}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-center w-full space-x-4">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleDontKnow}
                                className={`${colors.ui.button.modeToggle.inactiveBg} ${colors.ui.button.modeToggle.inactiveText} hover:${colors.ui.button.modeToggle.inactiveHoverBg}`}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Не знаю
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleKnow}
                                className={`${colors.ui.button.modeToggle.inactiveBg} ${colors.ui.button.modeToggle.inactiveText} hover:${colors.ui.button.modeToggle.inactiveHoverBg}`}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Знаю
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </LayoutContainer>
    );
} 