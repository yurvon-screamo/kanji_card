"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sets");
  }, [router]);

  return (
    <ProtectedRoute>
      <LoadingSpinner size="lg" label="Redirecting to sets..." />
    </ProtectedRoute>
  );
}
