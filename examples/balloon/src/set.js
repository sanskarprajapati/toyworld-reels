// The balloon set on the floating island: the launch yard at the origin, the neighbour's house and pool downwind,
// grandma's cottage where the flight lands. The flight F (physics.js) decides where the downwind set pieces stand.
import * as THREE from 'three';
import { plain, soft, metal, glass, box, cyl, ball, mesh, group, mulberry, deg, ropeMesh, setRope } from '../lib/util.js';
import { house, tree, fence, ROOF } from '../lib/world.js';
import { buildBalloon, buildBag, hideBalloon } from './balloon.js';
import { buildProps, resetProps } from './props.js';

export const YARD = { fire: [-3.2, 0, 3.2], table: [3.2, 0, 4.6], tableH: 0.85, fenceX: 17.5 };

function waterNormal() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), rnd = mulberry(17);
  const waves = [...Array(8)].map(() => ({ kx: Math.round((rnd() - 0.5) * 8), ky: Math.round(1 + rnd() * 6), a: 0.4 + rnd() * 0.6, p: rnd() * 6.28 }));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let dx = 0, dy = 0;
    for (const w of waves) { const c0 = Math.cos(2 * Math.PI * (w.kx * i + w.ky * j) / N + w.p) * w.a; dx += c0 * w.kx; dy += c0 * w.ky; }
    const k = (j * N + i) * 4, nx = -dx * 0.03, ny = -dy * 0.03, l = Math.hypot(nx, ny, 1);
    img.data[k] = (nx / l * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// pool: tiled coping box with a water surface; centre c, size [sx, sz]
function pool(scene, c, size) {
  const g = group(scene, c, [0, 0, 0], 'pool'), [sx, sz] = size, cope = plain('#e9e4da', 0.8);
  box(sx + 0.8, 0.3, 0.4, g, [0, 0.15, sz / 2 + 0.2], cope); box(sx + 0.8, 0.3, 0.4, g, [0, 0.15, -sz / 2 - 0.2], cope);
  box(0.4, 0.3, sz, g, [sx / 2 + 0.2, 0.15, 0], cope); box(0.4, 0.3, sz, g, [-sx / 2 - 0.2, 0.15, 0], cope);
  box(sx, 0.05, sz, g, [0, 0.02, 0], plain('#5fc3e0', 0.5));
  const n = waterNormal(), wm = new THREE.MeshPhysicalMaterial({ color: '#38b6dc', roughness: 0.06, metalness: 0, normalMap: n, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1, transparent: true, opacity: 0.88 });
  n.repeat.set(sx / 3, sz / 3);
  const water = mesh(new THREE.PlaneGeometry(sx, sz), wm, g, [0, 0.22, 0], [-Math.PI / 2, 0, 0]);
  water.castShadow = false;
  g.userData.water = water;
  // ladder
  for (const dz of [-0.25, 0.25]) cyl(0.03, 0.03, 0.9, g, [sx / 2 - 0.1, 0.55, dz], metal('#d0d3d8'), undefined, 8);
  return g;
}

function lounger(scene, pos, rotY) {
  const g = group(scene, pos, [0, rotY, 0], 'lounger'), frame = metal('#e2e4e8', 0.35), cushion = soft('#f0f0f0');
  box(0.7, 0.1, 1.3, g, [0, 0.35, 0.35], cushion, 0.04);
  const back = box(0.7, 0.1, 0.9, g, [0, 0.62, -0.6], cushion, 0.04); back.rotation.x = deg(-38);
  for (const [x, z] of [[0.3, 0.9], [-0.3, 0.9], [0.3, -0.7], [-0.3, -0.7]]) cyl(0.025, 0.025, 0.32, g, [x, 0.15, z], frame, undefined, 8);
  // side table with a drink (cocktail umbrella)
  const t = group(g, [0.75, 0, 0.1]);
  cyl(0.25, 0.25, 0.04, t, [0, 0.5, 0], plain('#ffffff', 0.5)); cyl(0.03, 0.03, 0.5, t, [0, 0.25, 0], frame, undefined, 8);
  cyl(0.06, 0.045, 0.16, t, [0, 0.6, 0], glass('#ffd27a', 0.5));
  const um = group(t, [0.02, 0.68, 0], [0, 0, deg(-20)]);
  cyl(0.004, 0.004, 0.18, um, [0, 0.09, 0], plain('#8a6a4a'), undefined, 6);
  mesh(new THREE.ConeGeometry(0.09, 0.05, 10, 1, true), soft('#ff5a7a', { side: THREE.DoubleSide }), um, [0, 0.18, 0]);
  g.userData.drink = t;
  return g;
}

function washingLine(scene, a, b) {
  const pole = plain('#9a7a5a', 0.85), g = group(scene, [0, 0, 0], [0, 0, 0], 'washing');
  for (const p of [a, b]) { cyl(0.05, 0.05, 2.0, g, [p[0], 1.0, p[1]], pole, undefined, 10); box(0.06, 0.06, 0.7, g, [p[0], 1.95, p[1]], pole); }
  const line = ropeMesh(plain('#f4f4f4', 0.7), 0.01); scene.add(line);
  const mid = [(a[0] + b[0]) / 2, 1.78, (a[1] + b[1]) / 2];
  setRope(line, [[a[0], 1.92, a[1]], mid, [b[0], 1.92, b[1]]]);
  const cols = ['#ff7ab0', '#ffffff', '#6ec1ff', '#ffd23f', '#9b6bd6', '#ffffff'], clothes = [];
  for (let i = 0; i < 6; i++) {
    const k = (i + 0.7) / 6.4, x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k, y = 1.9 - 0.14 * Math.sin(Math.PI * k);
    const c = mesh(new THREE.PlaneGeometry(i % 3 === 1 ? 0.5 : 0.7, i % 3 === 1 ? 0.9 : 0.6), soft(cols[i], { side: THREE.DoubleSide }), g, [x, y, z]);
    c.geometry.translate(0, -c.geometry.parameters.height / 2, 0);
    c.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI / 2;
    clothes.push(c);
  }
  g.userData.clothes = clothes;
  return g;
}

function campfire(scene, p) {
  const g = group(scene, p, [0, 0, 0], 'campfire'), rnd = mulberry(8);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; ball(0.14, g, [Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62], plain(['#8f8f93', '#a3a3a6', '#7c7c80'][i % 3], 0.9), [1, 0.7, 1], 12); }
  for (let i = 0; i < 4; i++) { const l = cyl(0.07, 0.08, 0.95, g, [0, 0.2, 0], plain('#6b4428', 0.9)); l.rotation.set(deg(70), i * Math.PI / 4, 0); }
  ball(0.3, g, [0, 0.05, 0], plain('#2a1d16', 1), [1, 0.25, 1], 12);
  return g;
}

function balanceRig(scene, p) {
  // a big kitchen balance on the garden table: two open-bottomed glass boxes hang from the beam
  const g = group(scene, p, [0, 0, 0], 'balance'), brass = metal('#d9b25a', 0.3);
  cyl(0.2, 0.26, 0.06, g, [0, 0.03, 0], brass); cyl(0.035, 0.035, 0.9, g, [0, 0.48, 0], brass, undefined, 12);
  const beam = group(g, [0, 0.95, 0]);
  box(1.6, 0.05, 0.05, beam, [0, 0, 0], brass, 0.02);
  ball(0.06, beam, [0, 0, 0], brass, null, 12);
  const pans = [-1, 1].map(s => {
    const h = group(g, [0, 0, 0]);
    cyl(0.008, 0.008, 0.22, h, [0, -0.11, 0], brass, undefined, 6);
    const boxG = group(h, [0, -0.47, 0]);
    const gm = glass('#cfe9f5', 0.22);
    const sz = 0.5;
    for (const [x, z, ry] of [[0, sz / 2, 0], [0, -sz / 2, 0], [sz / 2, 0, Math.PI / 2], [-sz / 2, 0, Math.PI / 2]]) {
      const w = mesh(new THREE.PlaneGeometry(sz, sz), gm, boxG, [x, 0, z], [0, ry, 0]); w.castShadow = false;
    }
    const lid = mesh(new THREE.PlaneGeometry(sz, sz), gm, boxG, [0, sz / 2, 0], [-Math.PI / 2, 0, 0]); lid.castShadow = false;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sz, sz, sz)), new THREE.LineBasicMaterial({ color: '#7fa7b8' }));
    boxG.add(edges);
    h.userData = { side: s, boxG, panes: boxG.children.filter(c => c.isMesh) };
    return h;
  });
  g.userData = { beam, pans };
  return g;
}

export function buildSet(scene, assets, Character, F) {
  const S = { scene, F };
  // ---------- launch yard ----------
  house(scene, [-11, 0, -9], deg(35), { name: 'narr_house' });
  S.fire = campfire(scene, YARD.fire);
  const table = group(scene, YARD.table, [0, deg(-12), 0], 'table');
  box(2.2, 0.08, 1.1, table, [0, YARD.tableH - 0.04, 0], plain('#c89a62', 0.75), 0.02);
  for (const [x, z] of [[1, 0.45], [-1, 0.45], [1, -0.45], [-1, -0.45]]) box(0.07, YARD.tableH - 0.08, 0.07, table, [x, (YARD.tableH - 0.08) / 2, z], plain('#a87b4f', 0.8));
  S.table = table;
  S.balance = balanceRig(table, [-0.35, YARD.tableH, 0]);
  fence(scene, [YARD.fenceX, -14], [YARD.fenceX, 14], 1.1);
  fence(scene, [-16, 12], [YARD.fenceX, 12], 1.1);

  // ---------- neighbour (ridge exactly where the basket bottoms out) ----------
  const scr = F.pos(F.B.tScrape);
  S.ridge = [scr[0], scr[2]];
  S.nHouse = house(scene, [scr[0], 0, scr[2] - 0.6], Math.PI / 2, { name: 'neigh_house', w: 9, d: 6, h: 5.5, roofH: 2.4 });
  S.pool = pool(scene, [F.tile.land[0] - 0.3, 0, F.tile.land[2] + 0.4], [4.2, 3.4]);   // where the loose roof tile lands
  S.sand = F.sandwich;
  S.lounger = lounger(scene, [S.sand.land[0], 0, S.sand.land[2] - 0.75], Math.PI);   // the neighbour's face is where the sandwich lands
  // ---------- grandma ----------
  const [sx, sz] = F.stop, [dx, dz] = F.dir, px = -dz, pz = dx;          // p = left of travel
  S.gran = { pos: [sx + dx * 1.9 - px * 1.6, 0, sz + dz * 1.9 - pz * 1.6] };
  S.gHouse = house(scene, [sx + dx * 4 - px * 11, 0, sz + dz * 4 - pz * 11], Math.atan2(px, pz), { name: 'gran_cottage', w: 7, d: 6, h: 3.6, floors: 1, roofH: 2.2 });
  const lc = [sx + dx * 8.5, sz + dz * 8.5];
  S.washing = washingLine(scene, [lc[0] - px * 2.6, lc[1] - pz * 2.6], [lc[0] + px * 2.6, lc[1] + pz * 2.6]);
  const rnd = mulberry(21), cols = ['#ff5a7a', '#ffd23f', '#ff8a3d', '#e05ad8', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 3 + rnd() * 6, x = sx - px * 7 + Math.cos(a) * r, z = sz - pz * 7 + Math.sin(a) * r * 0.5;
    const f = group(scene, [x, 0, z]);
    cyl(0.012, 0.012, 0.3, f, [0, 0.15, 0], plain('#3f8a30', 0.8), undefined, 6);
    ball(0.06, f, [0, 0.32, 0], plain(cols[i % 5], 0.6), null, 10);
  }
  fence(scene, [sx - px * 14 - dx * 8, sz - pz * 14 - dz * 8], [sx - px * 14 + dx * 18, sz - pz * 14 + dz * 18], 0.9);

  // ---------- the rest of the island (seen from the air) ----------
  house(scene, [-28, 0, 22], deg(150), { name: 'h3' });
  house(scene, [-34, 0, -30], deg(20), { name: 'h4', w: 6 });
  house(scene, [12, 0, -34], deg(-10), { name: 'h5' });
  house(scene, [44, 0, 26], deg(200), { name: 'h6', w: 8 });
  house(scene, [70, 0, 10], deg(250), { name: 'h7', w: 6, h: 3.6, floors: 1, roofH: 2.2 });
  house(scene, [-50, 0, 0], deg(90), { name: 'h8' });
  const path = [[0, 0], [scr[0], scr[2]], [F.landing[0], F.landing[1]], [lc[0], lc[1]]];
  const clear = (x, z) => {
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz;
      const k = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L));
      if (Math.hypot(x - ax - vx * k, z - az - vz * k) < 9) return false;
    }
    if (x > -26 && x < 14 && z > 4 && z < 32) return false;   // the yard's camera side stays open
    return Math.hypot(x - YARD.fire[0], z - YARD.fire[2]) > 6 && Math.hypot(x - YARD.table[0], z - YARD.table[2]) > 5;
  };
  const tr = mulberry(31);
  let n = 0;
  for (let i = 0; i < 400 && n < 46; i++) {
    const x = -70 + tr() * 150, z = -80 + tr() * 140;
    if (!clear(x, z)) continue;
    tree(scene, assets, [x, 0, z], n % 3, 2.6 + tr() * 1.4, n * 1.7); n++;
  }
  for (const [x, z, k, s] of [[-24, 6, 0, 3.2], [-15, 2, 2, 3.4], [9, -9, 1, 3], [-4, -14, 2, 3.3]]) tree(scene, assets, [x, 0, z], k, s, x);

  // ---------- cast ----------
  S.ben = new Character(scene, 'ben', assets.faces);
  S.narr = new Character(scene, 'narrator', assets.faces);
  S.neigh = new Character(scene, 'neighbour', assets.faces);
  S.granCh = new Character(scene, 'grandma', assets.faces);
  // sunglasses for the neighbour (shots 27-32)
  S.shades = group(S.neigh.head, [0, 0.3, 0.27]);
  for (const s of [1, -1]) box(0.13, 0.08, 0.03, S.shades, [0.085 * s, 0, 0.0], plain('#151515', 0.2), 0.02);
  box(0.06, 0.02, 0.02, S.shades, [0, 0.01, 0], plain('#151515', 0.2));

  S.bal = buildBalloon(scene);
  S.bag = buildBag(scene);
  buildProps(S, scene, assets);
  return S;
}

export function resetSet(S, t) {
  for (const c of [S.ben, S.narr, S.neigh, S.granCh]) {
    c.reset(); c.root.visible = false; c.root.rotation.set(0, 0, 0);
    if (c.root.parent !== S.scene) S.scene.add(c.root);
  }
  S.shades.visible = false;
  hideBalloon(S.bal);
  S.bag.visible = false; S.bag.scale.setScalar(1); S.bag.userData.string.visible = false;
  S.balance.userData.beam.rotation.set(0, 0, 0);
  resetProps(S, t);
}
