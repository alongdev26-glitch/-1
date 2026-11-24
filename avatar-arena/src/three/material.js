// שיידר "איור מנופח": מזיז קודקודים של מישור צפוף לפי טקסטורת העומק, מחשב נורמלים ותאורה, ושפת אור בצבע האלמנט.
import * as THREE from 'three';

const VERT = `
uniform sampler2D uDepth;
uniform float uThick, uSide, uBump;
uniform vec2 uTexel, uSize;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
float dep(vec2 uv) { return texture2D(uDepth, uv).r; }
void main() {
  vUv = uv;
  float d = dep(uv);
  vec3 p = position; p.z += uSide * d * uThick;
  float dx = dep(uv + vec2(uTexel.x * 2.0, 0.0)) - dep(uv - vec2(uTexel.x * 2.0, 0.0));
  float dy = dep(uv + vec2(0.0, uTexel.y * 2.0)) - dep(uv - vec2(0.0, uTexel.y * 2.0));
  vec3 n = normalize(vec3(-dx * uThick * uBump / (uSize.x * uTexel.x * 4.0), -dy * uThick * uBump / (uSize.y * uTexel.y * 4.0), 1.0));
  n.z *= uSide;
  // רק סיבוב והיפוך (בלי הסקאלה הלא-אחידה של המישור, שהייתה מעוותת את הנורמל)
  mat3 m = mat3(normalize(modelMatrix[0].xyz), normalize(modelMatrix[1].xyz), normalize(modelMatrix[2].xyz));
  vN = normalize(m * n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = `
uniform sampler2D uMap;
uniform float uSide, uAlpha;
uniform vec3 uRim, uGlow, uAmb;
uniform vec4 uTint;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.4) discard;
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(vec3(-0.45, 0.65, 0.75));
  float diff = max(dot(N, L), 0.0);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  vec3 col = c.rgb * (0.74 + 0.5 * diff);
  if (uSide < 0.0) col *= 0.7;
  col *= uAmb;
  col += uGlow * clamp(0.35 - N.y * 0.9, 0.0, 1.0) * 0.5;
  col += uRim * rim * 0.4;
  col = mix(col, uTint.rgb, uTint.a);
  gl_FragColor = vec4(col, c.a * uAlpha);
}`;

export function makeMaterial(side, rimHex) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: true,
    uniforms: {
      uMap: { value: null }, uDepth: { value: null }, uThick: { value: 20 }, uSide: { value: side }, uBump: { value: 0.8 },
      uTexel: { value: new THREE.Vector2(1 / 100, 1 / 100) }, uSize: { value: new THREE.Vector2(100, 100) },
      uRim: { value: new THREE.Color(rimHex) }, uGlow: { value: new THREE.Vector3(0, 0, 0) }, uAmb: { value: new THREE.Vector3(1, 1, 1) }, uTint: { value: new THREE.Vector4(1, 1, 1, 0) }, uAlpha: { value: 1 },
    },
  });
}

// מישור צפוף משותף: מרכזו בבסיס (0,0) ורוחבו 1, גובהו 1, עולה למעלה
let geo = null;
export function sharedGeometry() {
  if (!geo) { geo = new THREE.PlaneGeometry(1, 1, 150, 150); geo.translate(0, 0.5, 0); }
  return geo;
}

export function setEntry(mat, entry, wPx, hPx, thick) {
  mat.uniforms.uMap.value = entry.map;
  mat.uniforms.uDepth.value = entry.depth;
  mat.uniforms.uTexel.value.set(1 / entry.w, 1 / entry.h);
  mat.uniforms.uSize.value.set(wPx, hPx);
  mat.uniforms.uThick.value = thick / 1; // ביחידות עולם (פיקסלים של הבמה); המישור עצמו מוקטן ב-scale
}
