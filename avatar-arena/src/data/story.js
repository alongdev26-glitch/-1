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
    id: 'air', name: 'מקדשי האוויר', sub: 'מסלול סיפור • מקדש הרוח הצפוני', element: 'air', icon: 'air', ready: true,
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
  { id: 'water', name: 'שבט המים', sub: 'בקרוב', element: 'water', icon: 'water_drop', ready: false, stages: [] },
  { id: 'earth', name: 'ממלכת האדמה', sub: 'בקרוב', element: 'earth', icon: 'landscape', ready: false, stages: [] },
  { id: 'fire', name: 'אומת האש', sub: 'בקרוב', element: 'fire', icon: 'local_fire_department', ready: false, stages: [] },
];

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
