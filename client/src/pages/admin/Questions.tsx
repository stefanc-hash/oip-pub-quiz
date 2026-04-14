import { useEffect, useState } from 'react';
import { ArrowLeft, AlertCircle, Check, Pencil, X } from 'lucide-react';
import { adminApi } from '@/api';
import type { AdminQuestion } from '@/types';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props { onBack: () => void }

export function Questions({ onBack }: Props) {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.listQuestions()
      .then(setQuestions)
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load questions'));
  }, []);

  async function saveEdit(id: string, patch: Omit<AdminQuestion, 'id'>) {
    const updated = await adminApi.updateQuestion(id, patch);
    setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    setEditingId(null);
  }

  return (
    <AppShell variant="wide">
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to groups
      </Button>

      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
          Pub Quiz · Admin
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
      </header>

      {loadError && <ErrorBanner message={loadError} />}

      {questions.length === 0 && !loadError && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)]" />
          ))}
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {questions.map((q, i) =>
          editingId === q.id
            ? (
              <QuestionEditor
                key={q.id}
                index={i}
                question={q}
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
              />
            )
            : (
              <QuestionRow
                key={q.id}
                index={i}
                question={q}
                onEdit={() => setEditingId(q.id)}
              />
            ),
        )}
      </ol>
    </AppShell>
  );
}

// ── Read-only card ──────────────────────────────────────────────────────────

function QuestionRow({
  index, question, onEdit,
}: { index: number; question: AdminQuestion; onEdit: () => void }) {
  const LABELS = ['A', 'B', 'C', 'D'];
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <span className="text-[var(--color-fg-muted)] text-sm tabular-nums shrink-0 pt-0.5">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="font-semibold leading-snug">{question.prompt}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
          {question.options.map((opt, idx) => (
            <li
              key={idx}
              className={cn(
                'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 border',
                idx === question.correctIndex
                  ? 'border-[var(--color-correct)]/40 bg-[var(--color-correct)]/10 text-[var(--color-correct)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]',
              )}
            >
              <span className="font-mono text-xs shrink-0">{LABELS[idx]}</span>
              <span className="flex-1 truncate">{opt}</span>
              {idx === question.correctIndex && <Check className="h-3 w-3 shrink-0" />}
            </li>
          ))}
        </ul>

        <p className="text-xs text-[var(--color-fg-muted)] italic leading-relaxed">
          {question.explanation}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Inline edit form ────────────────────────────────────────────────────────

function QuestionEditor({
  index, question, onSave, onCancel,
}: {
  index: number;
  question: AdminQuestion;
  onSave: (id: string, patch: Omit<AdminQuestion, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const LABELS = ['A', 'B', 'C', 'D'];
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState<string[]>([...question.options]);
  const [correctIndex, setCorrectIndex] = useState(question.correctIndex);
  const [explanation, setExplanation] = useState(question.explanation);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    try {
      await onSave(question.id, { prompt, options, correctIndex, explanation });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
      setBusy(false);
    }
  }

  function setOption(idx: number, value: string) {
    setOptions(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  return (
    <Card className="ring-2 ring-[var(--color-primary)]">
      <CardContent className="p-4">
        <form className="flex flex-col gap-4" onSubmit={handleSave}>
          <div className="flex items-center gap-2 text-[var(--color-fg-muted)] text-sm">
            <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span className="text-xs">·</span>
            <span className="font-mono text-xs">{question.id}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`prompt-${question.id}`}>Question</Label>
            <Input
              id={`prompt-${question.id}`}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Options <span className="text-[var(--color-fg-muted)] font-normal normal-case">(click letter to mark correct)</span></Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(idx)}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors',
                    idx === correctIndex
                      ? 'border-[var(--color-correct)] bg-[var(--color-correct)]/20 text-[var(--color-correct)]'
                      : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]',
                  )}
                  title={`Mark ${LABELS[idx]} as correct`}
                >
                  {LABELS[idx]}
                </button>
                <Input
                  value={opt}
                  onChange={e => setOption(idx, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`explanation-${question.id}`}>Explanation</Label>
            <Input
              id={`explanation-${question.id}`}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              required
            />
          </div>

          {saveError && <ErrorBanner message={saveError} />}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              <Check className="h-3.5 w-3.5" />
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Shared error banner ─────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-incorrect)]/10 border border-[var(--color-incorrect)]/30 p-3 text-sm text-[var(--color-incorrect)]">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
