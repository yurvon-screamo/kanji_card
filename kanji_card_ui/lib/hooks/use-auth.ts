'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiService } from '@/lib/api-service';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await apiService.checkAuth();
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
                if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
                    router.replace('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    return {
        isAuthenticated,
        isLoading,
    };
} 