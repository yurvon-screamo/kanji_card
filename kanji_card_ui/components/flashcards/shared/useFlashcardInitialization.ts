import { useEffect } from "react";
import { WordRepository } from "./repository";
import { Collection, Set, CardSet, SetList, ViewMode } from "./index";

interface UseFlashcardInitializationProps {
  searchParams: URLSearchParams;
  mounted: boolean;
  setSelectedSet: (set: CardSet | null) => void;
  setWordCollection: (collection: Collection) => void;
  setSelectedSetList: (list: SetList | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setLoading: (loading: boolean) => void;
  refreshWords: () => Promise<void>;
}

export function useFlashcardInitialization({
  searchParams,
  mounted,
  setSelectedSet,
  setWordCollection,
  setSelectedSetList,
  setViewMode,
  setLoading,
  refreshWords,
}: UseFlashcardInitializationProps) {
  useEffect(() => {
    const initializeData = async () => {
      const repository = WordRepository.getInstance();

      try {
        const typeParam = searchParams.get("type");
        const setIdParam = searchParams.get("setId");

        if (typeParam || setIdParam) {
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
                setSelectedSet({
                  type,
                  set: specificSet,
                });
                setViewMode("study");
              }
            } catch (error) {
              console.error("Error loading specific set:", error);
            }
          } else if (typeParam) {
            try {
              let sets: Set[] = [];
              switch (type) {
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
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await initializeData();
    };
    init();
  }, [searchParams, setSelectedSet, setWordCollection, setSelectedSetList, setViewMode, setLoading]);

  useEffect(() => {
    if (!mounted) return;
    refreshWords();
  }, [mounted, refreshWords]);
}