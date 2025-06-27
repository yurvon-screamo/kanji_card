import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RulesView } from '@/components/flashcards/rules/RulesView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function RulesPageContent() {
  return (
    <RulesView />
  );
}

export default function RulesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <RulesPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}