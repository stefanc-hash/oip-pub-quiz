import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSeconds(ms: number | null): string {
  if (ms === null) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
}
