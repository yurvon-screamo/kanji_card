import JapaneseFlashcards from "@/components/flashcards"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function Page() {
  return (
    <ProtectedRoute>
      <JapaneseFlashcards />
    </ProtectedRoute>
  )
}
