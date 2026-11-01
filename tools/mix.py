"""Voice + music bed + sound effects -> <film>/audio/mix.wav (48 kHz stereo), cut to the shot timing.

python tools/mix.py <film>

Reads <film>/voice/timeline.json, <film>/voice/voice.wav, <film>/timing.json and <film>/audio/events.json:
  {"music": {"bpm": 116, "key": "D", "db": -21},            optional; the bed sits ~21 dB under the voice by RMS
   "events": [["shot id", fraction of the shot, "sound", gain], ...]}
Sound names: tools/sfxlib.py (SOUNDS). Every label pop-in gets a soft pop automatically.
Loudness mastering (-14 LUFS) happens in the final mux (tw assemble).
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
import soxr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import SR, X, put, sound  # noqa: E402
from engine import PY  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-9)


def main(film):
    film = os.path.abspath(film)
    tl = json.load(open(os.path.join(film, 'voice', 'timeline.json')))
    timing = json.load(open(os.path.join(film, 'timing.json')))
    cfg_path = os.path.join(film, 'audio', 'events.json')
    cfg = json.load(open(cfg_path)) if os.path.exists(cfg_path) else {}
    mus = cfg.get('music', {})
    total = tl['total']
    n = int(total * SR)
    v, vsr = sf.read(os.path.join(film, 'voice', 'voice.wav'), dtype='float64')
    v = soxr.resample(v, vsr, SR)[:n]
    v = np.pad(v, (0, n - len(v)))
    v = X.hp(v, 90)                                   # clear the mud
    v = v + X.bp(v, 2500, 6000) * 0.35                # presence: consonants cut through
    v = X.compress(v, thr=.15, ratio=4.0)
    voice = np.stack([v, v], 1)
    mpath = os.path.join(film, 'audio', 'music.wav')
    os.makedirs(os.path.dirname(mpath), exist_ok=True)
    if not os.path.exists(mpath) or sf.info(mpath).duration < total:
        subprocess.run([PY, os.path.join(HERE, 'music.py'), mpath, str(total + 1), '--bpm', str(mus.get('bpm', 116)), '--key', mus.get('key', 'D')], check=True)
    m, msr = sf.read(mpath, dtype='float64')
    m = soxr.resample(m, msr, SR)[:n]
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    m *= rms(v) / rms(m.mean(1)) * 10 ** (mus.get('db', -21.0) / 20)
    fx = np.zeros(n)
    starts, acc = {}, 0.0
    for s in sorted(timing):
        starts[s] = acc
        acc += timing[s]
    for shot, frac, name, gain in cfg.get('events', []):
        if shot not in starts:
            continue
        put(fx, sound(name), starts[shot] + frac * timing[shot], gain * .5)
    for lb in tl['labels']:
        put(fx, X.pop(1.0), lb['t0'], .35)
    mix = voice + m + np.stack([fx, fx], 1)
    mix = np.stack([X.limit(X.compress(mix[:, ch], thr=.3, ratio=2.5), .6) for ch in (0, 1)], 1)   # bus glue, lower crest
    sf.write(os.path.join(film, 'audio', 'mix.wav'), mix.astype(np.float32), SR)
    print('mix', round(total, 2), 's')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
