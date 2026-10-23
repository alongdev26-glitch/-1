export type ISODate = string; // YYYY-MM-DD, local time

export interface Trip {
  id: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  homeCurrency: string;
  dailyBudget: number; // in homeCurrency
  currencies: string[]; // currencies used on the trip, first is the default
}

export interface Member {
  id: string;
  tripId: string;
  name: string;
  color: string;
  order: number; // creation order, the first member is "me"
}

export type SplitType = 'equal' | 'selected' | 'exact' | 'personal';

export interface Split {
  memberId: string;
  share: number; // in homeCurrency
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number; // original amount
  currency: string;
  rateToHome: number; // home units per 1 unit of `currency`, frozen at the time of the expense
  amountHome: number;
  categoryId: string;
  note: string;
  date: ISODate;
  time: string; // HH:MM
  paidById: string;
  splitType: SplitType;
  splits: Split[];
}

export interface Settlement {
  id: string;
  tripId: string;
  fromId: string;
  toId: string;
  amountHome: number;
  date: ISODate;
}

export interface VisaStay {
  id: string;
  tripId: string;
  country: string;
  entryDate: ISODate;
  exitDate: ISODate | null;
  allowedDays: number;
  visaType: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transfer {
  fromId: string;
  toId: string;
  amount: number;
}
