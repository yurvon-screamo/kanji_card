import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { WordRepository } from "../data/repository";
import { JapaneseWord, CardSide } from "../types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Card } from "../components/Card";

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
            newSides[index] = ((newSides[index] + 1) % 3) as CardSide;
            return newSides;
        });
    };

    return (
        <div className="container mx-auto p-4">
            <div className="mb-6">
                <Input
                    type="text"
                    placeholder="Поиск по словам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>

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
    );
} 