'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AddCardsView } from '@/components/flashcards/add-cards';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

function AddCardsPageContent() {
  const router = useRouter();

  const handleViewModeChange = (mode: string) => {
    // Navigate based on the mode
    switch (mode) {
      case 'pool':
        router.push('/');
        break;
      case 'set-selection':
        router.push('/sets');
        break;
      case 'study':
        router.push('/study');
        break;
      default:
        router.push('/');
    }
  };

  return (
    <AddCardsView
      setViewMode={handleViewModeChange}
    />
  );
}

export default function AddCardsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <AddCardsPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}