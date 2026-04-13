import { useEffect, useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { adminApi } from '@/api';
import type { AdminQrResponse } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function QrDialog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AdminQrResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    adminApi.qr()
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'failed'); });
    return () => { cancelled = true; };
  }, [open, data]);

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="md">
          <QrCode className="h-4 w-4" />
          Show QR
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan to join</DialogTitle>
          <DialogDescription>Players can scan this code to join the active group.</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-[var(--color-incorrect)]">{error}</p>}

        {!data && !error && <div className="h-[320px] animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />}

        {data && (
          <div className="space-y-4">
            <div
              className="flex justify-center rounded-md bg-white p-4 [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-[320px]"
              dangerouslySetInnerHTML={{ __html: data.svg }}
            />
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2">
              <code className="flex-1 truncate font-mono text-sm text-[var(--color-fg-muted)]">{data.url}</code>
              <Button variant="ghost" size="sm" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-[var(--color-correct)]" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
