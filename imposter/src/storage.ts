/**
 * Everything the app remembers goes through here. Nothing is written to the browser's storage until the
 * player accepts the notice; before that (or after declining) values live only until the page closes.
 */
const CONSENT_KEY = 'imposter.consent';
const PREFIX = 'imposter.';

export type Consent = 'yes' | 'no' | null;

const mem = new Map<string, string>();

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch {
    return null;
  }
}

let consent: Consent = readConsent();

export const getConsent = (): Consent => consent;

export function setConsent(value: 'yes' | 'no') {
  consent = value;
  try {
    localStorage.setItem(CONSENT_KEY, value);
    if (value === 'yes') {
      for (const [k, v] of mem) localStorage.setItem(k, v);
    } else {
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX) && k !== CONSENT_KEY) localStorage.removeItem(k);
    }
  } catch {
    /* storage unavailable: nothing to flush or clear */
  }
}

export function load(key: string): string | null {
  if (consent === 'yes') {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch {
      /* fall through to memory */
    }
  }
  return mem.get(key) ?? null;
}

export function save(key: string, value: string) {
  mem.set(key, value);
  if (consent !== 'yes') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
