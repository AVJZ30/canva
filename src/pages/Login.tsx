import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

export default function LoginPage() {
  const { profile, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <Loader2 className="size-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/reseller'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      const p = await login(username.trim(), password);
      window.location.href = p.role === 'admin' ? '/admin' : '/reseller';
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 text-sm text-ink-400">Panel de gestión para revendedores</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-6 shadow-2xl backdrop-blur-sm"
        >
          <div className="mb-4">
            <Label htmlFor="username">Usuario</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu.usuario"
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <div className="mb-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 ring-1 ring-inset ring-rose-500/20">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-5 w-full" loading={submitting}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-500">
          Acceso privado. Los revendedores son creados únicamente por el administrador.
        </p>
      </div>
    </div>
  );
}
