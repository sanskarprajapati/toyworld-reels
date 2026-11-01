// The hot-air balloon: striped envelope (lathe, scalloped gores, parachute vent), wicker basket, burner frame and flame,
// load cables; plus the thin plastic bag from the opening. Every pose is set per frame from scratch.
import * as THREE from 'three';
import { plain, soft, metal, box, cyl, ball, mesh, group, deg, ropeMesh, setRope, mulberry, clamp, noise1 } from '../lib/util.js';
import { ALL } from '../lib/fx.js';

// rig heights above the basket floor (m)
export const RIG = { rim: 1.0, burner: 2.15, mouth: 3.3, w: 1.3 };
const GORES = 16;
// bedsheets: the neighbour's (striped, plain and one with flowers)
const GORE_COLS = ['#e8423a', '#ffd23f', '#2f7fd8', '#f6f2e8', '#e8423a', '#ff8a2a', '#2f7fd8', '#f6f2e8'];

// unit profile (mouth at h = 0), scaled so the volume is 600 m³
function profile() {
  const hc = 6.6, R = 4.4, pts = [];
  for (let i = 0; i <= 26; i++) { const h = hc * i / 26; pts.push([1.0 + (R - 1.0) * Math.sin(Math.PI / 2 * h / hc) ** 0.9, h]); }
  const a0 = Math.acos(1.4 / R);                    // the vent hole at the crown (radius 1.4)
  for (let i = 1; i <= 22; i++) { const a = a0 * i / 22; pts.push([R * Math.cos(a), hc + R * Math.sin(a)]); }   // equator up to the vent ring
  let V = 0;
  for (let i = 1; i < pts.length; i++) { const r = (pts[i][0] + pts[i - 1][0]) / 2; V += Math.PI * r * r * (pts[i][1] - pts[i - 1][1]); }
  V += Math.PI * 1.4 ** 2 * 0.25;                   // the vent cap
  const k = Math.cbrt(600 / V);
  return { pts: pts.map(([r, h]) => [r * k, h * k]), k, hc: hc * k, R: R * k, a0, top: (hc + R) * k };
}
export const ENV = profile();

function goreTexture() {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), gw = W / GORES;
  for (let i = 0; i < GORES; i++) {
    const col = GORE_COLS[i % GORE_COLS.length];
    g.fillStyle = col; g.fillRect(i * gw, 0, gw + 1, H);
    if (i % 8 === 3) {                               // one sheet has white polka dots
      g.fillStyle = '#ffffff';
      for (let y = 20; y < H; y += 46) for (let x = 14 + ((y / 46) % 2) * 22; x < gw; x += 44) { g.beginPath(); g.arc(i * gw + x, y, 9, 0, 7); g.fill(); }
    }
    if (i % 8 === 7) {                               // and one has thin blue pinstripes
      g.fillStyle = 'rgba(47,127,216,0.55)';
      for (let x = 10; x < gw; x += 22) g.fillRect(i * gw + x, 0, 5, H);
    }
  }
  g.fillStyle = 'rgba(40,30,30,0.55)';
  for (let i = 0; i <= GORES; i++) g.fillRect(i * gw - 3, 0, 6, H);             // load tapes
  for (let j = 1; j < 9; j++) g.fillRect(0, j * H / 9 - 1.5, W, 3);              // horizontal seams
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function wickerTexture() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'); g.fillStyle = '#b07a3e'; g.fillRect(0, 0, N, N);
  for (let y = 0; y < N; y += 16) for (let x = 0; x < N; x += 32) {
    const off = (y / 16) % 2 ? 16 : 0;
    const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#d9a868'); gr.addColorStop(0.5, '#c8924f'); gr.addColorStop(1, '#8a5a2a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + off + 8, y + 8, 15, 7, 0, 0, 7); g.fill();
  }
  g.fillStyle = 'rgba(70,40,15,0.6)';
  for (let x = 0; x < N; x += 32) g.fillRect(x + 23, 0, 3, N);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}

function envelopeGeo() {
  const g = new THREE.LatheGeometry(ENV.pts.map(([r, h]) => new THREE.Vector2(r, h)), 128);
  const p = g.attributes.position;
  // gores bulge between the load tapes
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i), th = Math.atan2(x, z);
    const b = 1 + 0.022 * Math.abs(Math.sin(th * GORES / 2)) * Math.min(1, y / 2);
    p.setX(i, x * b); p.setZ(i, z * b);
  }
  g.computeVertexNormals();
  g.userData.base = p.array.slice();
  return g;
}

export function buildBalloon(scene) {
  const B = {};
  // ---------- envelope: E sits at the mouth, axis along local +y ----------
  B.E = group(scene, [0, 0, 0], [0, 0, 0], 'envelope');
  B.E.rotation.order = 'YZX';
  B.goreTex = goreTexture();
  const envM = new THREE.MeshPhysicalMaterial({ map: B.goreTex, roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide, specularIntensity: 0.4 });
  B.env = mesh(envelopeGeo(), envM, B.E);
  // the vent: a cap on the crown hole, pulled down inside when the red rope is pulled
  const capGeo = new THREE.SphereGeometry(ENV.R, 48, 8, 0, Math.PI * 2, 0, Math.PI / 2 - ENV.a0 + 0.06);
  B.vent = mesh(capGeo, new THREE.MeshPhysicalMaterial({ color: '#e8423a', roughness: 0.55, sheen: 0.4, side: THREE.DoubleSide }), B.E, [0, ENV.hc, 0]);
  // skirt below the mouth (fire-proof dark fabric)
  const skirt = new THREE.CylinderGeometry(ENV.pts[0][0] * 1.0, ENV.pts[0][0] * 0.92, 0.55, 32, 1, true);
  mesh(skirt, plain('#7a2a26', 0.9, { extra: { side: THREE.DoubleSide } }), B.E, [0, -0.25, 0]);
  // temperature gauge stuck on the envelope (shot 26)
  B.gauge = gauge(B.E);
  // ghost copy for the "how many cubic metres" diagram
  B.ghost = new THREE.Mesh(B.env.geometry, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(B.ghost); ALL.push({ mesh: B.ghost, billboard: null });
  B.ghostWire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.LatheGeometry(ENV.pts.filter((_, i) => i % 4 === 0).map(([r, h]) => new THREE.Vector2(r, h)), 16)),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }));
  B.ghost.add(B.ghostWire);

  // ---------- rig: basket floor at the origin ----------
  B.R = group(scene, [0, 0, 0], [0, 0, 0], 'rig');
  B.R.rotation.order = 'YXZ';
  const wick = plain('#ffffff', 0.9, { extra: { map: wickerTexture() } }), w = RIG.w, h = RIG.rim;
  for (const [x, z, ry] of [[0, w / 2, 0], [0, -w / 2, 0], [w / 2, 0, Math.PI / 2], [-w / 2, 0, Math.PI / 2]]) {
    const wall = box(w + 0.06, h, 0.07, B.R, [x, h / 2, z], wick, 0.03); wall.rotation.y = ry;
  }
  box(w, 0.06, w, B.R, [0, 0.03, 0], wick);
  const suede = soft('#6b3f22', { rough: 0.8, sheen: 0.2 });
  for (const [x, z, ry] of [[0, w / 2, 0], [0, -w / 2, 0], [w / 2, 0, Math.PI / 2], [-w / 2, 0, Math.PI / 2]]) {
    const r = box(w + 0.16, 0.12, 0.14, B.R, [x, h + 0.04, z], suede, 0.05); r.rotation.y = ry;
  }
  const steel = metal('#c9ccd1', 0.3);
  B.poles = [];
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const top = [x * 0.42, RIG.burner + 0.1, z * 0.42], bot = [x * (w / 2 - 0.05), h, z * (w / 2 - 0.05)];
    const len = Math.hypot(top[0] - bot[0], top[1] - bot[1], top[2] - bot[2]);
    const p = cyl(0.025, 0.025, len, B.R, [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2], steel, undefined, 8);
    p.lookAt(new THREE.Vector3(...top).applyMatrix4(B.R.matrixWorld)); p.rotateX(Math.PI / 2);
    B.poles.push(top);
  }
  box(0.9, 0.05, 0.9, B.R, [0, RIG.burner + 0.1, 0], metal('#9a9da3', 0.4), 0.02);
  mesh(new THREE.TorusGeometry(0.22, 0.05, 10, 24), metal('#b8bcc2', 0.25), B.R, [0, RIG.burner, 0], [Math.PI / 2, 0, 0]);
  cyl(0.12, 0.16, 0.22, B.R, [0, RIG.burner - 0.1, 0], metal('#8d9096', 0.35));
  for (const [x, z] of [[0.38, -0.38], [-0.38, -0.38]]) {
    cyl(0.13, 0.13, 0.75, B.R, [x, 0.45, z], soft('#d8dde3', { rough: 0.35 }));
    cyl(0.04, 0.04, 0.08, B.R, [x, 0.86, z], steel);
  }
  // little flags on the frame: show the relative wind (shots 36)
  B.flags = [1, -1].map(s => {
    const f = group(B.R, [s * 0.42, RIG.burner + 0.12, 0.42]);
    cyl(0.01, 0.01, 0.5, f, [0, 0.25, 0], steel, undefined, 6);
    const cloth = mesh(new THREE.PlaneGeometry(0.32, 0.2), soft(s > 0 ? '#ffd23f' : '#e8423a', { side: THREE.DoubleSide }), f, [0.16, 0.4, 0]);
    f.userData.cloth = cloth;
    return f;
  });
  // flame: two additive cones + a light
  const flameM = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  B.flame = group(B.R, [0, RIG.burner + 0.08, 0]);
  B.flameOuter = mesh(new THREE.ConeGeometry(0.28, 1.6, 20, 1, true), flameM('#ff8a2a', 0.85), B.flame, [0, 0.8, 0]);
  B.flameInner = mesh(new THREE.ConeGeometry(0.14, 0.9, 16, 1, true), flameM('#bfe2ff', 0.9), B.flame, [0, 0.45, 0]);
  for (const m of [B.flameOuter, B.flameInner]) { m.castShadow = false; ALL.push({ mesh: m, billboard: null }); }
  B.light = new THREE.PointLight('#ff9a40', 0, 9, 1.6); B.light.position.set(0, RIG.burner + 0.6, 0); B.R.add(B.light);
  // steering wheel (shots 33-34) on a stick at the rim
  B.wheel = group(B.R, [0, h + 0.25, w / 2 + 0.05], [deg(-20), 0, 0]);
  mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28), soft('#3a2a20', { rough: 0.5 }), B.wheel);
  for (let i = 0; i < 3; i++) box(0.4, 0.025, 0.025, B.wheel, [0, 0, 0], soft('#3a2a20')).rotation.z = i * Math.PI / 3;
  B.wheelStick = cyl(0.02, 0.02, 0.3, B.R, [0, h + 0.1, w / 2 + 0.02], steel, undefined, 6);
  // load cables (frame corners -> mouth) and the red vent rope (mouth -> Ben's hand)
  B.cables = [0, 1, 2, 3].map(() => { const r = ropeMesh(plain('#3b3b3b', 0.6), 0.012); scene.add(r); return r; });
  B.ventRope = ropeMesh(plain('#d8232a', 0.6), 0.016); scene.add(B.ventRope);
  // the rolled-up envelope while it is unrolled across the lawn (shot 13)
  const rollTex = B.goreTex.clone(); rollTex.needsUpdate = true; rollTex.repeat.set(1, 3);
  B.roll = mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 32), new THREE.MeshStandardMaterial({ map: rollTex, roughness: 0.6 }), scene);
  B.tether = ropeMesh(plain('#e9dcbf', 0.8), 0.018, true); scene.add(B.tether);
  return B;
}

// round dial gauge, 0..120 °C, on the envelope's equator facing +z
function gauge(E) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#fbfaf5'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  g.lineWidth = 18; g.strokeStyle = '#2a2a2e'; g.stroke();
  const ang = v => deg(-225 + 270 * v / 120);
  g.lineCap = 'round';
  for (let v = 0; v <= 120; v += 10) {
    const a = ang(v), big = v % 20 === 0;
    g.strokeStyle = v >= 90 ? '#e8423a' : v <= 30 ? '#2f7fd8' : '#2a2a2e'; g.lineWidth = big ? 10 : 5;
    g.beginPath(); g.moveTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); g.lineTo(256 + Math.cos(a) * (big ? 160 : 180), 256 + Math.sin(a) * (big ? 160 : 180)); g.stroke();
    if (big) { g.fillStyle = '#2a2a2e'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v, 256 + Math.cos(a) * 118, 256 + Math.sin(a) * 118); }
  }
  g.font = 'bold 52px sans-serif'; g.fillText('°C', 256, 380);
  const hv = ang(67);    // the hover line: hotter than this and it rises
  g.strokeStyle = '#2bb34a'; g.lineWidth = 16; g.beginPath(); g.moveTo(256 + Math.cos(hv) * 228, 256 + Math.sin(hv) * 228); g.lineTo(256 + Math.cos(hv) * 150, 256 + Math.sin(hv) * 150); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const y = ENV.hc - 1.2, r = ENV.pts.reduce((best, p) => (Math.abs(p[1] - y) < Math.abs(best[1] - y) ? p : best))[0];
  const G = group(E, [0, y, r * 1.03 + 0.25], [deg(-6), 0, 0]);
  cyl(0.62, 0.62, 0.08, G, [0, 0, -0.02], metal('#b8bcc2', 0.3), [Math.PI / 2, 0, 0], 40);
  mesh(new THREE.CircleGeometry(0.56, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }), G, [0, 0, 0.025]);
  const needle = group(G, [0, 0, 0.05]);
  box(0.42, 0.04, 0.02, needle, [0.17, 0, 0], plain('#d8232a', 0.4));
  ball(0.05, needle, [0, 0, 0], metal('#333', 0.3), null, 12);
  G.userData.needle = needle; G.userData.ang = v => -ang(clamp(v, 0, 120));
  return G;
}

// ---------- per-frame posing ----------
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion();

// fill: 0 flat .. 1 taut; lay: 0 upright .. 1 lying along +x (heading yaw) ; ripple: fabric flutter amount
export function poseEnvelope(B, o) {
  const { fill = 1, lay = 0, t = 0, ripple = 0, axial = 1, yaw = 0, flat = 0 } = o;
  const g = B.env.geometry, p = g.attributes.position, base = g.userData.base;
  const fr = 0.12 + 0.88 * fill;
  for (let i = 0; i < p.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], th = Math.atan2(x, z);
    let r = fr;
    if (ripple > 0) r *= 1 + ripple * (0.05 * Math.sin(th * 24 + y * 1.7 + t * 9) + 0.04 * noise1(y * 0.7 + t * 3, Math.floor(th * 3)));
    if (fill < 1) r *= 1 - (1 - fill) * 0.18 * Math.abs(Math.sin(th * GORES / 2));   // slack fabric sags between the tapes
    p.array[i * 3] = x * r; p.array[i * 3 + 1] = y * axial; p.array[i * 3 + 2] = z * r;
  }
  p.needsUpdate = true; g.computeVertexNormals();
  // lying, the fabric settles: flatten vertically (local x when lying along +x)
  const squash = lay > 0.5 ? 1 - flat : 1;
  B.E.scale.set(1 - lay * (1 - squash) * 1, 1, 1);
  B.E.rotation.set(0, yaw, -deg(90) * lay);
  B.vent.position.set(0, ENV.hc + (axial - 1) * ENV.hc, 0);
  B.vent.scale.set(fr, axial, fr);
  return fr;
}

// envelope radius (m) at the widest point for a fill
export const envRadius = fill => ENV.R * (0.12 + 0.88 * fill);

// place the whole balloon upright in flight: basket floor at pos, tilt [x, z] (rad)
export function flyRig(B, pos, o = {}) {
  const R = B.R; R.visible = true; B.E.visible = true;
  R.position.set(...pos); R.rotation.set(o.tiltX ?? 0, o.yaw ?? 0, o.tiltZ ?? 0);
  R.updateMatrixWorld(true);
  poseEnvelope(B, { fill: o.fill ?? 1, t: o.t ?? 0, ripple: o.ripple ?? 0, yaw: 0 });
  // envelope hangs from the rig: same orientation, mouth above the burner
  _v.set(0, RIG.mouth, 0).applyMatrix4(R.matrixWorld);
  B.E.position.copy(_v); B.E.quaternion.copy(R.quaternion);
  B.E.updateMatrixWorld(true);
  cables(B);
}

export function cables(B) {
  const R = B.R, E = B.E, mr = ENV.pts[0][0] * 0.98;
  B.R.updateMatrixWorld(true); E.updateMatrixWorld(true);
  B.poles.forEach((top, i) => {
    const a = new THREE.Vector3(...top).applyMatrix4(R.matrixWorld);
    const ang = Math.PI / 4 + i * Math.PI / 2, s = [[1, 1], [1, -1], [-1, 1], [-1, -1]][i];
    const b = new THREE.Vector3(s[0] * mr * 0.707, -0.85, s[1] * mr * 0.707).applyMatrix4(E.matrixWorld);
    setRope(B.cables[i], [a, b]);
  });
}

// burner flame on/off with flicker; k 0..1 (1 = a big blast)
export function burn(B, t, k) {
  const on = k > 0.01;
  B.flame.visible = on; B.flameOuter.visible = B.flameInner.visible = on;
  const f = 1 + 0.18 * Math.sin(t * 47) + 0.12 * Math.sin(t * 83 + 1);
  B.flame.scale.set(0.8 + 0.4 * k, k * f * (1 + 0.6 * k), 0.8 + 0.4 * k);
  B.light.intensity = on ? 22 * k * f : 0;
}

export function hideBalloon(B) {
  B.E.visible = false; B.R.visible = false; B.ghost.visible = false; B.wheel.visible = false; B.wheelStick.visible = false;
  B.cables.forEach(c => { c.visible = false; }); B.ventRope.visible = false; B.tether.visible = false;
  B.flame.visible = false; B.light.intensity = 0; B.gauge.visible = true; B.roll.visible = false;
  const m = B.env.material; if (m.emissiveIntensity) { m.emissiveIntensity = 0; m.emissive.set('#000000'); }
  B.E.scale.set(1, 1, 1);
  B.flags.forEach(f => { f.rotation.set(0, 0, 0); });
}

// ---------- the thin plastic bag (mouth down) ----------
export function buildBag(scene) {
  // profile from the crown (top, r 0) down to the mouth (bottom, open)
  // round crown (top) down to a slightly narrower open mouth
  const prof = [];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; prof.push(new THREE.Vector2(Math.max(0.001, 0.31 * Math.sin(a)), 0.8 - 0.31 * (1 - Math.cos(a)))); }
  for (let i = 1; i <= 10; i++) { const k = i / 10; prof.push(new THREE.Vector2(0.31 - 0.07 * k * k, 0.49 * (1 - k))); }
  const g = new THREE.LatheGeometry(prof, 48);
  g.userData.base = g.attributes.position.array.slice();
  const m = new THREE.MeshPhysicalMaterial({ color: '#fbfcfd', roughness: 0.42, transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false, sheen: 0.2, sheenColor: new THREE.Color('#ffffff'), specularIntensity: 0.6, envMapIntensity: 0.35 });
  const bag = new THREE.Mesh(g, m); bag.castShadow = true; bag.renderOrder = 5;
  const G = group(scene, [0, 0, 0], [0, 0, 0], 'bag'); G.add(bag);
  ALL.push({ mesh: bag, billboard: null });
  G.userData.bag = bag;
  // the two carrier handles at the mouth make it read as a shopping bag
  for (const s of [1, -1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 18, Math.PI), m);
    h.position.set(0.11 * s, 0.0, 0); h.rotation.set(Math.PI, 0, 0); bag.add(h);
  }
  // tie string (to the cookie / Ben's belt)
  G.userData.string = ropeMesh(plain('#f2f2f2', 0.7), 0.006); scene.add(G.userData.string);
  return G;
}
// fill 0 (limp, crumpled) .. 1 (round); origin at the mouth, crown up
export function poseBag(G, fill, t, o = {}) {
  G.visible = true; G.userData.bag.visible = true;
  const g = G.userData.bag.geometry, p = g.attributes.position, base = g.userData.base;
  for (let i = 0; i < p.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], th = Math.atan2(x, z);
    const crumple = (1 - fill) * (0.45 * Math.abs(Math.sin(th * 3 + y * 6)) + 0.25 * noise1(y * 9 + th * 4, 3));
    const r = (0.35 + 0.65 * fill) * (1 - crumple) * (1 + 0.03 * fill * Math.sin(t * 7 + th * 2) * (o.wobble ?? 1));
    p.array[i * 3] = x * r; p.array[i * 3 + 2] = z * r;
    p.array[i * 3 + 1] = y * (0.55 + 0.45 * fill) - (1 - fill) * 0.15 * Math.abs(x);
  }
  p.needsUpdate = true; g.computeVertexNormals();
}
