# קופת טיול

אפליקציית PWA בעברית (RTL): תקציב יומי בכמה מטבעות, חלוקת הוצאות ו"מי חייב למי", וספירת ימי ויזה. עובדת גם בלי אינטרנט (IndexedDB + Service Worker).

```bash
cd app
npm install
npm run dev     # פיתוח
npm test        # בדיקות הלוגיקה
npm run build   # בנייה ל-app/dist
```

מתפרסמת ב-GitHub Pages ב-`/kupat-tayul/` לצד המשחק (ראה `.github/workflows/pages.yml`).

- `src/logic/`: תקציב, חלוקה, יתרות והעברות מינימליות, ימי ויזה, שערים (פונקציות טהורות)
- `src/data/visa-defaults.json`: ימי ויזה מוצעים, לאמת לפני פרסום
- שערים: open.er-api.com פעם ביום, עם עריכה ידנית. ההוצאה שומרת את השער שלה.
- לא ב-MVP: סנכרון בזמן אמת, PDF, צילום קבלה, תקציב לפי קטגוריה.
