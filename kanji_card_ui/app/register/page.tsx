import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { colors } from '@/lib/colors';

export default function RegisterPage() {
    return (
        <div className={`min-h-screen ${colors.ui.background.main} flex flex-col items-center justify-center p-4`}>
            <RegisterForm />
            <p className="mt-4 text-center text-gray-600">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
                    Войти
                </Link>
            </p>
        </div>
    );
} 