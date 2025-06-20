'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, router]);

    return (
        <div className={`min-h-screen ${colors.ui.background.main} flex flex-col items-center justify-center p-4`}>
            <LoginForm />
            <p className="mt-4 text-center text-gray-600">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-indigo-600 hover:text-indigo-500">
                    Зарегистрироваться
                </Link>
            </p>
        </div>
    );
}