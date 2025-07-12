'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFlashcardState } from '@/components/flashcards/shared/useFlashcardState';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Collection } from '@/components/flashcards/shared';
import Link from 'next/link';
import { StudyView } from '@/components/flashcards/study';

function StudyPageContent() {
  const {
    currentWordIndex,
    currentSide,
    studyMode,
    selectedSet,
    setSelectedSet,
    setCurrentWordIndex,
    setCurrentSide,
    setStudyMode,
    handleToNextLearnIter,
    handleWordsUpdated,
    handleShuffleWords,
  } = useFlashcardState();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Initialize from URL params if needed
    const setId = searchParams.get('setId');
    const collection = searchParams.get('collection') as Collection;

    console.log(setId);
    console.log(collection);
    console.log(selectedSet);
    if (setId && collection && !selectedSet) {
      // Load the specific set for study
      const loadSetForStudy = async () => {
        try {
          const { WordRepository } = await import('@/components/flashcards/shared/repository');
          const repository = WordRepository.getInstance();
          let set;

          switch (collection) {
            case Collection.IN_PROGRESS:
              const inProgressSets = await repository.getInProgressSets();
              set = inProgressSets.needToLearn.find(s => s.id === setId) ||
                inProgressSets.toFeature.find(s => s.id === setId);
              break;
            case Collection.NEW:
              const unlearnedSets = await repository.getUnlearnedSets();
              set = unlearnedSets.find(s => s.id === setId);
              break;
          }

          if (set) {
            // Set the selected set in the state
            const cardSet = {
              type: collection,
              set: set
            };
            setSelectedSet(cardSet);
          }
        } catch (error) {
          console.error("Error loading set for study:", error);
        }
      };

      loadSetForStudy();
    }
  }, [searchParams, selectedSet, setSelectedSet]);

  if (!selectedSet || !selectedSet.set) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Набор не выбран</h2>
          <p className="text-gray-600 mb-4">Выберите набор для изучения</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Вернуться к выбору наборов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StudyView
      activeChunk={selectedSet.set.words || []}
      currentWordIndex={currentWordIndex}
      currentSide={currentSide}
      studyMode={studyMode}
      setViewMode={() => {
        const params = new URLSearchParams();
        params.set('collection', selectedSet.type);
        router.push(`/sets?${params.toString()}`);
      }}
      setCurrentWordIndex={setCurrentWordIndex}
      setCurrentSide={setCurrentSide}
      setStudyMode={setStudyMode}
      onWordsUpdated={handleWordsUpdated}
      onToNextLearnIter={handleToNextLearnIter}
      onShuffleWords={handleShuffleWords}
    />
  );
}

export default function StudyPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <StudyPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}