import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Sign in — HabitFlow' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
