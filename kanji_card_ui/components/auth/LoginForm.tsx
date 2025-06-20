'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, Text, Field } from "@fluentui/react-components";
import { apiService } from '@/lib/api-service';

export const LoginForm = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await apiService.login(login, password);
            router.push('/');
        } catch {
            setError('Неверный логин или пароль');
        }
    };

    return (
        <Card style={{ width: '100%', maxWidth: '28rem', margin: '0 auto', padding: '1.5rem' }}>
            <Text size={600} weight="bold" align="center" block style={{ marginBottom: '1.5rem' }}>
                Вход
            </Text>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Логин" required>
                    <Input
                        id="login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        error={!!error}
                        required
                    />
                </Field>
                <Field label="Пароль" required>
                    <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!error}
                        required
                    />
                </Field>
                {error && (
                    <Text size={200} style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                        {error}
                    </Text>
                )}
                <Button type="submit" appearance="primary" style={{ width: '100%' }}>
                    Войти
                </Button>
            </form>
        </Card>
    );
};