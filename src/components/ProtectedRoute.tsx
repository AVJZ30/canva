import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/database';

export function ProtectedRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <Loader2 className="size-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (!profile.is_active) return <Navigate to="/login" replace />;

  if (profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/reseller'} replace />;
  }

  return <>{children}</>;
}
