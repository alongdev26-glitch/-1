// מפות. הפלטפורמות הן מקור האמת גם לפיזיקה (Fight.js) וגם לציור (src/ui/maps.js).
// האי הראשי תמיד בגובה 348 (האפקטים ב-src/fx/moves.js מניחים את זה). x = מרכז, top = גובה פני השטח, w = רוחב.
// מרווח הקומות (כ-86 פיקסלים) קטן מגובה הקפיצה, כך שאפשר לטפס בין הקומות.
export const FLOOR = 348;
const mk = (mainW, floats) => [{ x: 480, top: FLOOR, w: mainW, main: true }, ...floats];

export const MAPS = [
  {
    id: 'sunset', name: 'אי בשקיעה', element: 'air',
    sky: ['#b07159', '#e19d71', '#fad5aa'], sun: { color: '#fffae4', x: 50, y: 62, r: 62 },
    hills: ['#b97864', '#8f574d', '#673c38'],
    slab: { top: '#8d99a6', rim: '#555f69', face: '#303840', deep: '#1f2429', facet: '#3d4650' },
    ambient: { type: 'cloud', color: '#ffe9c8' },
    platforms: mk(560, [{ x: 270, top: 262, w: 140 }, { x: 690, top: 262, w: 140 }, { x: 480, top: 176, w: 150 }]),
  },
  {
    id: 'air', name: 'מקדש האוויר', element: 'air',
    sky: ['#4fa8ee', '#9ed3f6', '#eaf7ff'], sun: { color: '#ffffff', x: 22, y: 24, r: 46 },
    hills: ['#d6eaf8', '#b6d6ef', '#92bde2'],
    slab: { top: '#eef3ec', rim: '#bccabf', face: '#8fa59a', deep: '#6b8277', facet: '#a9bcb0' },
    ambient: { type: 'cloud', color: '#ffffff' },
    platforms: mk(520, [{ x: 210, top: 268, w: 130 }, { x: 750, top: 268, w: 130 }, { x: 480, top: 188, w: 170 }]),
  },
  {
    id: 'water', name: 'קוטב המים', element: 'water',
    sky: ['#050f2a', '#0d2a55', '#1d5f9c'], sun: { color: '#e8f4ff', x: 78, y: 22, r: 34 }, aurora: true,
    hills: ['#2a5f94', '#1b4271', '#11294a'],
    slab: { top: '#e6f7ff', rim: '#a4d6f0', face: '#5aa6d4', deep: '#2f6f9f', facet: '#7cbde3' },
    ambient: { type: 'snow', color: '#ffffff' },
    platforms: mk(600, [{ x: 290, top: 266, w: 150 }, { x: 670, top: 266, w: 150 }, { x: 480, top: 180, w: 120 }]),
  },
  {
    id: 'earth', name: 'קניון האדמה', element: 'earth',
    sky: ['#7a5a35', '#c9a066', '#f1dba4'], sun: { color: '#fff3c8', x: 70, y: 34, r: 50 }, canyon: true,
    hills: ['#a67846', '#7d5632', '#5a3b20'],
    slab: { top: '#b99c6c', rim: '#7e6340', face: '#5b4529', deep: '#3a2b19', facet: '#6e5433' },
    ambient: { type: 'dust', color: '#e4c895' },
    platforms: mk(560, [{ x: 245, top: 258, w: 130 }, { x: 715, top: 258, w: 130 }, { x: 480, top: 176, w: 150 }]),
  },
  {
    id: 'fire', name: 'הר הגעש', element: 'fire',
    sky: ['#1d0605', '#7a1a0c', '#e8541c'], sun: { color: '#ffb066', x: 50, y: 70, r: 70 }, lava: true,
    hills: ['#4a1410', '#2f0c0a', '#1a0605'],
    slab: { top: '#6f5b58', rim: '#3d2f2c', face: '#2a1f1d', deep: '#150f0e', facet: '#3b2a27', crack: '#ff7a1c' },
    ambient: { type: 'ember', color: '#ffb34a' },
    platforms: mk(540, [{ x: 265, top: 264, w: 140 }, { x: 695, top: 264, w: 140 }, { x: 480, top: 186, w: 130 }]),
  },
];

export const mapById = (id) => MAPS.find((m) => m.id === id) || MAPS[0];
