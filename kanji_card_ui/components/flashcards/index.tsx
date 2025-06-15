"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WordRepository } from "./data/repository";
import { Toolbar } from "./components/Toolbar";

import { PoolView } from "./views/PoolView";
import { SetSelectionView } from "./views/SetSelectionView";
import { StudyView } from "./views/StudyView";
import { AddCardsView } from "./views/AddCardsView";
import { LearnedWordsView } from "./views/LearnedWordsView";
import {
  ViewMode,
  StudyMode,
  CardSide,
  CardSet,
  SetList,
  Collection,
  Set,
} from "./types/index";
import { SetState } from "../../api";

type WordCollection = Collection;

export default function JapaneseFlashcards() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("pool");
  const [wordCollection, setWordCollection] = useState<WordCollection>(
    Collection.LEARNED,
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSide, setCurrentSide] = useState<CardSide>(0);
  const [studyMode, setStudyMode] = useState<StudyMode>("grid");
  const [selectedSet, setSelectedSet] = useState<CardSet | null>(null);
  const [selectedSetList, setSelectedSetList] = useState<SetList | null>(null);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

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
      // Only update selectedSet if it doesn't exist or if we're explicitly changing collection
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

  useEffect(() => {
    const initializeData = async () => {
      const repository = WordRepository.getInstance();

      try {
        // Check if data exists by trying to get overview
        const overview = await repository.getOverview();
        const totalWords =
          overview.finished.total_words +
          overview.current.total_words +
          overview.tobe.total_words;

        // Handle URL parameters
        const typeParam = searchParams.get("type");
        const setIdParam = searchParams.get("setId");

        if (typeParam || setIdParam) {
          // Validate that typeParam is a valid Collection value
          const type = Object.values(Collection).includes(
            typeParam as Collection,
          )
            ? (typeParam as Collection)
            : Collection.NEW;

          setSelectedSet({
            type,
            set: null,
          });

          setWordCollection(type);

          if (setIdParam) {
            try {
              const specificSet = await repository.getSetById(setIdParam);
              if (specificSet) {
                setSelectedSet(() => ({
                  type,
                  set: specificSet,
                }));
                setViewMode("study");
              }
            } catch (error) {
              console.error("Error loading specific set:", error);
            }
          } else if (typeParam) {
            try {
              let sets: Set[] = [];
              switch (type) {
                case Collection.LEARNED:
                  const learnedWords = await repository.getLearnedWords(undefined);
                  sets = [{
                    id: "learned",
                    words: learnedWords,
                    state: Collection.LEARNED
                  }];
                  break;
                case Collection.IN_PROGRESS:
                  sets = await repository.getInProgressSets();
                  break;
                case Collection.NEW:
                  sets = await repository.getUnlearnedSets();
                  break;
              }
              setSelectedSetList({
                type: type,
                sets: sets,
              });
              setViewMode("set-selection");
            } catch (error) {
              console.error("Error loading sets for type:", error);
            }
          }
        }
        // If no URL params, stay on pool view (default)
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await initializeData();
      setMounted(true);
    };
    init();
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;
    refreshWords();
  }, [wordCollection, mounted, refreshWords]);

  // Removed automatic URL update useEffect to prevent race conditions
  // URL updates now happen only on explicit user actions in PoolView and SetSelectionView

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      )}
      {viewMode === "study" && selectedSet && selectedSet.set && (
        <StudyView
          activeChunk={selectedSet.set.words || []}
          currentWordIndex={currentWordIndex}
          currentSide={currentSide}
          studyMode={studyMode}
          setViewMode={(mode) => {
            setViewMode(mode);
            if (mode === "set-selection" || mode === "pool") {
              router.push("/");
              if (mode === "pool") {
                setSelectedSet(null);
                setSelectedSetList(null);
                setCurrentWordIndex(0);
                setCurrentSide(0);
              }
            }
          }}
          setCurrentWordIndex={setCurrentWordIndex}
          setCurrentSide={setCurrentSide}
          setStudyMode={setStudyMode}
          onWordsUpdated={handleWordsUpdated}
          collection={selectedSet.type}
          onStartLearning={handleStartLearning}
        />
      )}
      {viewMode === "set-selection" &&
        selectedSetList &&
        selectedSetList.sets &&
        selectedSetList.sets.length > 0 && (
          selectedSetList.type === Collection.LEARNED ? (
            <LearnedWordsView
              onBack={() => {
                setViewMode("pool");
                router.push("/");
                setSelectedSet(null);
                setSelectedSetList(null);
                setCurrentWordIndex(0);
                setCurrentSide(0);
                setWordCollection(Collection.LEARNED);
              }}
            />
          ) : (
            <SetSelectionView
              setViewMode={(mode) => {
                setViewMode(mode);
                if (mode === "pool") {
                  router.push("/");
                  setSelectedSet(null);
                  setSelectedSetList(null);
                  setCurrentWordIndex(0);
                  setCurrentSide(0);
                  setWordCollection(Collection.LEARNED);
                }
              }}
              setCurrentSetIndex={(index) => {
                const collections: WordCollection[] = [
                  Collection.LEARNED,
                  Collection.IN_PROGRESS,
                  Collection.NEW,
                ];
                const newCollection = collections[index];
                setWordCollection(newCollection);
              }}
              setCurrentWordIndex={setCurrentWordIndex}
              selectedSetList={selectedSetList}
              setSelectedSet={(newSet) => {
                setSelectedSet(newSet);
                setWordCollection(newSet.type);
                updateUrlParams(newSet.type, newSet.set?.id);
              }}
              setCollection={(collection) => {
                setWordCollection(collection);
                setSelectedSet((prev) =>
                  prev
                    ? {
                      ...prev,
                      type: collection,
                    }
                    : {
                      type: collection,
                      set: null,
                    },
                );
              }}
            />
          )
        )}
      {viewMode === "pool" && (
        <PoolView
          setViewMode={(mode) => {
            setViewMode(mode);
            if (mode === "pool") {
              router.push("/");
              setSelectedSet(null);
              setSelectedSetList(null);
            }
          }}
          setSelectedSetList={setSelectedSetList}
          setSelectedSet={setSelectedSet}
        />
      )}
      {viewMode === "set-selection" &&
        (!selectedSetList ||
          !selectedSetList.sets ||
          selectedSetList.sets.length === 0) && (
          <>
            <Toolbar>
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={() => setViewMode("pool")}>
                  Все карточки
                </Button>
              </div>
            </Toolbar>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Нет доступных наборов
                </h2>
                <p className="text-gray-600 mb-4">
                  В данной категории пока нет наборов для изучения
                </p>
              </div>
            </div>
          </>
        )}
      {viewMode === "add-cards" && <AddCardsView setViewMode={setViewMode} />}
    </>
  );
}
