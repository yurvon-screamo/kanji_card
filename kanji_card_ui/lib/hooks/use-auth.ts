'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiService } from '@/lib/api-service';

interface User {
    login: string;
}

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const getUserFromToken = (): User | null => {
        try {
            const cookies = document.cookie.split(';');
            const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
            if (!authCookie) return null;
            
            const token = authCookie.split('=')[1];
            if (!token) return null;
            
            // Decode JWT payload (simple base64 decode)
            const payload = token.split('.')[1];
            if (!payload) return null;
            
            const decoded = JSON.parse(atob(payload));
            return { login: decoded.sub };
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await apiService.checkAuth();
                setIsAuthenticated(true);
                const userData = getUserFromToken();
                setUser(userData);
            } catch {
                setIsAuthenticated(false);
                setUser(null);
                if (!pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
                    router.replace('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            router.replace('/login');
        }
    };

    return {
        isAuthenticated,
        isLoading,
        user,
        logout,
    };
}