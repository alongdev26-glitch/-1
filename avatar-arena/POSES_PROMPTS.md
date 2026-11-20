# פוזות לדמויות: פרומפטים ל-Stitch

המשחק כבר מוכן לפוזות. עד שיהיו תמונות הוא מציג אנימציה בקוד (הטענה, הטיה, ניצוצות), וברגע שמוסיפים קובץ פוזה הוא מחליף את האיור בזמן ההתקפה, היכולת, הפגיעה והקפיצה.

## איך מוסיפים פוזה
1. מפיקים את התמונה ב-Stitch עם הפרומפט למטה (אפשר להעלות את האיור הקיים של הדמות כרפרנס).
2. שומרים אותה בשם `{id}_{pose}.png`, למשל `zuko_attack.png`. ה-id: `aang`, `katara`, `toph`, `zuko`. הפוזות: `attack`, `special`, `hit`, `jump`.
3. מריצים: `python3 tools/prep_sprites.py <תיקיית המקור>` (חותך ומסיר רקע, ושומר ב-`public/sprites/`).
4. מוסיפים את שם הפוזה לרשימה `poses` של הדמות ב-`src/data/characters.js`, למשל `poses: ['attack']`.
אם הפוזה גדולה או קטנה מדי, מכווננים עם `poseScale: { attack: 1.1 }` באותו קובץ.

## תבנית הפרומפט (להחליף את הסוגריים)
```
Pixel-art game sprite of [CHARACTER], same exact character, outfit and pixel-art style as the reference image.
Pose: [POSE DESCRIPTION].
Full body, side view, facing RIGHT, feet near the bottom of the frame, centered.
Plain solid dark background with nothing else, no text, no UI, no border.
```

## תיאורי הפוזות לכל דמות
| דמות | attack | special | hit | jump |
| --- | --- | --- | --- | --- |
| אנג (Aang) | spinning the bo staff forward in a wide swing | both hands thrust forward pushing a gust of wind, air swirls | recoiling backward, off balance, eyes shut in pain | mid-air tucked, one arm up, glider-like airy pose |
| קטרה (Katara) | whipping a water tendril forward in an arc | arms raised sweeping a big wave of water overhead | recoiling backward, water splashing off her | mid-air leap, water ribbon trailing behind |
| טוף (Toph) | punching forward with a fist, rocks bursting | stomping and pulling a boulder up from the ground | knocked back, arms covering the face, dust | mid-air, knees tucked, small rocks floating |
| זוקו (Zuko) | forward flaming punch, fire trail | charging a large fireball in both palms | staggering backward, fire flickering out | mid-air kick pose, flames at the feet |

## הערות
- פוזה חייבת לפנות **ימינה**. אם יוצאת לשמאל, כתבו לי ואגדיר `poseFaces: -1` לדמות.
- רקע אחיד ללא עצמים, אחרת הסרת הרקע תחתוך חלקים מהדמות.
- אותה דמות בכל הפוזות: אותם צבעים, אותו חוט עיצוב, אותו סגנון פיקסלים.
