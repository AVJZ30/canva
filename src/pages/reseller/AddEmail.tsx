import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { MailPlus, Send, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { createRequest } from '@/services/requests.service';
import { DURATION_OPTIONS } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResellerAddEmail() {
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCredits = (profile?.credits ?? 0) > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasCredits) {
      setError('No tienes créditos disponibles. Contacta al administrador para solicitar más créditos.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      await createRequest(email.trim(), duration);
      toast.success('Solicitud enviada correctamente. El administrador revisará tu solicitud.');
      setEmail('');
      setDuration(1);
      await refreshProfile();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Agregar correo a Canva" description="Envía una solicitud para que el administrador agregue un correo a Canva." />

      <div className="mx-auto max-w-lg">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <MailPlus className="size-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-ink-50">Nueva solicitud</p>
              <p className="text-sm text-ink-400">
                Créditos disponibles:{' '}
                <span className="font-mono-num font-semibold text-ink-100">{profile?.credits ?? 0}</span>
              </p>
            </div>
          </div>

          {!hasCredits && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm text-amber-300 ring-1 ring-inset ring-amber-500/25">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>No tienes créditos disponibles. Contacta al administrador para solicitar más créditos.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@gmail.com"
                disabled={!hasCredits}
              />
            </div>

            <div>
              <Label htmlFor="duration">Tiempo del plan</Label>
              <Select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                disabled={!hasCredits}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 ring-1 ring-inset ring-rose-500/20">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading} disabled={!hasCredits}>
              <Send className="size-4" /> Enviar solicitud
            </Button>
          </form>

          <p className="mt-4 text-xs text-ink-500">
            Al enviar la solicitud se descontará automáticamente 1 crédito de tu cuenta. El administrador agregará
            el correo manualmente a Canva por el tiempo seleccionado y confirmará el resultado aquí.
          </p>
        </Card>
      </div>
    </div>
  );
}

