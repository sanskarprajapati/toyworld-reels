// The set: a garden on the floating island, a table, the ball, the cast. Shots show / move things every frame.
import * as THREE from 'three';
import { plain, soft, box, ball, group } from '../lib/util.js';
import { house, tree, fence } from '../lib/world.js';

export const TABLE = { pos: [1.4, 0, 0.6], h: 0.85 };

export function buildSet(scene, assets, Character) {
  const S = { scene };
  house(scene, [-6, 0, -8], 0.3, { name: 'house' });
  [[7, -6, 0, 3.2], [-10, 3, 1, 3], [9, 6, 2, 3.3]].forEach(([x, z, k, s], i) => tree(scene, assets, [x, 0, z], k, s, i * 1.7));
  fence(scene, [-12, 6], [12, 6], 1.0);
  S.table = group(scene, TABLE.pos, [0, 0, 0], 'table');
  box(1.6, 0.08, 0.9, S.table, [0, TABLE.h - 0.04, 0], plain('#c89a62', 0.75), 0.02);
  for (const [x, z] of [[0.7, 0.35], [-0.7, 0.35], [0.7, -0.35], [-0.7, -0.35]]) box(0.07, TABLE.h - 0.08, 0.07, S.table, [x, (TABLE.h - 0.08) / 2, z], plain('#a87b4f', 0.8));
  S.ball = ball(0.12, scene, [0, 0, 0], soft('#ff4d4d', { rough: 0.3 }));
  S.ben = new Character(scene, 'ben', assets.faces);
  S.narr = new Character(scene, 'narrator', assets.faces);
  return S;
}

// every frame starts from scratch: nothing carries over between frames, so any frame renders on its own
export function resetSet(S, t) {
  for (const c of [S.ben, S.narr]) { c.reset(); c.root.visible = false; }
}
