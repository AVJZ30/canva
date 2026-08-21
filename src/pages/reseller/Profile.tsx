import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { UserCircle, KeyRound, Coins } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword } from '@/services/auth.service';
import { formatDateTime, formatRelativeTime, initials } from '@/lib/utils';

export default function ResellerProfile() {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(newPassword);
      toast.success('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div>
      <PageHeader title="Mi perfil" description="Consulta tus datos y actualiza tu contraseña." />

      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-semibold text-violet-300">
          {initials(profile.full_name || profile.username)}
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-ink-50">{profile.full_name}</p>
          <p className="text-sm text-ink-400">@{profile.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="size-4 text-ink-400" />
              <h2 className="font-display text-sm font-semibold text-ink-100">Datos de la cuenta</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Nombre" value={profile.full_name} />
            <Row label="Usuario" value={`@${profile.username}`} />
            <Row
              label="Créditos"
              value={
                <span className="inline-flex items-center gap-1.5 font-mono-num font-semibold text-ink-100">
                  <Coins className="size-3.5 text-violet-400" /> {profile.credits}
                </span>
              }
            />
            <Row label="Fecha de registro" value={formatDateTime(profile.created_at)} />
            <Row label="Última conexión" value={formatRelativeTime(profile.last_seen)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-ink-400" />
              <h2 className="font-display text-sm font-semibold text-ink-100">Cambiar contraseña</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label>Confirmar contraseña</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleChangePassword} loading={loading}>
              Actualizar contraseña
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-800 pb-3 last:border-0 last:pb-0">
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-100">{value}</span>
    </div>
  );
}
