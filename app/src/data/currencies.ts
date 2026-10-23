export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  /** Rough ILS value, only used before the first successful download of live rates. */
  fallbackToILS: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'ILS', symbol: '₪', name: 'שקל ישראלי', fallbackToILS: 1 },
  { code: 'USD', symbol: '$', name: 'דולר אמריקאי', fallbackToILS: 3.7 },
  { code: 'EUR', symbol: '€', name: 'אירו', fallbackToILS: 4.0 },
  { code: 'THB', symbol: '฿', name: 'באט תאילנדי', fallbackToILS: 0.107 },
  { code: 'VND', symbol: '₫', name: 'דונג וייטנאמי', fallbackToILS: 0.000147 },
  { code: 'NPR', symbol: 'रू', name: 'רופי נפאלי', fallbackToILS: 0.027 },
  { code: 'INR', symbol: '₹', name: 'רופי הודי', fallbackToILS: 0.044 },
  { code: 'JPY', symbol: '¥', name: 'ין יפני', fallbackToILS: 0.025 },
  { code: 'TWD', symbol: 'NT$', name: 'דולר טייוואני', fallbackToILS: 0.115 },
  { code: 'LAK', symbol: '₭', name: 'קיפ לאוסי', fallbackToILS: 0.00017 },
  { code: 'KHR', symbol: '៛', name: 'ריאל קמבודי', fallbackToILS: 0.0009 },
  { code: 'IDR', symbol: 'Rp', name: 'רופיה אינדונזית', fallbackToILS: 0.000230 },
  { code: 'PEN', symbol: 'S/', name: 'סול פרואני', fallbackToILS: 0.98 },
  { code: 'COP', symbol: 'COP$', name: 'פסו קולומביאני', fallbackToILS: 0.00089 },
  { code: 'ARS', symbol: 'AR$', name: 'פסו ארגנטינאי', fallbackToILS: 0.0035 },
  { code: 'BRL', symbol: 'R$', name: 'ריאל ברזילאי', fallbackToILS: 0.66 },
  { code: 'MXN', symbol: 'MX$', name: 'פסו מקסיקני', fallbackToILS: 0.19 },
  { code: 'GBP', symbol: '£', name: 'לירה שטרלינג', fallbackToILS: 4.7 },
];

export const currencyInfo = (code: string): CurrencyInfo =>
  CURRENCIES.find((c) => c.code === code) ?? { code, symbol: code, name: code, fallbackToILS: 1 };
