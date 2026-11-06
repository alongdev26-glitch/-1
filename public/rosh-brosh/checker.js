// בדיקת תשובות בעברית: סלחנית לניקוד, כתיב מלא/חסר, אותיות סופיות,
// "ה" הידיעה, גרשיים, שגיאות כתיב נפוצות והחלפת/השמטת אות.
// נרדפות ("פלאפון" = "טלפון" = "נייד") מוגדרות כשמות חלופיים ליד כל תשובה.

const NIQQUD = /[֑-ׇ]/g;
const QUOTES = /[׳״'"’‘`“”]/g;
const FINALS = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
// אותיות שנשמעות אותו דבר ומתבלבלות הרבה בכתיבה
const FOLD = { ק: 'כ', ט: 'ת', ע: 'א', ס: 'ש' };

/** ניקוי בסיסי: בלי ניקוד, גרשיים, פיסוק ורווחים כפולים. */
export function normalize(input) {
  return String(input ?? '')
    .normalize('NFC')
    .replace(NIQQUD, '')
    .replace(QUOTES, '')
    .toLowerCase()
    .replace(/[^א-תa-z0-9]+/g, ' ')
    .trim();
}

/** מפתח השוואה: מתעלם מ"ה" הידיעה, מרווחים, מ-ו/י (מלא וחסר) ומאותיות דומות. */
export function skeleton(input) {
  const words = normalize(input)
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length >= 4 && w[0] === 'ה' ? w.slice(1) : w));
  const fold = (t) => t.replace(/[ךםןףץ]/g, (c) => FINALS[c]).replace(/[קטעס]/g, (c) => FOLD[c]);
  const s = fold(words.join('')).replace(/[וי]/g, '');
  // מילים קצרות כמו "הודו" נשארות בלי כלום אחרי ההסרות: אז משאירים אותן שלמות
  return s.length >= 2 ? s : fold(normalize(input).replace(/ /g, ''));
}

/** מרחק עריכה (כולל החלפת שתי אותיות סמוכות כשגיאה אחת). */
export function editDistance(a, b) {
  const n = a.length;
  const m = b.length;
  if (!n) return m;
  if (!m) return n;
  const d = Array.from({ length: n + 1 }, (_, i) => [i, ...Array(m).fill(0)]);
  for (let j = 1; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[n][m];
}

/** כמה שגיאות מותר, לפי אורך המילה: קצרות חייבות להיות מדויקות. */
export function tolerance(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

/**
 * מחפש איזו תשובה בשאלה המשתמש התכוון אליה.
 * answers: [{ names: ['שם ראשי', 'נרדף', ...] }]
 * מחזיר { index, distance } או null. אם שתי תשובות שונות שוות במרחק, לא מנחש.
 */
export function matchAnswer(input, answers) {
  const q = skeleton(input);
  if (q.length < 2) return null;
  let best = null;
  let tie = false;
  answers.forEach((ans, index) => {
    let d = Infinity;
    for (const name of ans.names) {
      const k = skeleton(name);
      if (!k) continue;
      if (k === q) {
        d = 0;
        break;
      }
      const dist = editDistance(q, k);
      if (dist <= tolerance(Math.min(q.length, k.length))) d = Math.min(d, dist);
    }
    if (d === Infinity) return;
    if (!best || d < best.distance) {
      best = { index, distance: d };
      tie = false;
    } else if (d === best.distance) {
      tie = true;
    }
  });
  if (!best || (tie && best.distance > 0)) return null;
  return best;
}
