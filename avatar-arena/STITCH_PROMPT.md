# פרומפט ל-Google Stitch – שלב בסיס ועיצוב

הוראות: ב-Stitch בחר **App → Mobile**, ולאחר מכן **Landscape** (אם אין, כתוב בפרומפט "landscape 16:9").
הדבק את **הפרומפט הראשי**, ואחרי שהמסכים נוצרו הדבק את **פרומפטי ההמשך** אחד אחד.
הפרומפטים באנגלית כי Stitch מבין אותם יותר טוב. את הטקסטים במסכים אפשר להחליף לעברית בסוף.

---

## פרומפט ראשי

```
Design a mobile LANDSCAPE (16:9, 960x540) 2D fighting game UI called "AVATAR ARENA" — a Smash-Bros-style platform brawler where elemental benders fight on floating arenas. Original UI, no official logos or trademarks.

VISUAL STYLE
- Hand-painted 2D fantasy look, East-Asian-inspired ornaments (circular emblems, brush-stroke dividers, subtle paper/ink texture).
- Dark twilight background (deep navy #101828 to indigo #2a3a6b with a warm sunset glow #f0a868 at the horizon, distant mountain silhouettes).
- Panels: semi-transparent dark glass cards (#1e293b at 85% opacity), 2px borders, rounded corners 14px, soft glow in the active element's color.
- Primary accent: golden yellow #ffd166 for titles, selected states and primary buttons (dark text #0b0f1a on gold).
- Element palette (use consistently): Air = pale sky blue #cfe8ff, Water = ocean blue #3a8dde, Earth = brown #8a6a3b with green #4f8f4f, Fire = orange-red #e8541c.
- Typography: bold rounded display font for titles; clean sans (Rubik-like) for body. Hebrew-friendly, RTL layout (all text right-to-left, labels aligned right).
- Touch-first: every button at least 64px, generous spacing, thumbs-friendly, safe margins 24px.

SCREENS (design all 6, same style, landscape)
1. MAIN MENU: big logo "AVATAR ARENA" top center with four small element emblems (air swirl, water wave, earth mountain, fire flame) under it. Big gold button "התחל קרב" (Start Battle). Smaller buttons: "מסלול סיפור" (Story, shown locked), "דמויות" (Characters), "הגדרות" (Settings). Painted mountain background.
2. CHARACTER SELECT: 4 tall character cards in a row (Aang – Air, Katara – Water, Toph – Earth, Zuko – Fire), each with a placeholder portrait area, name, element emblem, a power-level badge (tier 1-4, as stars), and 3 thin stat bars (speed, weight, power). Selected card has gold border + glow. Bottom bar: "כמה בוטים?" with a 1 / 2 / 3 segmented control and a big gold "קדימה" button. Show one extra locked card (padlock, "נפתח בשלב 4") to hint at unlockable characters.
3. PRE-FIGHT / VS SCREEN: split diagonal, player on one side, bots on the other, names and element colors, "VS" in the center, short loading bar.
4. IN-FIGHT HUD + TOUCH CONTROLS: floating stone arena in the middle (one wide main platform, two small floating platforms), sunset mountains behind. Top: up to 4 compact fighter panels (name, big damage percent like "47%", stock dots for 3 lives, element-colored border). Bottom-left: translucent circular D-pad buttons ◀ ▶. Bottom-right: circular buttons — Attack (large), Special ability (medium, with circular cooldown ring), Jump (medium). Buttons are semi-transparent white at 16% so they don't hide the action. Small pause icon top-right.
5. PAUSE MENU: centered glass card over a dimmed fight; buttons "המשך" (Resume), "התחל מחדש" (Restart), "לתפריט" (Quit).
6. RESULTS: "ניצחת! 🏆" or "הפסדת..." big title, winner portrait, small stats (KOs, damage dealt), buttons "שוב" (Again) and "לתפריט" (Menu). On win, show a "דמות חדשה נפתחה!" (New character unlocked) banner.

KEEP CONSISTENT: same button style, same card style, same icon set (simple rounded line icons), same gold accent across all screens.
```

---

## פרומפטי המשך (לדיוק אחרי שיש מסכים)

**לחידוד כרטיסי הדמויות:**
```
On the character select screen: make each card feel like a collectible. Add a soft element-colored aura behind the portrait (swirling wind for Air, ripples for Water, floating rocks for Earth, embers for Fire). Keep text readable and the cards equal size.
```

**למסך הקרב:**
```
On the in-fight screen: make the arena look hand-painted and readable — clear platform edges so players can see where they can stand, no clutter in the center, UI elements pushed to the screen edges so the action stays visible. Add a subtle vignette.
```

**לאחידות:**
```
Unify all screens into one design system: list the colors, corner radius, button sizes, icon style and type scale you used, and apply them identically on every screen.
```

---

## מה קורה אחרי Stitch
1. מוציאים מ-Stitch את מסכי התפריט (ייצוא תמונות או קוד).
2. בשלב 1 הם יהפכו למסכי Menu / Select / HUD במשחק.
3. קודם נחליט על **פלטת הצבעים והסגנון** ואז נעדכן את הקוד, כדי שהכול ייראה אחיד.
