'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, Text, Field } from "@fluentui/react-components";
import { apiService } from '@/lib/api-service';

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
        } catch {
            setError('Пользователь с таким логином уже существует');
        }
    };

    return (
        <Card style={{ width: '100%', maxWidth: '28rem', margin: '0 auto', padding: '1.5rem' }}>
            <Text size={600} weight="bold" align="center" block style={{ marginBottom: '1.5rem' }}>
                Регистрация
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <Field label="Подтвердите пароль" required>
                    <Input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={!!error}
                        required
                    />
                </Field>
                {error && (
                    <Text size={200} style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                        {error}
                    </Text>
                )}
                <Button onClick={handleSubmit} appearance="primary" style={{ width: '100%' }}>
                    Зарегистрироваться
                </Button>
            </div>
        </Card>
    );
};