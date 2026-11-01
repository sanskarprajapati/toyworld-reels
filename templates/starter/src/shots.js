// The shots: {id, dur, frame(ctx)}. ctx = {u: seconds into the shot, d: its length, t: global time}.
// Every frame: pose the characters (pose + idle + eyes + mouth), place props from the physics, then the camera and the sun.
import { deg, ss, eo, clamp, lerp } from '../lib/util.js';
import { idle, eyes, talk, bounce } from '../lib/acting.js';
import { aimSun } from '../lib/world.js';
import { shoot } from '../lib/stage.js';
import { hold, hop, headPos, world, arr, move } from '../lib/rig.js';
import { TABLE } from './set.js';

const BEN = [TABLE.pos[0] - 0.95, 0, TABLE.pos[2] + 0.1];

export function shots(S, P, FX, st) {
  const sun = st?.sun;
  const ben = (t, rotY = deg(35)) => { const b = S.ben; b.root.visible = true; b.set(BEN, rotY); idle(b, t); return b; };
  const ballAt = t => { S.ball.visible = true; S.ball.position.set(BEN[0] + 0.38, P.ballY(t), BEN[2] + 0.6); };   // just off the table edge, in front of his hand

  return [
    { id: '01', dur: 1.6, frame: ({ u, d, t }) => {
      const b = ben(t); b.arm('R', -85, -15, 15); eyes(b, t, 'happy', false); b.face.set(null, 'grin');
      const n = S.narr; n.root.visible = true; n.set([-1.6, 0, 1.8], deg(140)); idle(n, t); n.setPose('hip'); eyes(n, t, 'open'); n.face.set(null, 'smile');
      ballAt(t);
      move(st, u / d, [[3.5, 2.6, 6.5], [0.3, 0.9, 0.6], 24], [[2.6, 1.8, 5.0], [0.3, 0.9, 0.6], 26], { t, shake: 0.01, aper: 1.5, ease: eo });
      aimSun(sun, [0, 0, 0], 12);
    } },

    { id: '02', dur: 1.8, frame: ({ u, d, t }) => {
      const b = ben(t), let_go = t > P.ball.tDrop;
      b.arm('R', let_go ? -55 : -85, -15, 15); eyes(b, t, 'wide', false); b.face.set(null, 'o');
      b.head.rotation.x += deg(20 * ss((t - P.ball.tDrop) / 0.3));   // watches it fall
      ballAt(t);
      shoot(st, [BEN[0] - 2.6, 0.35, BEN[2] + 2.4], [BEN[0] + 0.3, 0.55, BEN[2] + 0.5], 26, { t, shake: 0.008, aper: 2 });
      aimSun(sun, BEN, 8);
    } },

    { id: '03', dur: 1.2, frame: ({ u, d, t, T }) => {
      const b = ben(t, deg(20)); b.setPose('cheer'); eyes(b, t, 'happy', false); talk(b, t, 'ben', { shout: true, rest: 'grin' });
      hop(b, t, T.start('03') + 0.1, 0.45, 0.25, 2);
      FX.confetti.update(t, T.start('03') + 0.1, [BEN[0], 2.2, BEN[2]]);
      const hp = headPos(b);
      shoot(st, [hp.x + 0.5, hp.y - 0.1, hp.z + 1.9], [hp.x, hp.y - 0.15, hp.z], 30, { t, shake: 0.012, aper: 4, focus: arr(hp) });
      aimSun(sun, hp, 6);
    } },
  ];
}
