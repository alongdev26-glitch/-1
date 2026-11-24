// עזרים לבניית זירות תלת-מימדיות. הכתיבה היא בפיקסלים של המסך (כמו במשחק), והעזרים ממירים לעולם התלת-מימדי.
import * as THREE from 'three';

export const DIST = 1500;                 // מרחק המצלמה ממישור המשחק (z=0)
export const sc = (z) => (DIST - z) / DIST;   // יחס הקטנה בפרספקטיבה לעומק z
// ממקם נקודה כך שתיראה במיקום המסך (xs,ys) כשהיא בעומק z
export const at = (xs, ys, z) => new THREE.Vector3((xs - 480) * sc(z), (270 - ys) * sc(z), z);

// מחולל אקראי עם זרע (אותה זירה בכל פעם)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const flat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.92, metalness: 0.05, ...extra });
export const glow = (color) => new THREE.MeshBasicMaterial({ color });

// סלע לואו-פולי: איקוסהדרון מעוות
export function rockGeometry(seed, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail), r = rng(seed), p = g.attributes.position;
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!map.has(k)) map.set(k, 0.72 + r() * 0.5);
    const s = map.get(k);
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
}

// עמוד סלע מפותל (Lathe עם רדיוס משתנה)
export function pillarGeometry(h, r0, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector2(r0 * (0.62 + 0.38 * Math.abs(Math.sin(i * 1.3 + r() * 2))) * (1 - i * 0.012), (i / 12) * h));
  return new THREE.LatheGeometry(pts, 8);
}

// שיידר זורם (מפל / לבה): גרדיאנט נע בציר Y וזוהר בקצוות
export function flowMaterial(c1, c2, speed = 0.6, repeat = 3) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) }, uSpeed: { value: speed }, uRep: { value: repeat } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uTime, uSpeed, uRep; uniform vec3 uC1, uC2; varying vec2 vUv;
      void main(){
        float f = fract(vUv.y * uRep - uTime * uSpeed);
        float wob = sin(vUv.x * 18.0 + uTime * 2.0 + vUv.y * 9.0) * 0.5 + 0.5;
        vec3 col = mix(uC1, uC2, pow(clamp(f * 0.8 + wob * 0.35, 0.0, 1.0), 1.6));
        float edge = pow(abs(vUv.x - 0.5) * 2.0, 3.0);
        col = mix(col, uC1 * 0.6, edge * 0.7);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// פלנר רצפת לבה: רעש מונפש עם קרום כהה ולבה זוהרת
export function lavaFloorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz * 0.006;
        float a = n(p * 2.0 + vec2(uTime * 0.05, uTime * 0.03));
        float b = n(p * 5.0 - vec2(uTime * 0.08, 0.0));
        float v = a * 0.6 + b * 0.4;
        vec3 crust = vec3(0.22, 0.05, 0.02), hot = vec3(1.0, 0.78, 0.22), mid = vec3(0.95, 0.25, 0.03);
        vec3 col = mix(mid, hot, smoothstep(0.5, 0.85, v));
        col = mix(col, crust, smoothstep(0.52, 0.34, v) * 0.85);
        float fog = clamp((-vW.z - 100.0) / 1800.0, 0.0, 0.85);
        col = mix(col, vec3(0.30, 0.07, 0.03), fog);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// פלטפורמה טכנולוגית: לוח מתכת עם פס ניאון, פודים, ובראשית גם מנועים
export function techPlatform(p, anim) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x27323b, metalness: 0.55, roughness: 0.5, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b232a, metalness: 0.5, roughness: 0.6, flatShading: true });
  const neon = glow(0x38efff);
  const depth = 140, w = p.w;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 16, depth), metal);
  deck.position.set(0, -8, 0); g.add(deck);
  const hullH = p.main ? 44 : 26;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + 12, 0); shape.lineTo(w / 2 - 12, 0); shape.lineTo(w / 2 - 34, -hullH); shape.lineTo(-w / 2 + 34, -hullH); shape.closePath();
  const hullG = new THREE.ExtrudeGeometry(shape, { depth: depth * 0.7, bevelEnabled: false });
  hullG.translate(0, -16, -depth * 0.35);
  g.add(new THREE.Mesh(hullG, dark));
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w - 24, 3, 4), neon);
  strip.position.set(0, 0.5, depth / 2 + 0.5); g.add(strip);
  const strip2 = strip.clone(); strip2.position.z = -depth / 2 - 0.5; g.add(strip2);
  for (let x = -w / 2 + 26; x < w / 2 - 18; x += p.main ? 52 : 44) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(p.main ? 4 : 3.2, 8, 6), glow(0x7cf6fc));
    pod.position.set(x, -12, depth / 2 + 1); g.add(pod);
  }
  if (p.main) {
    [-1, 1].forEach((s) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(15, 30, 6), dark);
      cone.position.set(s * w * 0.3, -hullH - 26, 0); cone.rotation.z = s * 0.38; cone.rotation.x = Math.PI; g.add(cone);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(8, 36, 8), glow(0xbff9ff));
      flame.position.set(s * (w * 0.3 + 12), -hullH - 60, 0); flame.rotation.z = s * 0.38; flame.rotation.x = Math.PI; g.add(flame);
      anim.push((t) => { flame.scale.set(1, 0.85 + Math.sin(t * 40 + s) * 0.18, 1); });
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), glow(0x34d399));
    core.position.set(0, -hullH - 6, depth * 0.36); g.add(core);
  }
  return g;
}

// צל רך מתחת לדמות
export function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
