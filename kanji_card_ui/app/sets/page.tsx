'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SetSelectionView } from '@/components/flashcards/pool/SetSelectionView';
import { EmptySetView } from '@/components/flashcards/pool/components/EmptySetView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFlashcardState } from '@/components/flashcards/shared/useFlashcardState';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { Collection, CardSet, Set } from '@/components/flashcards/shared';

function SetsPageContent() {
  const {
    selectedSetList,
    setSelectedSet,
    setSelectedSetList,
    setWordCollection,
  } = useFlashcardState();

  const searchParams = useSearchParams();
  const router = useRouter();

  const loadSetsForCollection = useCallback(async (collection: Collection) => {
    try {
      const { WordRepository } = await import('@/components/flashcards/shared/repository');
      const repository = WordRepository.getInstance();
      let sets: Set[] = [];

      switch (collection) {
        case Collection.IN_PROGRESS:
          const currentSets = await repository.getInProgressSets();
          sets = [...currentSets.needToLearn, ...currentSets.toFeature];
          break;
        case Collection.NEW:
          sets = await repository.getUnlearnedSets();
          break;
      }

      console.log(sets);
      setSelectedSetList({
        type: collection,
        sets: sets,
      });
    } catch (error) {
      console.error("Error loading sets:", error);
    }
  }, [setSelectedSetList]);

  useEffect(() => {
    const collection = searchParams.get('collection') as Collection;
    if (collection) {
      setWordCollection(collection);
      loadSetsForCollection(collection);
    }
  }, [searchParams, setWordCollection, loadSetsForCollection]);

  const handleBackToPool = () => {
    router.push('/');
  };

  const handleSetSelected = (newSet: CardSet) => {
    setSelectedSet(newSet);
    const params = new URLSearchParams();
    params.set('setId', newSet.set?.id || '');
    params.set('collection', newSet.type);
    router.push(`/study?${params.toString()}`);
  };

  if (
    !selectedSetList ||
    !selectedSetList.sets ||
    selectedSetList.sets.length === 0
  ) {
    return <EmptySetView onBackToPool={handleBackToPool} />;
  }

  return (
    <SetSelectionView
      selectedSetList={selectedSetList}
      setSelectedSet={handleSetSelected}
      onBackToPool={handleBackToPool}
    />
  );
}

export default function SetsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <SetsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}