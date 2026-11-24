// מצלמה עוקבת: מרכז ההגדלה והזום לפי הלוחמים, בטווח קטן. אותם ערכים מועברים גם למצלמה של Phaser כדי שהאפקטים יישארו מיושרים.
export class FollowCam {
  constructor() { this.cx = 480; this.cy = 270; this.zoom = 1; }
  update(fighters) {
    const a = fighters.filter((f) => f.stocks > 0 && f.active !== false);
    if (!a.length) return this;
    const xs = a.map((f) => f.x), ys = a.map((f) => Math.min(f.y, 420));
    const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(...xs) - Math.min(...xs);
    const tz = Math.max(0.95, Math.min(1.1, 1.14 - span / 1500));
    const tx = Math.max(430, Math.min(530, 480 + (mx - 480) * 0.3));
    const ty = Math.max(250, Math.min(300, 270 + (my - 300) * 0.25));
    this.cx += (tx - this.cx) * 0.06; this.cy += (ty - this.cy) * 0.06; this.zoom += (tz - this.zoom) * 0.05;
    return this;
  }
}
