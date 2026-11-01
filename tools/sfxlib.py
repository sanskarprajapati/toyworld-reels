"""The shared sound-effect library: every sound is synthesised from noise and oscillators (no samples).

sound(name) -> mono float array at SR (48 kHz). SOUNDS lists every name. Add new ones as another `if name == ...` branch.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import LIB  # noqa: E402
sys.path.insert(0, LIB)
from core.audio import sfx as X  # noqa: E402

SR = X.SR


def put(buf, x, at, gain=1.0):
    """Mix mono x into mono buf at time `at` (s)."""
    i = int(at * SR)
    if i >= len(buf):
        return
    e = min(len(buf), i + len(x))
    buf[i:e] += x[:e - i] * gain


def _t(d):
    return np.arange(int(d * SR)) / SR


def sound(name):
    if name == 'whoosh':
        return X.whoosh(.35)
    if name == 'whoosh_long':
        return X.whoosh(1.1)
    if name == 'pop':
        return X.pop()
    if name == 'ding':
        return X.ding()
    if name == 'crash':
        c = X.crash()
        put(c, X.thump(1.0, 60), 0, .8)
        return X.norm(c)
    if name == 'thump':
        return X.thump()
    if name == 'clack':
        return X.clack()
    if name == 'creak':
        return X.creak()
    if name == 'splash':
        d = 1.0
        return X.norm(X.bp(X.noise(d), 300, 5000) * X.env_exp(d, .22)) * .9
    if name == 'leaves':
        d = 1.2
        return X.norm(X.bp(X.noise(d), 2000, 9000) * np.sin(np.linspace(0, np.pi, int(d * SR)))) * .4
    if name == 'confetti':
        d = 1.0
        return X.norm(X.hp(X.noise(d), 3000) * X.env_exp(d, .15)) * .6
    if name == 'siren':
        t = _t(1.6)
        f = np.where((t * 2.5).astype(int) % 2 == 0, 960, 770)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * .35
    if name == 'ratchet':
        out = np.zeros(int(1.6 * SR))
        for i in range(14):
            put(out, X.click(1.4, .7), i * .11)
        return out
    if name == 'buzz':
        t = _t(.6)
        return np.sign(np.sin(2 * np.pi * 110 * t)) * .25 * X.env_exp(.6, .3)
    if name == 'hum':
        t = _t(1.5)
        return np.sin(2 * np.pi * 70 * t) * np.sin(np.linspace(0, np.pi, len(t))) * .5
    if name == 'beep':
        t = _t(.18)
        return np.sin(2 * np.pi * 1800 * t) * .4
    if name == 'camera':
        c = X.hp(X.noise(.12), 2000) * X.env_exp(.12, .03)
        put(c, X.click(.8), 0)
        return X.norm(c)
    if name == 'register':
        out = np.zeros(int(.9 * SR))
        put(out, X.clack(1.0), 0)
        put(out, X.ding(), .12)
        return out
    if name == 'rumble':
        return X.rumble(1.5)
    if name == 'roar':
        return X.roar(2.4)
    if name == 'fizz':
        d = 1.6
        return X.norm(X.hp(X.noise(d), 3500) * (0.6 + 0.4 * np.sin(np.linspace(0, 40, int(d * SR))))) * .4
    if name == 'click_lighter':
        out = np.zeros(int(.4 * SR))
        put(out, X.click(1.2), 0)
        put(out, X.hp(X.noise(.25), 1500) * X.env_exp(.25, .08) * .5, .03)
        return out
    if name == 'steps':
        out = np.zeros(int(2.5 * SR))
        for i in range(6):
            put(out, X.step(.8), i * .38)
        return out
    if name == 'zip':
        d = 1.0
        x = X.bp(X.noise(d), 1200, 6000) * np.linspace(.3, 1, int(d * SR)) * X.env_exp(d, .6)
        return X.norm(x) * .7
    if name == 'motor':
        t = _t(1.6)
        f = 95 + 6 * np.sin(2 * np.pi * 7 * t)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .2 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * .2
        return X.lp(x, 1200) * np.minimum(1, t / .15) * np.minimum(1, (1.6 - t) / .3)
    if name == 'motor_strain':
        t = _t(2.2)
        f = 130 - 55 * t / 2.2 + 8 * np.sin(2 * np.pi * 11 * t)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .22 + X.bp(X.noise(2.2), 200, 1500) * .15
        return X.lp(x, 1500) * np.minimum(1, t / .1)
    if name == 'motor_die':
        t = _t(1.2)
        f = 75 * np.exp(-t * 1.6)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .22 * np.exp(-t * 2.2)
        out = X.lp(x, 900)
        for k in range(3):
            put(out, X.click(.5, .8), .25 + k * .22)
        return out
    if name == 'wind':
        d = 2.0
        return X.norm(X.bp(X.noise(d), 300, 1800) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2) * .6
    if name == 'snap':
        c = X.hp(X.noise(.15), 1500) * X.env_exp(.15, .02)
        put(c, X.clack(1.6), 0)
        return X.norm(c)
    if name == 'horn':
        t = _t(1.0)
        x = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (147, 185)) * .15
        return X.lp(x, 1800) * np.minimum(1, t / .05) * np.minimum(1, (1.0 - t) / .15)
    if name == 'engine':
        t = _t(2.4)
        f = 70 + 60 * t / 2.4 + 4 * np.sin(2 * np.pi * 9 * t)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .2 + np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * .15
        return X.lp(x, 1400) * np.minimum(1, t / .2)
    if name == 'grind':
        d = 0.9
        t = _t(d)
        x = X.bp(X.noise(d), 2500, 7000) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t)) * np.exp(-t * 1.5)
        return X.norm(x) * .8
    if name == 'slide':
        d = 0.7
        return X.norm(X.bp(X.noise(d), 400, 2500) * np.sin(np.linspace(0, np.pi, int(d * SR)))) * .45
    if name == 'crackle':
        out = np.zeros(int(2.5 * SR))
        rng = np.random.default_rng(3)
        for _ in range(60):
            put(out, X.click(rng.uniform(1.5, 3.0), rng.uniform(.2, .7)), rng.uniform(0, 2.4))
        out += X.lp(X.brown(2.5), 400)[:len(out)] * .15
        return out
    if name == 'rustle':
        d = 0.6
        x = X.hp(X.noise(d), 3000) * (0.4 + 0.6 * np.abs(np.sin(np.linspace(0, 30, int(d * SR))))) * np.sin(np.linspace(0, np.pi, int(d * SR)))
        return X.norm(x) * .5
    if name == 'boing':
        t = _t(.45)
        f = 180 + 260 * np.exp(-t * 9) + 30 * np.sin(2 * np.pi * 14 * t)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * .5
    if name == 'fan':
        t = _t(2.0)
        x = X.bp(X.noise(2.0), 150, 1200) * (0.7 + 0.3 * np.sin(2 * np.pi * 37 * t))
        return X.norm(x) * .5 * np.minimum(1, t / .2) * np.minimum(1, (2.0 - t) / .3)
    if name == 'burner':
        d = 1.6
        t = _t(d)
        x = X.bp(X.noise(d), 80, 2500) + X.lp(X.noise(d), 200) * 1.5
        return X.norm(x) * .7 * np.minimum(1, t / .04) * np.minimum(1, (d - t) / .25)
    if name == 'hiss':
        d = 1.2
        return X.norm(X.hp(X.noise(d), 2500) * np.sin(np.linspace(0, np.pi, int(d * SR)))) * .4
    if name == 'flap':
        out = np.zeros(int(1.0 * SR))
        for i in range(5):
            put(out, X.norm(X.bp(X.noise(.12), 200, 2000) * X.env_exp(.12, .03)) * .5, i * .16)
        return out
    if name == 'splat':
        c = X.norm(X.bp(X.noise(.25), 200, 2500) * X.env_exp(.25, .05))
        put(c, X.thump(.6, 90), 0, .5)
        return c * .8
    if name == 'gull':
        t = _t(.5)
        f = 1400 - 500 * t / .5 + 120 * np.sin(2 * np.pi * 30 * t)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, len(t))) * .25
    if name == 'pump':
        out = np.zeros(int(1.2 * SR))
        for i in range(6):
            t = _t(.12); put(out, np.sign(np.sin(2 * np.pi * 90 * t)) * np.exp(-t * 20) * .25, i * .18)
        return X.lp(out, 1500)
    if name == 'kiss':
        t = _t(.12); f = 900 + 1500 * t / .12
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * .5
    if name == 'snore':
        d = 1.2; t = _t(d)
        x = X.bp(X.noise(d), 80, 600) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * np.sin(np.linspace(0, np.pi, len(t))) ** 2
        return X.norm(x) * .45
    if name == 'underwater':
        d = 1.5
        return X.norm(X.lp(X.brown(d), 300)) * .5 * np.minimum(1, _t(d) / .1) * np.minimum(1, (d - _t(d)) / .3)
    if name == 'bubbles':
        out = np.zeros(int(1.4 * SR))
        rng = np.random.default_rng(5)
        for _ in range(26):
            t = _t(.05); f = rng.uniform(500, 1400) * (1 + 3 * t / .05)
            put(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 60) * .4, rng.uniform(0, 1.3))
        return out
    if name == 'glug':
        out = np.zeros(int(.8 * SR))
        for i in range(4):
            t = _t(.12); f = 220 + 300 * t / .12
            put(out, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * .5, i * .17)
        return out
    if name == 'plop':
        t = _t(.15); f = 300 + 900 * t / .15
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * .6
    if name == 'trickle':
        d = 1.2
        return X.norm(X.bp(X.noise(d), 1500, 6000) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 60, int(d * SR)))))) * .35
    if name == 'gasp':
        d = .5
        return X.norm(X.bp(X.noise(d), 600, 3000) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2) * .5
    if name == 'rope':
        out = np.zeros(int(.8 * SR))
        for i in range(5):
            put(out, X.norm(X.bp(X.noise(.08), 800, 4000) * X.env_exp(.08, .02)) * .35, i * .14)
        return out
    if name == 'tick':
        return X.click(2.2, .5)
    if name == 'pops':
        out = np.zeros(int(1.6 * SR))
        for i in range(16):
            put(out, X.pop(.6) * (.5 + .5 * i / 16), 1.3 * (1 - (1 - i / 16) ** 1.6))
        return out
    raise KeyError(name)


SOUNDS = ['beep', 'boing', 'bubbles', 'burner', 'buzz', 'camera', 'clack', 'click_lighter', 'confetti', 'crackle', 'crash', 'creak', 'ding', 'engine', 'fan', 'fizz', 'flap', 'gasp', 'glug', 'grind', 'gull', 'hiss', 'horn', 'hum', 'kiss', 'leaves', 'motor', 'motor_die', 'motor_strain', 'plop', 'pop', 'pops', 'pump', 'ratchet', 'register', 'roar', 'rope', 'rumble', 'rustle', 'siren', 'slide', 'snap', 'snore', 'splash', 'splat', 'steps', 'thump', 'tick', 'trickle', 'underwater', 'whoosh', 'whoosh_long', 'wind', 'zip']
