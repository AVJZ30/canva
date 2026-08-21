import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea, Label } from './Input';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'primary' | 'danger' | 'success';
  requireReason?: boolean;
  reasonLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'primary',
  requireReason,
  reasonLabel = 'Motivo',
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-400">
          <AlertTriangle className="size-4" />
        </div>
        <p className="text-sm text-ink-300">{description}</p>
      </div>

      {requireReason && (
        <div className="mt-4">
          <Label>{reasonLabel}</Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribe el motivo..."
            autoFocus
          />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant={variant}
          onClick={handleConfirm}
          loading={loading}
          disabled={requireReason && !reason.trim()}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
