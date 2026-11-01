// Toy characters (port of blender_lib/characters.py): soft vinyl, big head on a rounded hoodie body, painted 2D face.
// Front is +Z, feet at the root origin, about 1.5 m tall.
// Rig: root > hips > spine > (torso, arms) ; spine > neck (idle sway) > head (looks, nods) > skull, face shells, hair ; hips > legs.
// Every frame the shot calls reset(), then sets pose/face/acting on top: nothing carries over between frames.
import * as THREE from 'three';
import { soft, plain, mesh, group, limbGeo, sphereGeo, ball, box, cyl, deg } from './util.js';

export const SKIN = '#f0b088';
export const CAST = {
  ben: { top: '#f2782c', legs: '#2e58a6', shoes: '#f4f4f4', hair: '#7a4524', hairStyle: 'spiky', face: 'freckles', headband: true },
  narrator: { top: '#43a043', legs: '#c9b27c', shoes: '#6b4a2e', hair: '#3a2a1e', hairStyle: 'cap', cap: '#2e56a0' },
  neighbour: { top: '#4f86cc', legs: '#5a5f66', shoes: '#3a3a3a', hair: null, hairStyle: 'bald' },
  grandma: { top: '#a07ac8', legs: null, shoes: '#7a5a40', hair: '#dcdcdc', hairStyle: 'bun', dress: true, glasses: true },
};

// [armL [flex, abd], armR [flex, abd], legL flex, legR flex, spine flex] in degrees (negative flex = forward)
export const POSES = {
  stand: [[0, 10], [0, -10], 0, 0, 0],
  arms_up: [[0, 155], [0, -155], 0, 0, -5],
  cheer: [[-20, 130], [-20, -130], 0, 0, -5],
  wave: [[0, 12], [-10, -150], 0, 0, 0],
  push: [[-80, 10], [-80, -10], 25, -20, 18],
  sit: [[-35, 18], [-35, -18], -88, -88, 0],
  sit_up: [[0, 150], [0, -150], -88, -88, -5],
  fists: [[-70, 35], [-70, -35], 0, 0, 0],
  point: [[0, 10], [-85, -12], 0, 0, 0],
  hold: [[-60, 12], [-60, -12], 0, 0, 0],
  thumbs: [[0, 10], [-70, -30], 0, 0, 0],
  shrug: [[-35, 45], [-35, -45], 0, 0, 0],
  balance: [[0, 88], [0, -88], 0, 0, 0],
  hip: [[0, 35], [0, -35], 0, 0, 0],
  haul_hi: [[-150, 8], [-120, -8], 0, 0, -8],      // hands up on a rope
  haul_lo: [[-95, 12], [-70, -12], 0, 0, 6],
  sip: [[-20, 12], [-110, -35], 0, 0, 0],
  slump: [[-10, 25], [-10, -25], -80, -80, 25],
  peer: [[-40, 15], [-40, -15], 0, 0, 30],
};

const EYES = ['open', 'blink', 'wide', 'angry', 'lazy', 'shut', 'happy', 'sad', 'raised', 'dizzy', 'look_l', 'look_r'];
const MOUTHS = ['smile', 'grin', 'closed', 'o', 'talk1', 'talk2', 'talk3', 'scream', 'frown', 'flat', 'shout', 'yawn'];
export const MOUTH_ALIAS = { open: 'talk2', talk: 'talk2' };
const GRID = 4, SKULL_R = 0.27, SPAN = 0.54;

// front cap of the skull sphere, UVs by front projection into one atlas cell
function shellGeo(r) {
  const g = new THREE.SphereGeometry(r, 48, 32).toNonIndexed();
  g.scale(1, 1.02, 0.95);
  const p = g.attributes.position, n = g.attributes.normal, keep = [], kn = [], uv = [];
  for (let i = 0; i < p.count; i += 3) {
    let front = true;
    for (let j = 0; j < 3; j++) if (p.getZ(i + j) < r * 0.25) front = false;
    if (!front) continue;
    for (let j = 0; j < 3; j++) {
      const x = p.getX(i + j), y = p.getY(i + j), z = p.getZ(i + j);
      keep.push(x, y, z); kn.push(n.getX(i + j), n.getY(i + j), n.getZ(i + j));
      uv.push(0.5 + x / SPAN, 0.5 + y / SPAN);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(kn, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}
let SHELL_E = null, SHELL_M = null;

class Face {
  constructor(head, atlases, style) {
    SHELL_E ??= shellGeo(SKULL_R * 1.006); SHELL_M ??= shellGeo(SKULL_R * 1.012);
    const mk = (src, geo, order) => {
      const t = src.clone(); t.repeat.set(1 / GRID, 1 / GRID); t.needsUpdate = true;
      const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 * order, polygonOffsetUnits: -2 * order });
      const o = new THREE.Mesh(geo, m); o.position.set(0, 0.25, 0); o.renderOrder = 2 + order; head.add(o);
      return t;
    };
    this.eyeT = mk(atlases[style], SHELL_E, 1);
    this.mouthT = mk(atlases.mouths, SHELL_M, 2);
    this.set('open', 'smile');
  }
  static cell(t, i) { t.offset.set((i % GRID) / GRID, 1 - (Math.floor(i / GRID) + 1) / GRID); }
  set(eyes, mouth) {
    if (eyes) { this.eyes = eyes; Face.cell(this.eyeT, Math.max(0, EYES.indexOf(eyes))); }
    if (mouth) { mouth = MOUTH_ALIAS[mouth] ?? mouth; this.mouth = mouth; Face.cell(this.mouthT, Math.max(0, MOUTHS.indexOf(mouth))); }
  }
}

export class Character {
  constructor(scene, who, atlases, o = {}) {
    this.who = who; this.spec = { ...CAST[who], ...o.spec }; this.seed = o.seed ?? [...who].reduce((a, c) => a + c.charCodeAt(0), 0);
    const s = this.spec;
    this.root = group(scene, o.pos ?? [0, 0, 0], [0, o.rotY ?? 0, 0], who);
    this.mTop = soft(s.top); this.mSkin = soft(SKIN, { sheen: 0.5 }).clone();   // own copy: faces can flush red
    this.hips = group(this.root, [0, 0.6, 0]);
    this.spine = group(this.hips);
    this._legs(); this._torso();
    this.neck = group(this.spine, [0, 0.6, 0]);
    this.head = group(this.neck); this.head.scale.setScalar(1.12);
    this._head();
    this.face = new Face(this.head, atlases, s.face ?? 'plain');
    this.armL = this._arm(1); this.armR = this._arm(-1);
    for (const a of [this.armL, this.armR, this.legL, this.legR, this.spine, this.hips, this.neck, this.head]) a.rotation.order = 'ZYX';
    this.props = {};   // things held in the hands (attached by the shot)
    this.reset();
  }

  _legs() {
    const s = this.spec, shoe = soft(s.shoes);
    if (s.dress) {
      cyl(0.2, 0.36, 0.66, this.hips, [0, -0.25, 0], this.mTop);
      this.legL = group(this.hips, [0.1, -0.55, 0]); this.legR = group(this.hips, [-0.1, -0.55, 0]);
      for (const l of [this.legL, this.legR]) box(0.13, 0.09, 0.22, l, [0, -0.03, 0.04], shoe, 0.035);
      return;
    }
    const jeans = soft(s.legs);
    [this.legL, this.legR] = [1, -1].map(side => {
      const p = group(this.hips, [0.11 * side, 0.04, 0]);
      mesh(limbGeo(0.1, 0.42), jeans, p);
      box(0.18, 0.12, 0.3, p, [0, -0.56, 0.05], shoe, 0.05);
      box(0.185, 0.03, 0.305, p, [0, -0.615, 0.05], soft('#e8e8e8'), 0.012);
      return p;
    });
  }

  _torso() {
    const body = mesh(limbGeo(0.25, 0.3, 28), this.mTop, this.spine, [0, 0.52, 0]);
    body.scale.set(1, 1, 0.82);
    if (this.who === 'ben') {
      for (const x of [-0.055, 0.055]) mesh(limbGeo(0.013, 0.11, 8), soft('#f4f4f4'), this.spine, [x, 0.6, 0.2]);
      box(0.26, 0.12, 0.05, this.spine, [0, 0.12, 0.19], this.mTop, 0.024);
    }
  }

  _head() {
    const s = this.spec, h = this.head, skin = this.mSkin;
    this.skull = ball(SKULL_R, h, [0, 0.25, 0], skin, [1, 1.02, 0.95], 48);
    ball(0.042, h, [0, 0.235, 0.268], skin, [1, 0.95, 0.9], 16);
    for (const side of [1, -1]) ball(0.058, h, [0.268 * side, 0.235, -0.01], skin, [0.55, 1.1, 0.9], 16);
    if (s.hairStyle === 'spiky') this._spiky();
    else if (s.hairStyle === 'cap') {
      const cm = soft(s.cap);
      ball(0.285, h, [0, 0.37, -0.02], cm, [1.02, 0.66, 1.02], 40);
      const brim = cyl(0.16, 0.16, 0.025, h, [0, 0.42, 0.26], cm, [deg(-8), 0, 0]); brim.scale.set(1, 1, 0.75);
      ball(0.275, h, [0, 0.27, -0.04], soft(s.hair), [1, 0.75, 0.95], 32);
    } else if (s.hairStyle === 'bun') {
      const hm = soft(s.hair);
      ball(0.282, h, [0, 0.31, -0.035], hm, [1, 0.86, 1], 40);
      ball(0.13, h, [0, 0.56, -0.13], hm);
    }
    if (s.glasses) {
      const gm = plain('#7a2a3a', 0.4);
      for (const side of [1, -1]) mesh(new THREE.TorusGeometry(0.066, 0.009, 8, 32), gm, h, [0.097 * side, 0.305, 0.272]);
      box(0.06, 0.012, 0.012, h, [0, 0.31, 0.285], gm);
    }
    if (s.headband) { const b = cyl(0.288, 0.288, 0.085, h, [0, 0.4, -0.005], soft('#f6f6f6')); b.scale.set(1, 1, 0.96); }
  }

  _spiky() {
    const h = this.head, hm = soft(this.spec.hair, { rough: 0.45, sheen: 0.2 });
    ball(0.278, h, [0, 0.3, -0.03], hm, [1, 0.86, 1], 40);
    const count = 17, up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count, pol = Math.acos(1 - t * 0.7), az = i * 2.39996;
      const bx = Math.sin(pol) * Math.cos(az), by = Math.sin(pol) * Math.sin(az), bz = Math.cos(pol);
      const ax = new THREE.Vector3(bx, bz, -by);          // Blender (x,y,z) -> three (x,z,-y)
      if (ax.z > 0.5 && ax.y < 0.7) continue;              // keep the forehead clear
      const len = 0.12 + 0.035 * (1 - t);
      const sp = new THREE.Group(); h.add(sp);
      sp.quaternion.setFromUnitVectors(up, ax);
      sp.position.set(0, 0.29, -0.03).addScaledVector(ax, 0.23 + len * 0.32);
      mesh(new THREE.CylinderGeometry(0.026, 0.09, len, 16), hm, sp);
      ball(0.032, sp, [0, len / 2, 0], hm, null, 12);
    }
  }

  _arm(side) {
    const p = group(this.spine, [0.27 * side, 0.66, 0]);
    mesh(limbGeo(0.082, 0.36), this.mTop, p);
    cyl(0.078, 0.078, 0.07, p, [0, -0.42, 0], this.mTop);
    const hand = ball(0.08, p, [0, -0.5, 0], this.mSkin, [0.85, 1.15, 1.0], 20);
    mesh(limbGeo(0.027, 0.045, 8), this.mSkin, p, [-0.055 * side, -0.47, 0.045], [deg(-30), 0, deg(-40 * side)]);
    p.userData.hand = hand;
    return p;
  }

  // ---------- per frame ----------
  reset() {
    for (const o of [this.hips, this.spine, this.neck, this.head]) o.rotation.set(0, 0, 0);
    this.hips.position.set(0, 0.6, 0); this.spine.scale.set(1, 1, 1); this.root.scale.setScalar(1);
    this.squash = 1; this.mSkin.color.set(SKIN); this.neck.position.set(0, 0.6, 0);
    this.setPose('stand');
    this.face.set('open', 'smile');
  }
  setPose(a, b = null, k = 0) {
    const A = POSES[a], B = b ? POSES[b] : A, m = (x, y) => x + (y - x) * k;
    this.armL.rotation.set(deg(m(A[0][0], B[0][0])), 0, deg(m(A[0][1], B[0][1])));
    this.armR.rotation.set(deg(m(A[1][0], B[1][0])), 0, deg(m(A[1][1], B[1][1])));
    this.legL.rotation.set(deg(m(A[2], B[2])), 0, 0);
    this.legR.rotation.set(deg(m(A[3], B[3])), 0, 0);
    this.spine.rotation.set(deg(m(A[4], B[4])), 0, 0);
  }
  // arm angles directly: [flex, abd] in degrees
  // yaw swings a raised arm across the body (positive = towards the centre for both sides)
  arm(side, flex, abd, yaw = 0) { (side === 'L' ? this.armL : this.armR).rotation.set(deg(flex), deg(side === 'L' ? -yaw : yaw), deg(abd)); }
  handWorld(side, out = new THREE.Vector3()) { return (side === 'L' ? this.armL : this.armR).userData.hand.getWorldPosition(out); }
  // world position of the centre of mass (chest), for physics placement
  set(pos, rotY = null) { this.root.position.set(...pos); if (rotY !== null) this.root.rotation.y = rotY; }
}
