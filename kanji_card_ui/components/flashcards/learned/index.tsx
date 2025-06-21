import React, { useState, useEffect } from "react";
import { WordRepository } from "../shared/repository";
import { JapaneseWord, CardSide } from "../shared";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { LayoutContainer } from "../../ui/LayoutContainer";
import { DefaultService, StoryResponse } from "@/api";
import { LearnedWordsToolbar } from "./LearnedWordsToolbar";
import { LearnedWordsGridMode } from "./LearnedWordsGridMode";
import { LearnedWordsTestMode } from "./LearnedWordsTestMode";
import { LearnedStoriesMode } from "./LearnedStoriesMode";
import { LoadingState } from "./LoadingState";

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
                    let learnedWords: JapaneseWord[];

                    if (viewMode === "test") {
                        learnedWords = await repository.getTestWords();
                    } else {
                        learnedWords = await repository.getLearnedWords(debouncedSearch || undefined);
                    }

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

    const renderContent = () => {
        if (loading) {
            return <LoadingState />;
        }

        if (viewMode === "stories") {
            return (
                <LearnedStoriesMode
                    stories={stories}
                    selectedStory={selectedStory}
                    onStorySelect={setSelectedStory}
                    onBackToStories={() => setSelectedStory(null)}
                />
            );
        }

        if (viewMode === "grid") {
            return (
                <LearnedWordsGridMode
                    words={words}
                    cardSides={cardSides}
                    onCardClick={handleCardClick}
                />
            );
        }

        // Test mode
        return (
            <LearnedWordsTestMode
                words={words}
                currentWordIndex={currentWordIndex}
                currentCardSide={cardSides[currentWordIndex]}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
                onCardClick={rotateCard}
            />
        );
    };

    return (
        <LayoutContainer>
            <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
                <LearnedWordsToolbar
                    viewMode={viewMode}
                    searchQuery={searchQuery}
                    onBack={onBack}
                    onViewModeChange={setViewMode}
                    onSearchChange={setSearchQuery}
                />

                {renderContent()}
            </div>
        </LayoutContainer>
    );
}