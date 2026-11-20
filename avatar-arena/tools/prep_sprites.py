"""חיתוך והסרת רקע מאיורי הדמויות והפוזות (חד-פעמי).
שימוש: python3 tools/prep_sprites.py <תיקיית מקור>

קבצי מקור לעמידה:  zuko.png, toph.jpg, aang.jpg, katara.jpg  (צילומי מסך נחתכים לפס y 257..1334)
קבצי מקור לפוזות:  {id}_{pose}.png|jpg  למשל zuko_attack.png  (pose: attack, special, hit, jump)
אחרי הוספת פוזה צריך להוסיף את שמה לרשימת poses של הדמות ב-src/data/characters.js."""
import sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'
OUT.mkdir(parents=True, exist_ok=True)
H = 256  # גובה סופי של הספרייט
POSES = ('attack', 'special', 'hit', 'jump')

# name: (קובץ, חיתוך, טולרנס רקע, אזורים למחיקה (x0,y0,x1,y1) ביחס לחיתוך)
JOBS = {
    'zuko':   ('zuko.png', None, 26, [(0, 0, 90, 370), (740, 460, 990, 575)]),
    'toph':   ('toph.jpg', (0, 257, 1080, 1334), 16, [(900, 0, 1080, 160)]),
    'aang':   ('aang.jpg', (0, 257, 1080, 1334), 22, [(900, 0, 1080, 160)]),
    'katara': ('katara.jpg', (0, 257, 1080, 1334), 22, [(900, 0, 1080, 160)]),
}


def flood(close, seeds_from_border=True, seeds=None):
    h, w = close.shape
    mask = np.zeros_like(close)
    dq = deque()
    if seeds is not None:
        for y, x in seeds:
            dq.append((y, x))
    else:
        for x in range(w):
            for y in (0, h - 1):
                if close[y, x] and not mask[y, x]: mask[y, x] = True; dq.append((y, x))
        for y in range(h):
            for x in (0, w - 1):
                if close[y, x] and not mask[y, x]: mask[y, x] = True; dq.append((y, x))
    return mask, dq


def spread(mask, dq, allowed):
    h, w = allowed.shape
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and allowed[ny, nx] and not mask[ny, nx]:
                mask[ny, nx] = True; dq.append((ny, nx))


def process(path, out_name, box, tol, wipes, katara_shadow=False):
    im = Image.open(path).convert('RGB')
    if box: im = im.crop(box)
    a = np.array(im).astype(int)
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(edge, axis=0)
    for x0, y0, x1, y1 in wipes:           # מחיקת טקסט וכפתורי ממשק
        a[y0:y1, x0:x1] = bg
    close = np.abs(a - bg).max(axis=2) <= tol
    mask, dq = flood(close)
    spread(mask, dq, close)
    h, w = close.shape
    if katara_shadow:  # צל רצפה: טולרנס גבוה רק בשורות התחתונות (לא נוגעים בשיער)
        close2 = (np.abs(a - bg).max(axis=2) <= 48) & (np.arange(h)[:, None] >= int(h * 0.72))
        spread(mask, deque(zip(*np.nonzero(mask))), close2)
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), np.where(mask, 0, 255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    img = img.crop(img.getchannel('A').getbbox())
    img = img.resize((max(1, round(img.width * H / img.height)), H), Image.LANCZOS)
    img.save(OUT / f'{out_name}.png')
    print(out_name, img.size)


for name, (fn, box, tol, wipes) in JOBS.items():
    if (SRC / fn).exists():
        process(SRC / fn, name, box, tol, wipes, katara_shadow=(name == 'katara'))

# פוזות נוספות: {id}_{pose}.png|jpg, ללא חיתוך מסך (איור נקי עם רקע אחיד)
for name in JOBS:
    for pose in POSES:
        for ext in ('png', 'jpg', 'jpeg'):
            f = SRC / f'{name}_{pose}.{ext}'
            if f.exists():
                process(f, f'{name}_{pose}', None, 24, [])

# פורטרטים: חיתוך הראש מכל ספרייט (x0, y0, x1, y1 בפיקסלים של הספרייט שגובהו 256)
FACES = {
    'aang':   (78, 40, 178, 140),
    'katara': (70, 30, 190, 150),
    'toph':   (40, 0, 150, 110),
    'zuko':   (80, 0, 190, 110),
}
for name, box in FACES.items():
    if (OUT / f'{name}.png').exists():
        Image.open(OUT / f'{name}.png').crop(box).save(OUT / f'{name}_face.png')
