import { describe, it, expect } from 'vitest';
import { matchAnswer, skeleton } from './checker.js';
import { QUESTIONS } from './questions.js';

const find = (text) => QUESTIONS.find((q) => q.text.includes(text));
const idx = (qText, input) => matchAnswer(input, find(qText).answers)?.index ?? null;

describe('בדיקת תשובות', () => {
  it('נרדפות נחשבות אותה תשובה', () => {
    const a = idx('נטייה לאבד', 'פלאפון');
    expect(a).not.toBeNull();
    expect(idx('נטייה לאבד', 'טלפון')).toBe(a);
    expect(idx('נטייה לאבד', 'נייד')).toBe(a);
  });
  it('מתעלם מניקוד, ה הידיעה, אותיות סופיות וכתיב מלא/חסר', () => {
    expect(skeleton('הַנִּילוּס')).toBe(skeleton('נילוס'));
    expect(idx('נהרות', 'נילוס')).toBe(idx('נהרות', 'הנילוס'));
    expect(idx('השטחים', 'רוסייה')).toBe(0);
    expect(idx('חודשי השנה העבריים', 'חשון')).toBe(idx('חודשי השנה העבריים', 'חשוון'));
  });
  it('סולח על שגיאת כתיב אחת במילים ארוכות', () => {
    expect(idx('נטייה לאבד', 'מפתחוט')).toBe(0);
    expect(idx('נטייה לאבד', 'משקפים')).not.toBeNull();
    expect(idx('השטחים', 'קנדא')).toBe(1);
    expect(idx('השטחים', 'ברזיל')).toBe(4);
  });
  it('שגיאות שמע נפוצות: ק/כ, ט/ת, ע/א', () => {
    expect(idx('מדינות באירופה', 'צרפת')).toBe(0);
    expect(idx('כוכבי הלכת', 'אורנוס')).toBe(6);
    expect(idx('כוכבי הלכת', 'נפטון')).toBe(7);
  });
  it('גרשיים ופיסוק לא משנים', () => {
    expect(idx('השטחים', 'ארה"ב')).toBe(3);
    expect(idx('השטחים', 'ארהב')).toBe(3);
    expect(idx('סוגי גבינות', "קוטג'")).toBe(idx('סוגי גבינות', 'קוטג'));
  });
  it('לא מקבל תשובות לא קשורות ומילים קצרות שגויות', () => {
    expect(idx('השטחים', 'בננה')).toBeNull();
    expect(idx('השטחים', 'ים')).toBeNull();
    expect(idx('השטחים', '')).toBeNull();
    expect(idx('חיות מחמד', 'כלם')).toBeNull();
  });
  it('המאגר תקין: 50 שאלות, בלי שמות ריקים או כפולים בתוך שאלה', () => {
    expect(QUESTIONS.length).toBe(50);
    for (const q of QUESTIONS) {
      expect(q.answers.length).toBeGreaterThanOrEqual(5);
      const keys = q.answers.map((a) => skeleton(a.names[0]));
      expect(new Set(keys).size, q.text).toBe(keys.length);
      for (const a of q.answers) for (const n of a.names) expect(skeleton(n).length, `${q.text}: ${n}`).toBeGreaterThan(0);
    }
  });
  it('כל תשובה ראשית מזוהה כעצמה', () => {
    for (const q of QUESTIONS) {
      q.answers.forEach((a, i) => {
        expect(matchAnswer(a.names[0], q.answers)?.index, `${q.text}: ${a.names[0]}`).toBe(i);
      });
    }
  });
  it('שאלות פתוחות מקבלות הרבה תשובות, ורק קבוצות סגורות קטנות', () => {
    const closed = ['ימות השבוע', 'חודשי השנה', 'צבעי הקשת', 'כוכבי הלכת', '5 האוקיינוסים', '7 פלאי', 'נבחרות שזכו', 'ימים ואגמים'];
    for (const q of QUESTIONS) {
      const isClosed = closed.some((c) => q.text.includes(c));
      if (isClosed) continue;
      expect(q.answers.length, q.text).toBeGreaterThanOrEqual(q.text.startsWith('10 ') ? 10 : 20);
    }
  });
  it('תשובות חדשות מתקבלות: בגדי חורף', () => {
    const w = QUESTIONS.find((q) => q.text.includes('בגדים שלובשים בחורף'));
    for (const t of ['פליז', 'צעיף', 'קפוצון', 'מגפי גשם', 'מעיל פוך', 'כובע צמר', 'טייץ']) {
      expect(matchAnswer(t, w.answers), t).not.toBeNull();
    }
  });
});
