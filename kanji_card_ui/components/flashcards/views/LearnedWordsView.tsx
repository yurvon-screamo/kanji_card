import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { WordRepository } from "../data/repository";
import { JapaneseWord, CardSide } from "../types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Card } from "../components/Card";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutContainer } from "../components/LayoutContainer";
import { Toolbar } from "../components/Toolbar";

interface LearnedWordsViewProps {
    onBack: () => void;
}

export function LearnedWordsView({ onBack }: LearnedWordsViewProps) {
    const [words, setWords] = useState<JapaneseWord[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [cardSides, setCardSides] = useState<CardSide[]>([]);
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
                        <div className="relative max-w-md">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </Toolbar>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
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
                )}
            </div>
        </LayoutContainer>
    );
} 