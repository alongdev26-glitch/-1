"""חיתוך והסרת רקע מאיורי הדמויות (חד-פעמי).
שימוש: python3 tools/prep_sprites.py <תיקיית מקור>
קבצי מקור צפויים: zuko.png, toph.jpg, aang.jpg, katara.jpg (צילומי מסך נחתכים לפס y 257..1334)."""
import sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'
OUT.mkdir(parents=True, exist_ok=True)
H = 256  # גובה סופי של הספרייט

# name: (קובץ, חיתוך, טולרנס רקע, אזורים למחיקה (x0,y0,x1,y1) ביחס לחיתוך)
JOBS = {
    'zuko':   ('zuko.png', None, 26, [(0, 0, 90, 370), (740, 460, 990, 575)]),
    'toph':   ('toph.jpg', (0, 257, 1080, 1334), 16, [(900, 0, 1080, 160)]),
    'aang':   ('aang.jpg', (0, 257, 1080, 1334), 22, [(900, 0, 1080, 160)]),
    'katara': ('katara.jpg', (0, 257, 1080, 1334), 22, [(900, 0, 1080, 160)]),
}

def border_median(a):
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    return np.median(edge, axis=0)

for name, (fn, box, tol, wipes) in JOBS.items():
    im = Image.open(SRC / fn).convert('RGB')
    if box: im = im.crop(box)
    a = np.array(im).astype(int)
    bg = border_median(a)
    for x0, y0, x1, y1 in wipes:           # מחיקת טקסט וכפתורי ממשק
        a[y0:y1, x0:x1] = bg
    close = np.abs(a - bg).max(axis=2) <= tol
    h, w = close.shape
    bgmask = np.zeros_like(close)
    dq = deque()
    for x in range(w):
        for y in (0, h - 1):
            if close[y, x] and not bgmask[y, x]: bgmask[y, x] = True; dq.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if close[y, x] and not bgmask[y, x]: bgmask[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and close[ny, nx] and not bgmask[ny, nx]:
                bgmask[ny, nx] = True; dq.append((ny, nx))
    if name == 'katara':  # צל רצפה: מנקים בטולרנס גבוה רק בשורות התחתונות (לא נוגעים בשיער)
        close2 = (np.abs(a - bg).max(axis=2) <= 48) & (np.arange(h)[:, None] >= int(h * 0.72))
        dq = deque(zip(*np.nonzero(bgmask)))
        while dq:
            y, x = dq.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and close2[ny, nx] and not bgmask[ny, nx]:
                    bgmask[ny, nx] = True; dq.append((ny, nx))
    rgba = np.dstack([a.clip(0, 255).astype(np.uint8), np.where(bgmask, 0, 255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    img = img.crop(img.getchannel('A').getbbox())
    img = img.resize((max(1, round(img.width * H / img.height)), H), Image.LANCZOS)
    img.save(OUT / f'{name}.png')
    print(name, img.size)
