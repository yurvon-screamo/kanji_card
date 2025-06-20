'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PoolView } from '@/components/flashcards/pool/PoolView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

function HomePageContent() {
  const router = useRouter();

  const handleViewModeChange = (mode: string, collection?: string) => {
    // Navigate based on the mode
    switch (mode) {
      case 'set-selection':
        const url = collection ? `/sets?collection=${collection}` : '/sets';
        router.push(url);
        break;
      case 'study':
        router.push('/study');
        break;
      case 'add-cards':
        router.push('/add-cards');
        break;
      case 'learned':
        router.push('/learned');
        break;
      default:
        break;
    }
  };

  return (
    <PoolView
      setViewMode={handleViewModeChange}
    />
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <HomePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
