'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api-service';
import { colors } from '@/lib/colors';

export const RegisterForm = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        try {
            await apiService.register(login, password);
            router.push('/login');
        } catch (err) {
            setError('Пользователь с таким логином уже существует');
        }
    };

    return (
        <div className={`w-full max-w-md mx-auto p-6 ${colors.ui.toolbar.bg} rounded-lg shadow-md`}>
            <h2 className={`text-2xl font-bold mb-6 text-center ${colors.ui.text.default}`}>Регистрация</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="login" className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}>
                        Логин
                    </label>
                    <Input
                        id="login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        error={!!error}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}>
                        Пароль
                    </label>
                    <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!error}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium ${colors.ui.text.secondary} mb-1`}>
                        Подтвердите пароль
                    </label>
                    <Input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={!!error}
                        required
                    />
                </div>
                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full">
                    Зарегистрироваться
                </Button>
            </form>
        </div>
    );
}; 