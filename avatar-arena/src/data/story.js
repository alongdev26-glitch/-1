// מסלול הסיפור. כרגע ממלכה אחת: מקדשי האוויר (6 שלבים, האחרון הוא הבוס).
//  opp = היריב, alt = יריב חלופי (אם השחקן בחר את אותה דמות), map = מפת הקרב,
//  skill = חדות הבוט, obj = שלושת יעדי הכוכבים, pos = מיקום התחנה על המפה (אחוזים מהשמאל והעליון)
//  reward = מטבעות/ניסיון בניצחון ראשון, perk = מה נפתח (מכה לכל הדמויות, מכה סודית, דמות)
export const OBJ = {
  win: () => ({ t: 'win', text: 'נצח בקרב' }),
  clean: () => ({ t: 'clean', text: 'נצח בלי לאבד חיים' }),
  time: (n) => ({ t: 'time', n, text: `סיים את הקרב תוך ${n} שניות` }),
  moves: (n) => ({ t: 'moves', n, text: `השתמש ב-${n} מכות שונות` }),
  ult: () => ({ t: 'ult', text: 'השתמש במכה הסודית' }),
  lowDmg: (n) => ({ t: 'lowDmg', n, text: `ספוג פחות מ-${n}% נזק` }),
};

export const REALMS = [
  {
    id: 'air', name: 'מקדשי האוויר', sub: 'מסלול סיפור • מקדש הרוח הצפוני', element: 'air', icon: 'air', ready: true, map: 'air',
    stages: [
      { id: 'air1', name: 'שער המדיטציה השקט', short: 'שער המדיטציה', diff: 'קל', cp: 1200, icon: 'self_improvement', pos: [84, 80],
        opp: 'zuko', alt: 'toph', map: 'air', skill: 0.7,
        desc: 'חצר הכניסה השקטה. יריב מתאמן מנסה לבדוק אם אתה ראוי לעלות להר.',
        obj: [OBJ.win(), OBJ.time(100), OBJ.lowDmg(120)], reward: { coins: 300, xp: 200 }, perk: { kind: 'move', n: 2, text: 'מכה 2 לכל הדמויות' } },
      { id: 'air2', name: 'מסלול הדאייה בעננים', short: 'מסלול הדאייה', diff: 'רגיל', cp: 1650, icon: 'paragliding', pos: [65, 58],
        opp: 'toph', alt: 'katara', map: 'sunset', skill: 0.8,
        desc: 'קרב על פלטפורמות צפות מעל העננים. הרוח מעיפה כל מי שלא יציב.',
        obj: [OBJ.win(), OBJ.moves(2), OBJ.clean()], reward: { coins: 400, xp: 300 }, perk: { kind: 'move', n: 3, text: 'מכה 3 לכל הדמויות' } },
      { id: 'air3', name: 'מגדל הפעמונים העתיק', short: 'מגדל הפעמונים', diff: 'מתקדם', cp: 2100, icon: 'notifications_active', pos: [44, 70],
        opp: 'katara', alt: 'zuko', map: 'air', skill: 0.9,
        desc: 'הפעמונים מהדהדים בכל מכה. יריבה מהירה שאוהבת להתחמק ולהעיף רסיסים.',
        obj: [OBJ.win(), OBJ.moves(3), OBJ.time(90)], reward: { coins: 500, xp: 400 }, perk: { kind: 'move', n: 4, text: 'מכה 4 לכל הדמויות' } },
      { id: 'air4', name: 'מקדש הרוחות הצפוני', short: 'מקדש הרוחות', diff: 'אמן', cp: 2550, icon: 'temple_buddhist', pos: [30, 46],
        opp: 'zuko', alt: 'katara', map: 'sunset', skill: 1.0,
        desc: 'לב המקדש. יריב מנוסה ששולט היטב בכל ארבע המכות שלו.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.lowDmg(150)], reward: { coins: 600, xp: 500 }, perk: { kind: 'ult', text: 'המכה הסודית נפתחת' } },
      { id: 'air5', name: 'פסגת ביזון השמיים', short: 'פסגת הביזון', diff: 'מאסטר', cp: 2900, icon: 'flight', pos: [50, 24],
        opp: 'toph', alt: 'katara', map: 'air', skill: 1.15,
        desc: 'הפסגה הגבוהה ביותר לפני ההיכל. יריבה חזקה שלא מוותרת.',
        obj: [OBJ.win(), OBJ.clean(), OBJ.time(80)], reward: { coins: 800, xp: 600 }, perk: { kind: 'title', text: 'התואר "נווד אוויר"' } },
      { id: 'air6', name: 'מקדש האוויר הקדוש', short: 'המקדש הקדוש', diff: 'אגדי', cp: 3500, icon: 'cyclone', pos: [14, 22], boss: true,
        opp: 'aang', alt: 'aang', map: 'air', skill: 1.3,
        desc: 'אנג במצב אווטאר: שליטה מוחלטת ברוחות ובסופות. הקרב הסופי של המקדש.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.clean()], reward: { coins: 1500, xp: 1000 }, perk: { kind: 'char', char: 'aang', text: 'אנג נפתח כדמות שחקן' } },
    ],
  },
  {
    id: 'water', name: 'שבט המים', sub: 'מסלול סיפור • צפון הקוטב', element: 'water', icon: 'water_drop', ready: true, map: 'water',
    stages: [
      { id: 'water1', name: 'חופי הקרח הדרומיים', short: 'חופי הקרח', diff: 'רגיל', cp: 2000, icon: 'sailing', pos: [86, 78],
        opp: 'zuko', alt: 'toph', map: 'water', skill: 0.95,
        desc: 'החוף הקפוא של הדרום. הרוח הקרה מעיפה שלג, והיריב לא מתרגש מהקור.',
        obj: [OBJ.win(), OBJ.time(100), OBJ.lowDmg(130)], reward: { coins: 700, xp: 700 } },
      { id: 'water2', name: 'כפר האיגלו המסורתי', short: 'כפר האיגלו', diff: 'רגיל', cp: 2200, icon: 'home', pos: [68, 58],
        opp: 'toph', alt: 'zuko', map: 'water', skill: 1.0,
        desc: 'כפר שלם של בתי קרח. קרב על גגות מחליקים, ואף אחד לא נשאר יציב.',
        obj: [OBJ.win(), OBJ.moves(3), OBJ.clean()], reward: { coins: 750, xp: 750 } },
      { id: 'water3', name: 'מערות הקרח הנסתרות', short: 'מערות הקרח', diff: 'מתקדם', cp: 2400, icon: 'ac_unit', pos: [48, 74],
        opp: 'zuko', alt: 'katara', map: 'water', skill: 1.08,
        desc: 'מערות כחולות זוהרות מתחת לקרחון. האש מפיצה כאן אור, והקרח סביבה מתפרק.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.time(90)], reward: { coins: 800, xp: 800 } },
      { id: 'water4', name: 'מפלי הקרחון הקפואים', short: 'מפלי הקרחון', diff: 'אמן', cp: 2600, icon: 'waterfall_chart', pos: [34, 48],
        opp: 'toph', alt: 'zuko', map: 'water', skill: 1.15,
        desc: 'מפלים שקפאו באמצע הנפילה. פלטפורמות צרות מעל תהום של קרח.',
        obj: [OBJ.win(), OBJ.moves(4), OBJ.lowDmg(150)], reward: { coins: 850, xp: 850 } },
      { id: 'water5', name: 'נווה המדבר הרוחני', short: 'נווה הרוחות', diff: 'מאסטר', cp: 2900, icon: 'spa', pos: [55, 26],
        opp: 'katara', alt: 'toph', map: 'water', skill: 1.25,
        desc: 'בריכה זוהרת שבה מתאמנים מאסטרים. יריבה מהירה ששולטת היטב במים.',
        obj: [OBJ.win(), OBJ.clean(), OBJ.time(80)], reward: { coins: 950, xp: 950 } },
      { id: 'water6', name: 'ארמון הקרח הצפוני', short: 'ארמון הקרח', diff: 'אגדי', cp: 3400, icon: 'castle', pos: [15, 22], boss: true,
        opp: 'katara', alt: 'toph', map: 'water', skill: 1.4, bossLabel: 'מאסטרית הקוטב',
        desc: 'ארמון הקרח בלב הקוטב. מאסטרית המים מחכה בהיכל ומגלה את עוצמתה.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.clean()], reward: { coins: 1800, xp: 1500 }, perk: { kind: 'title', text: 'התואר "מאסטר הקוטב"' } },
    ],
  },
  {
    id: 'earth', name: 'ממלכת האדמה', sub: 'מסלול סיפור • חומות בה סינג סה', element: 'earth', icon: 'landscape', ready: true, map: 'earth',
    stages: [
      { id: 'earth1', name: 'יערות גאולינג', short: 'יערות גאולינג', diff: 'רגיל', cp: 3000, icon: 'forest', pos: [86, 82],
        opp: 'katara', alt: 'zuko', map: 'earth', skill: 1.1,
        desc: 'יער ירוק ליד העיר. אבק וענפים, ויריב שמכיר כל סלע בשטח.',
        obj: [OBJ.win(), OBJ.time(100), OBJ.lowDmg(130)], reward: { coins: 900, xp: 900 } },
      { id: 'earth2', name: 'זירת האבן המחתרתית', short: 'זירת האבן', diff: 'מתקדם', cp: 3200, icon: 'stadium', pos: [68, 60],
        opp: 'zuko', alt: 'katara', map: 'earth', skill: 1.18,
        desc: 'זירה סודית בעומק האדמה. הקירות סביב, והמקום היחיד לברוח הוא למעלה.',
        obj: [OBJ.win(), OBJ.moves(3), OBJ.clean()], reward: { coins: 950, xp: 950 } },
      { id: 'earth3', name: 'קניון מעבר הנחש', short: 'מעבר הנחש', diff: 'מתקדם', cp: 3400, icon: 'route', pos: [50, 78],
        opp: 'toph', alt: 'zuko', map: 'earth', skill: 1.25,
        desc: 'קניון צר ומתפתל. כאן שולטת האדמה, וכל צעד הוא על הרגליים שלה.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.time(90)], reward: { coins: 1000, xp: 1000 } },
      { id: 'earth4', name: 'אגם לאוגאי', short: 'אגם לאוגאי', diff: 'אמן', cp: 3600, icon: 'water', pos: [36, 54],
        opp: 'katara', alt: 'zuko', map: 'earth', skill: 1.3,
        desc: 'האגם הענק שמקיף את חומות העיר. הרוח מביאה עננים של אבק מהצוק.',
        obj: [OBJ.win(), OBJ.moves(4), OBJ.lowDmg(150)], reward: { coins: 1050, xp: 1050 } },
      { id: 'earth5', name: 'חומת בה סינג סה', short: 'חומת בה סינג סה', diff: 'מאסטר', cp: 3900, icon: 'fort', pos: [56, 34],
        opp: 'zuko', alt: 'katara', map: 'earth', skill: 1.38,
        desc: 'החומה הגדולה בעולם. חייל מנוסה שומר על השער האחרון.',
        obj: [OBJ.win(), OBJ.clean(), OBJ.time(80)], reward: { coins: 1150, xp: 1150 } },
      { id: 'earth6', name: 'היכל המלך', short: 'היכל המלך', diff: 'אגדי', cp: 4400, icon: 'crown', pos: [17, 22], boss: true,
        opp: 'toph', alt: 'zuko', map: 'earth', skill: 1.5, bossLabel: 'אלופת ממלכת האדמה',
        desc: 'היכל המלך בלב העיר. אלופת האדמה שולטת בכל סלע, וכל הקרקע בידיה.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.clean()], reward: { coins: 2200, xp: 1800 }, perk: { kind: 'title', text: 'התואר "אלוף האדמה"' } },
    ],
  },
  {
    id: 'fire', name: 'אומת האש', sub: 'מסלול סיפור • קלדרת הלבה', element: 'fire', icon: 'local_fire_department', ready: true, map: 'fire',
    stages: [
      { id: 'fire1', name: 'שערי הקלדרה', short: 'שערי הקלדרה', diff: 'מתקדם', cp: 4000, icon: 'door_front', pos: [84, 76],
        opp: 'toph', alt: 'katara', map: 'fire', skill: 1.25,
        desc: 'שערים שחורים בקצה הקלדרה. החום מעוות את האוויר, והשמירה כבדה.',
        obj: [OBJ.win(), OBJ.time(100), OBJ.lowDmg(130)], reward: { coins: 1100, xp: 1200 } },
      { id: 'fire2', name: 'שפך הלבה', short: 'שפך הלבה', diff: 'מתקדם', cp: 4200, icon: 'volcano', pos: [62, 68],
        opp: 'katara', alt: 'toph', map: 'fire', skill: 1.32,
        desc: 'נהר לבה זורם מתחת לגשר. מי שנופל לא חוזר.',
        obj: [OBJ.win(), OBJ.moves(3), OBJ.clean()], reward: { coins: 1150, xp: 1250 } },
      { id: 'fire3', name: 'מבצר הארגמן', short: 'מבצר הארגמן', diff: 'אמן', cp: 4400, icon: 'fort', pos: [43, 50],
        opp: 'toph', alt: 'katara', map: 'fire', skill: 1.38,
        desc: 'מבצר אדום עם גגות מורמים. חיילים בכל פינה, והקרב בחצר הפנימית.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.time(90)], reward: { coins: 1200, xp: 1300 } },
      { id: 'fire4', name: 'אקדמיית האש הצבאית', short: 'אקדמיית האש', diff: 'אמן', cp: 4700, icon: 'school', pos: [64, 34],
        opp: 'zuko', alt: 'katara', map: 'fire', skill: 1.45,
        desc: 'חצר האימונים המלכותית. הנסיך עצמו מזמין אותך לקרב הכרעה.',
        obj: [OBJ.win(), OBJ.moves(4), OBJ.lowDmg(150)], reward: { coins: 1300, xp: 1400 } },
      { id: 'fire5', name: 'הר הגעש הרדום', short: 'הר הגעש', diff: 'מאסטר', cp: 5000, icon: 'local_fire_department', pos: [40, 22],
        opp: 'katara', alt: 'toph', map: 'fire', skill: 1.52,
        desc: 'הר געש שמתעורר. הקרקע רועדת, והלבה עולה מכל סדק.',
        obj: [OBJ.win(), OBJ.clean(), OBJ.time(80)], reward: { coins: 1450, xp: 1500 } },
      { id: 'fire6', name: 'היכל שליט האש', short: 'היכל שליט האש', diff: 'אגדי', cp: 5600, icon: 'whatshot', pos: [15, 18], boss: true,
        opp: 'zuko', alt: 'toph', map: 'fire', skill: 1.6, bossLabel: 'שליט האש',
        desc: 'כס האש בלב הקלדרה. שליט האש מחכה בהיכל, והברק בידיו.',
        obj: [OBJ.win(), OBJ.ult(), OBJ.clean()], reward: { coins: 3000, xp: 2500 }, perk: { kind: 'title', text: 'התואר "אלוף ארבעת העולמות"' } },
    ],
  },
];

// ממלכה נפתחת אחרי שמנצחים את הבוס של הקודמת (האוויר פתוחה מההתחלה)
export function realmOpen(realm, cleared) {
  const i = REALMS.findIndex((r) => r.id === realm.id);
  if (i <= 0) return true;
  const prev = REALMS[i - 1];
  return cleared.includes(prev.stages[prev.stages.length - 1].id);
}

export const realmById = (id) => REALMS.find((r) => r.id === id) || REALMS[0];
export const START_CHARS = ['zuko', 'katara', 'toph']; // אנג נפתח בניצחון על הבוס

// בודק אילו יעדים הושגו לפי נתוני הקרב
export function evalObjectives(stage, r) {
  return stage.obj.map((o) => {
    switch (o.t) {
      case 'win': return r.won;
      case 'clean': return r.won && r.stocksLeft >= 3;
      case 'time': return r.won && r.time <= o.n;
      case 'moves': return r.won && r.movesUsed >= o.n;
      case 'ult': return r.won && r.ultUsed;
      case 'lowDmg': return r.won && r.dmg < o.n;
      default: return false;
    }
  });
}
