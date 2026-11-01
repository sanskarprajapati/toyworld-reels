"""Original comedic bed: ukulele offbeats, pizzicato bass + melody, glockenspiel sparkles (I-vi-IV-V, one bar per chord).

python tools/music.py out.wav seconds [--bpm 116] [--key D]

With the CC0 sample packs installed (./setup.sh --music: VSCO 2 CE + FreePats, ~800 MB) it plays real recorded instruments;
without them it falls back to physically modelled plucked strings (lemo-opuscar pluck.py), no download needed.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import LIB  # noqa: E402
sys.path.insert(0, LIB)
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from core.audio import sampler as S  # noqa: E402

KEYS = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
BPM = 116
UP = 2
BEAT = 60 / BPM
BAR = BEAT * 4
# I - vi - IV - V, two bars each would drag; one bar per chord keeps it bouncy
PROG = [('C', ['C4', 'E4', 'G4'], 'C2'), ('Am', ['A3', 'C4', 'E4'], 'A1'),
        ('F', ['F3', 'A3', 'C4'], 'F1'), ('G', ['G3', 'B3', 'D4'], 'G1')]
MELODY = [  # (beat offset in the 4-bar phrase, pitch, beats): a climbing figure, like floors going by
    (0, 'C5', .5), (.5, 'E5', .5), (1, 'G5', .5), (1.5, 'C6', 1), (3, 'B5', .5), (3.5, 'G5', .5),
    (4, 'A4', .5), (4.5, 'C5', .5), (5, 'E5', .5), (5.5, 'A5', 1), (7, 'G5', .5), (7.5, 'E5', .5),
    (8, 'F4', .5), (8.5, 'A4', .5), (9, 'C5', .5), (9.5, 'F5', 1), (11, 'E5', .5), (11.5, 'C5', .5),
    (12, 'G4', .5), (12.5, 'B4', .5), (13, 'D5', .5), (13.5, 'G5', .5), (14, 'B5', .5), (14.5, 'D6', 1.5),
]


def _up(p):
    return S.name(S.midi(p) + UP)


def score(seconds):
    ev = []
    bars = int(seconds / BAR) + 1
    for b in range(bars):
        t0 = b * BAR
        _, chord, bass = PROG[b % 4]
        chord, bass = [_up(p) for p in chord], _up(bass)
        ev.append((t0, 'contrabass_pizz', bass, BEAT, .75, 0))
        ev.append((t0 + 2 * BEAT, 'contrabass_pizz', S.name(S.midi(bass) + 7), BEAT, .65, 0))
        for k in range(4):
            for i, p in enumerate(chord):
                ev.append((t0 + k * BEAT + BEAT / 2 + i * .012, 'ukulele', p, BEAT * .45, .45, -.25))
        if b % 8 >= 4:   # melody every other phrase so the voice has room
            for off, p, d in MELODY:
                if (b % 4) * 4 <= off < (b % 4) * 4 + 4:
                    ev.append((t0 + (off - (b % 4) * 4) * BEAT, 'violins_pizz', _up(p), d * BEAT, .5, .2))
        if b % 4 == 3:
            ev.append((t0 + 3.5 * BEAT, 'glockenspiel', _up('G6'), BEAT, .35, .35))
    return [e for e in ev if e[0] < seconds]


# sample-free fallback: the same score on plucked-string models
FALLBACK = {'contrabass_pizz': ('upright_bass_pizz', 1.0), 'ukulele': ('nylon_guitar', .55), 'violins_pizz': ('harp', .7), 'glockenspiel': ('music_box', .5)}


def have_samples():
    root = os.path.join(LIB, 'core', 'audio', 'instruments')
    return all(os.path.isdir(os.path.join(root, lib)) for lib in ('vsco2ce', 'freepats'))


def render_fallback(events, seconds):
    from core.audio import pluck as PL
    buf = np.zeros((int(seconds * S.SR), 2), np.float32)
    cache = {}
    for t, inst, pitch, dur, vel, pan in events:
        preset, g = FALLBACK[inst]
        key = (preset, pitch, round(dur, 3), round(vel, 2))
        if key not in cache:
            cache[key] = PL.pluck(preset, pitch, dur + .25, vel)
        x = cache[key] * g
        i = int(t * S.SR)
        if i >= len(buf):
            continue
        x = x[: len(buf) - i]
        buf[i:i + len(x), 0] += x * np.sqrt((1 - pan) / 2)
        buf[i:i + len(x), 1] += x * np.sqrt((1 + pan) / 2)
    return buf


def main():
    global BPM, UP, BEAT, BAR
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('seconds', type=float)
    ap.add_argument('--bpm', type=float, default=116); ap.add_argument('--key', default='D')
    a = ap.parse_args()
    BPM, UP = a.bpm, KEYS[a.key]
    BEAT = 60 / BPM; BAR = BEAT * 4
    seconds = a.seconds
    S.seed(7)
    ev = score(seconds)
    mix = S.render(ev, seconds + 2) if have_samples() else render_fallback(ev, seconds + 2)
    mix = mix[: int(seconds * S.SR)]
    fade = int(1.5 * S.SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix /= max(1e-6, np.abs(mix).max()) / 0.8
    sf.write(a.out, mix, S.SR)
    print('music', a.out, round(seconds, 2), '(samples)' if have_samples() else '(plucked-string fallback)')


if __name__ == '__main__':
    main()
