import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number | null): string {
  if (ms === null) return '-';
  return `${Math.round(ms).toLocaleString()}ms`;
}
