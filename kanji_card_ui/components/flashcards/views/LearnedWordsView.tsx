import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { WordRepository } from "../data/repository";
import { JapaneseWord, CardSide } from "../types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Card } from "../components/Card";
import { Story } from "../components/Story";
import { ArrowLeft, Search, Eye, Check, X, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LayoutContainer } from "../components/LayoutContainer";
import { Toolbar } from "../components/Toolbar";
import { colors } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { DefaultService, StoryResponse } from "@/api";

type ViewMode = "grid" | "test" | "stories";

interface LearnedWordsViewProps {
    onBack: () => void;
}

export function LearnedWordsView({ onBack }: LearnedWordsViewProps) {
    const [words, setWords] = useState<JapaneseWord[]>([]);
    const [stories, setStories] = useState<StoryResponse[]>([]);
    const [selectedStory, setSelectedStory] = useState<StoryResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [cardSides, setCardSides] = useState<CardSide[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                if (viewMode === "stories") {
                    // Загружаем истории
                    const storiesData = await DefaultService.listReleasedStories(debouncedSearch || undefined);
                    setStories(storiesData);
                } else {
                    // Загружаем слова
                    const repository = WordRepository.getInstance();
                    const learnedWords = await repository.getLearnedWords(debouncedSearch || undefined);
                    setWords(learnedWords);
                    setCardSides(Array(learnedWords.length).fill(0 as CardSide));
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [debouncedSearch, viewMode]);

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
        const nextIndex = (currentWordIndex + 1) % words.length;
        setCardSides(prevSides => {
            const newSides = [...prevSides];
            newSides[nextIndex] = 0;
            return newSides;
        });
        setCurrentWordIndex(nextIndex);
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
                                    className="text-xs"
                                >
                                    <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant={viewMode === "test" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("test")}
                                    className="text-xs"
                                >
                                    <GraduationCap className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant={viewMode === "stories" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode("stories")}
                                    className="text-xs"
                                >
                                    <BookOpen className="h-3 w-3" />
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
                ) : selectedStory ? (
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedStory(null)}
                            className="mb-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Назад к историям
                        </Button>
                        <Story story={selectedStory} showFullControls={true} />
                    </div>
                ) : viewMode === "stories" ? (
                    stories.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center min-h-[420px] ${colors.ui.text.secondary}`}>
                            <p>Нет доступных историй</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map((story) => (
                                <div
                                    key={story.id}
                                    className={`${colors.card.translation.bg} rounded-lg border-2 ${colors.ui.border.default} hover:${colors.ui.border.default} hover:shadow-md transition-all duration-300 cursor-pointer p-6`}
                                    onClick={() => setSelectedStory(story)}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-lg font-semibold ${colors.ui.text.default}`}>
                                                {story.story[0]?.split(' ').slice(0, 4).join(' ') || `История`}
                                            </h3>
                                            <BookOpen className={`h-5 w-5 ${colors.ui.icon.default}`} />
                                        </div>
                                        <div className="space-y-2">
                                            {story.story_translate[0] && (
                                                <p className={`text-sm ${colors.ui.text.secondary} italic line-clamp-2`}>
                                                    {story.story_translate[0]}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`flex items-center justify-between text-sm ${colors.ui.text.secondary}`}>
                                            <span>{story.story.length} предложений</span>
                                            <span className={`${colors.ui.text.primary} hover:${colors.ui.text.default}`}>Читать →</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                    <div className={`flex flex-col items-center justify-center min-h-[420px] ${colors.ui.text.secondary}`}>
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
                                key={currentWordIndex}
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