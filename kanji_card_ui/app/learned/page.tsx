'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LearnedWordsView } from '@/components/flashcards/learned';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';

function LearnedPageContent() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <LearnedWordsView
      onBack={handleBack}
    />
  );
}

export default function LearnedPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <LearnedPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}