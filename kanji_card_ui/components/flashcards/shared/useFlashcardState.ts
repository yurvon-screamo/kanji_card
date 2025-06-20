import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WordRepository } from "./repository";
import {
  Collection,
  CardSet,
  SetList,
  ViewMode,
  CardSide,
  StudyMode,
} from "./index";

type WordCollection = Collection;

export function useFlashcardState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("pool");
  const [wordCollection, setWordCollection] = useState<WordCollection>(
    Collection.IN_PROGRESS,
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSide, setCurrentSide] = useState<CardSide>(0);
  const [studyMode, setStudyMode] = useState<StudyMode>("grid");
  const [selectedSet, setSelectedSet] = useState<CardSet | null>(null);
  const [selectedSetList, setSelectedSetList] = useState<SetList | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartLearning = async () => {
    if (!selectedSet?.set) return;

    setLoading(true);
    try {
      const repository = WordRepository.getInstance();
      await repository.moveToInProgress(selectedSet.set.id);
      setWordCollection(Collection.IN_PROGRESS);
      setViewMode("set-selection");
      await refreshWords();
    } catch (error) {
      console.error("Error starting learning:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsLearned = async () => {
    if (!selectedSet?.set) return;

    setLoading(true);
    try {
      const repository = WordRepository.getInstance();
      await repository.markAsFinished(selectedSet.set.id);
      setWordCollection(Collection.IN_PROGRESS);
      setViewMode("set-selection");
      await refreshWords();
    } catch (error) {
      console.error("Error marking as learned:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = useCallback(
    (type: Collection, setId?: string) => {
      const params = new URLSearchParams();
      params.set("type", type);

      if (setId) {
        params.set("setId", setId);
      }

      router.push(`?${params.toString()}`);
    },
    [router],
  );

  const refreshWords = useCallback(async () => {
    if (!mounted) return;

    try {
      if (!selectedSet) {
        setSelectedSet({
          type: wordCollection,
          set: null,
        });
      }
    } catch (error) {
      console.error("Error refreshing words:", error);
    }
  }, [mounted, wordCollection, selectedSet]);

  const handleWordsUpdated = async () => {
    await refreshWords();
  };

  const resetToPool = () => {
    setViewMode("pool");
    router.push("/");
    setSelectedSet(null);
    setSelectedSetList(null);
    setCurrentWordIndex(0);
    setCurrentSide(0);
  };

  return {
    // State
    viewMode,
    wordCollection,
    currentWordIndex,
    currentSide,
    studyMode,
    selectedSet,
    selectedSetList,
    mounted,
    loading,
    searchParams,

    // Setters
    setViewMode,
    setWordCollection,
    setCurrentWordIndex,
    setCurrentSide,
    setStudyMode,
    setSelectedSet,
    setSelectedSetList,
    setLoading,

    // Actions
    handleStartLearning,
    handleMarkAsLearned,
    updateUrlParams,
    refreshWords,
    handleWordsUpdated,
    resetToPool,
  };
}