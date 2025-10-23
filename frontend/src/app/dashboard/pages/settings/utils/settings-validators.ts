import { Injectable } from '@angular/core';

export const CURRENCIES = [
  { code: 'usd', symbol: '$', name: 'USD' },
  { code: 'eur', symbol: '€', name: 'EUR' },
  { code: 'gbp', symbol: '£', name: 'GBP' },
  { code: 'cad', symbol: '$', name: 'CAD' },
  { code: 'aud', symbol: '$', name: 'AUD' },
] as const;

export function validateTimeFormat(time: string): boolean {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

export function parseDuration(input: string | number): number {
  const parsed = typeof input === 'string' ? parseInt(input, 10) : input;
  return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
}

export function formatDurationInCents(amount: number): string {
  return `${amount} = $${(amount / 100).toFixed(2)}`;
}
