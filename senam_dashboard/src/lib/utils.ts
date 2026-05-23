import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function invariant(cond: unknown, msg = 'Invariant violation'): asserts cond {
  if (!cond) throw new Error(msg);
}
