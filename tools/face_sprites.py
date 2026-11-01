"""Draw the painted-face sprite atlases (run with a Python that has Pillow, not inside Blender).

python face_sprites.py  ->  assets/faces/eyes_<style>.png, assets/faces/mouths.png, assets/faces/index.json

Each atlas is a 4x4 grid of 512 px cells. A cell is the face seen from the front in the head's UV space
(u = 0.5 + x / 0.54, v = 0.5 + (z - 0.25) / 0.54), so features land where the 3D nose and ears expect them.
"""
import json
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'faces')
SS = 4                       # supersampling
CELL = 512
C = CELL * SS
INK = (38, 22, 14, 255)
BROW = (70, 40, 20, 255)
WHITE = (255, 255, 255, 255)
PUPIL = (22, 16, 14, 255)
BLUSH = (240, 120, 120, 120)
FRECKLE = (190, 110, 70, 200)
MOUTH = (110, 28, 30, 255)
TONGUE = (226, 96, 104, 255)
TEETH = (255, 255, 250, 255)

EYE_X, EYE_Y = 90, 208       # offset of each eye from the cell centre (x) and its y, in 512-px units
MOUTH_Y = 378

EYES = ['open', 'blink', 'wide', 'angry', 'lazy', 'shut', 'happy', 'sad', 'raised', 'dizzy', 'look_l', 'look_r']
MOUTHS = ['smile', 'grin', 'closed', 'o', 'talk1', 'talk2', 'talk3', 'scream', 'frown', 'flat', 'shout', 'yawn']


def s(v):
    return int(round(v * SS))


def _brow(d, cx, cy, side, tilt=0.0, lift=0.0, thick=13):
    """Rounded brow stroke; tilt > 0 = inner end down (angry), < 0 = inner end up (sad)."""
    w = 54
    inner = (cx - side * w / 2, cy - lift + tilt * 18)
    outer = (cx + side * w / 2, cy - lift - tilt * 4 - 6)
    mid = ((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - 6)
    pts = [inner, mid, outer]
    d.line([(s(x), s(y)) for x, y in pts], fill=BROW, width=s(thick), joint='curve')
    for x, y in (inner, outer):
        r = thick / 2
        d.ellipse([s(x - r), s(y - r), s(x + r), s(y + r)], fill=BROW)


def _eye_open(d, cx, cy, rx=42, ry=52, pr=23, dx=0, dy=5, lid=None, skin=None):
    d.ellipse([s(cx - rx), s(cy - ry), s(cx + rx), s(cy + ry)], fill=WHITE, outline=INK, width=s(5))
    px, py = cx + dx, cy + dy
    d.ellipse([s(px - pr), s(py - pr), s(px + pr), s(py + pr)], fill=PUPIL)
    d.ellipse([s(px + pr * 0.25), s(py - pr * 0.65), s(px + pr * 0.25 + pr * 0.55), s(py - pr * 0.1)], fill=WHITE)
    if lid is not None:   # lid covering the top `lid` fraction, drawn in skin colour with a lash line
        ly = cy - ry + 2 * ry * lid
        d.chord([s(cx - rx - 4), s(cy - ry - 4), s(cx + rx + 4), s(cy + ry + 4)], 180, 360, fill=skin)
        d.rectangle([s(cx - rx - 4), s(cy - ry - 4), s(cx + rx + 4), s(ly)], fill=skin)
        d.line([s(cx - rx), s(ly), s(cx + rx), s(ly)], fill=INK, width=s(7))
    else:
        d.arc([s(cx - rx), s(cy - ry), s(cx + rx), s(cy + ry)], 200, 340, fill=INK, width=s(9))


def _arc_eye(d, cx, cy, up=True, w=40):
    box = [s(cx - w), s(cy - 26), s(cx + w), s(cy + 26)]
    d.arc(box, 200, 340, fill=INK, width=s(8)) if up else d.arc(box, 20, 160, fill=INK, width=s(8))


def _cheeks(d, freckles):
    for side in (-1, 1):
        cx, cy = 256 + side * 128, 300
        d.ellipse([s(cx - 30), s(cy - 16), s(cx + 30), s(cy + 16)], fill=BLUSH)
        if freckles:
            for fx, fy in ((-14, -2), (0, 6), (13, -3), (-6, 12)):
                d.ellipse([s(cx + fx - 3), s(cy + fy - 3), s(cx + fx + 3), s(cy + fy + 3)], fill=FRECKLE)


def eye_cell(state, skin, freckles):
    im = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    _cheeks(d, freckles)
    for side in (-1, 1):
        cx, cy = 256 + side * EYE_X, EYE_Y
        if state == 'open':
            _eye_open(d, cx, cy, dx=-side * 4)
            _brow(d, cx, cy - 72, side)
        elif state == 'look_l':
            _eye_open(d, cx, cy, dx=-14)
            _brow(d, cx, cy - 72, side)
        elif state == 'look_r':
            _eye_open(d, cx, cy, dx=14)
            _brow(d, cx, cy - 72, side)
        elif state == 'blink':
            _arc_eye(d, cx, cy + 8, up=False)
            _brow(d, cx, cy - 64, side)
        elif state == 'wide':
            _eye_open(d, cx, cy, rx=50, ry=62, pr=15, dy=0)
            _brow(d, cx, cy - 92, side, lift=6)
        elif state == 'angry':
            _eye_open(d, cx, cy + 4, rx=40, ry=46, pr=21, dx=-side * 6)
            inner_x, outer_x = cx - side * 46, cx + side * 46
            d.polygon([(s(inner_x), s(cy - 60)), (s(outer_x), s(cy - 60)), (s(outer_x), s(cy - 34)),
                       (s(inner_x), s(cy + 2))], fill=skin)
            d.line([(s(inner_x + side * 4), s(cy - 2)), (s(outer_x - side * 6), s(cy - 34))], fill=INK, width=s(9))
            _brow(d, cx, cy - 48, side, tilt=1.8, thick=17)
        elif state == 'lazy':
            _eye_open(d, cx, cy, pr=20, dy=10, lid=0.5, skin=skin)
            _brow(d, cx, cy - 58, side, tilt=0.2)
        elif state == 'shut':
            pass   # drawn whole in _shut_fix
        elif state == 'happy':
            _arc_eye(d, cx, cy + 6, up=True)
            _brow(d, cx, cy - 70, side, lift=4)
        elif state == 'sad':
            _eye_open(d, cx, cy + 4, ry=46, dy=8)
            _brow(d, cx, cy - 66, side, tilt=-1.4)
        elif state == 'raised':
            _eye_open(d, cx, cy, rx=44, ry=55)
            _brow(d, cx, cy - 92, side, lift=8)
        elif state == 'dizzy':
            d.ellipse([s(cx - 40), s(cy - 50), s(cx + 40), s(cy + 50)], fill=WHITE, outline=INK, width=s(5))
            pts = [(cx + math.cos(a) * a * 1.6, cy + math.sin(a) * a * 1.9) for a in [i * 0.25 for i in range(1, 76)]]
            d.line([(s(x), s(y)) for x, y in pts], fill=INK, width=s(5))
            _brow(d, cx, cy - 72, side, tilt=-0.6)
    if state == 'shut':
        im = _shut_fix(skin, freckles)
    return im


def _shut_fix(skin, freckles):
    """Draw '>' '<' squeezed eyes cleanly (redraw the cell)."""
    im = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    _cheeks(d, freckles)
    for side in (-1, 1):
        cx, cy = 256 + side * EYE_X, EYE_Y
        tip = cx + side * 18          # points toward the nose
        back = cx - side * 26
        d.line([(s(back), s(cy - 20)), (s(tip), s(cy)), (s(back), s(cy + 20))], fill=INK, width=s(10), joint='curve')
        _brow(d, cx, cy - 62, side, tilt=1.0)
    return im


def mouth_cell(state, k=1.3):
    """Draw at 1/k size-units then scale up about the mouth centre (keeps all the shapes in one place)."""
    small = _mouth_raw(state)
    big = small.resize((int(C * k), int(C * k)), Image.LANCZOS)
    ox, oy = int(256 * SS * (k - 1)), int(MOUTH_Y * SS * (k - 1))
    return big.crop((ox, oy, ox + C, oy + C))


def _mouth_raw(state):
    im = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = 256, MOUTH_Y

    def oval(w, h, tongue=True, teeth=False, dy=0):
        box = [s(cx - w), s(cy - h + dy), s(cx + w), s(cy + h + dy)]
        d.ellipse(box, fill=MOUTH, outline=INK, width=s(5))
        if teeth:
            d.chord([s(cx - w + 5), s(cy - h + dy + 4), s(cx + w - 5), s(cy + h + dy)], 200, 340, fill=TEETH)
        if tongue:
            tw, th = w * 0.6, h * 0.45
            d.chord([s(cx - tw), s(cy + h * 0.15 + dy), s(cx + tw), s(cy + h + th + dy)], 180, 360, fill=TONGUE)
            d.ellipse(box, outline=INK, width=s(5))

    if state == 'smile':
        d.arc([s(cx - 46), s(cy - 40), s(cx + 46), s(cy + 22)], 20, 160, fill=INK, width=s(8))
    elif state == 'closed':
        d.arc([s(cx - 30), s(cy - 26), s(cx + 30), s(cy + 12)], 30, 150, fill=INK, width=s(7))
    elif state == 'grin':
        d.chord([s(cx - 56), s(cy - 44), s(cx + 56), s(cy + 44)], 0, 180, fill=MOUTH, outline=INK, width=s(5))
        d.rectangle([s(cx - 50), s(cy + 1), s(cx + 50), s(cy + 12)], fill=TEETH)
        d.chord([s(cx - 26), s(cy + 16), s(cx + 26), s(cy + 50)], 180, 360, fill=TONGUE)
        d.chord([s(cx - 56), s(cy - 44), s(cx + 56), s(cy + 44)], 0, 180, outline=INK, width=s(5))
    elif state == 'o':
        oval(18, 22, tongue=False)
    elif state == 'talk1':
        oval(30, 13, tongue=False)
    elif state == 'talk2':
        oval(38, 26, teeth=True)
    elif state == 'talk3':
        oval(44, 40, teeth=True)
    elif state == 'scream':
        oval(46, 60, dy=10)
    elif state == 'yawn':
        oval(34, 52, dy=8)
    elif state == 'frown':
        d.arc([s(cx - 40), s(cy - 4), s(cx + 40), s(cy + 50)], 200, 340, fill=INK, width=s(8))
    elif state == 'flat':
        d.line([s(cx - 30), s(cy + 6), s(cx + 30), s(cy + 6)], fill=INK, width=s(8))
    elif state == 'shout':
        d.rounded_rectangle([s(cx - 50), s(cy - 22), s(cx + 50), s(cy + 34)], radius=s(20), fill=MOUTH, outline=INK, width=s(5))
        d.rectangle([s(cx - 42), s(cy - 18), s(cx + 42), s(cy - 6)], fill=TEETH)
        d.rectangle([s(cx - 36), s(cy + 20), s(cx + 36), s(cy + 30)], fill=TEETH)
    return im


def atlas(cells):
    out = Image.new('RGBA', (CELL * 4, CELL * 4), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        out.paste(c.resize((CELL, CELL), Image.LANCZOS), ((i % 4) * CELL, (i // 4) * CELL))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    skin = (238, 176, 136, 255)
    for style, freckles in (('plain', False), ('freckles', True)):
        atlas([eye_cell(e, skin, freckles) for e in EYES]).save(os.path.join(OUT, f'eyes_{style}.png'))
    atlas([mouth_cell(m) for m in MOUTHS]).save(os.path.join(OUT, 'mouths.png'))
    json.dump({'eyes': EYES, 'mouths': MOUTHS, 'grid': 4}, open(os.path.join(OUT, 'index.json'), 'w'))
    print('faces ->', OUT)


if __name__ == '__main__':
    main()
