import { currencyInfo } from '../data/currencies';

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const fmt = (n: number) => nf.format(Math.round(n));
export const fmt2 = (n: number) => nf2.format(n);

/** ₪1,234 – whole shekels, with a sign when asked. */
export function money(n: number, symbol = '₪', signed = false): string {
  const sign = n < 0 ? '-' : signed && n > 0 ? '+' : '';
  return `${symbol}${fmt(Math.abs(n))}${sign}`;
}

export const amountIn = (n: number, code: string) => {
  const info = currencyInfo(code);
  return `${info.symbol}${n >= 100 || Number.isInteger(n) ? fmt(n) : fmt2(n)}`;
};

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
