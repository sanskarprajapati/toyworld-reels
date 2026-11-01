"""Draw captions + labels over the rendered picture and encode, in one ffmpeg pass.

python tools/overlay.py <film>/voice/timeline.json picture.mp4 out.mp4
timeline.json: {"words":[{"w","t0","t1","key"}], "labels":[{"text","t0","t1","style"}], "tapes":[{"t0","t1"}]}
"""
import json
import math
import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # the toyworld-reels repo
FONTS = os.path.join(ROOT, 'assets', 'fonts')

CAPTION_Y = 0.53
LABEL_Y = 0.30
STYLES = {
    'yellow': dict(fill=(255, 216, 74), stroke=(28, 28, 52), size=96),
    'red': dict(fill=(236, 52, 58), stroke=(40, 10, 14), size=100, tilt=4),
    'green': dict(fill=(98, 226, 92), stroke=(16, 60, 22), size=100),
    'small_red': dict(fill=(240, 70, 70), stroke=(40, 10, 14), size=58),
    'title': dict(fill=(255, 255, 255), stroke=(28, 28, 52), size=110),
}


def caption_font(size=74):
    f = ImageFont.truetype(os.path.join(FONTS, 'Fredoka.ttf'), size)
    try:
        f.set_variation_by_name('Bold')
    except Exception:
        pass
    return f


def label_font(size):
    return ImageFont.truetype(os.path.join(FONTS, 'LilitaOne.ttf'), size)


def _text_layer(text, font, fill, stroke, stroke_w, shadow=True):
    box = font.getbbox(text, stroke_width=stroke_w)
    w, h = box[2] - box[0] + 40, box[3] - box[1] + 40
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if shadow:
        sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((20 - box[0] + 3, 20 - box[1] + 6), text, font=font, fill=(0, 0, 0, 200),
                                stroke_width=stroke_w, stroke_fill=(0, 0, 0, 200))
        layer = Image.alpha_composite(layer, sh.filter(ImageFilter.GaussianBlur(7)))
    ImageDraw.Draw(layer).text((20 - box[0], 20 - box[1]), text, font=font, fill=fill,
                               stroke_width=stroke_w, stroke_fill=stroke)
    return layer


class Overlay:
    def __init__(self, tl):
        self.words = tl.get('words', [])
        self.labels = tl.get('labels', [])
        self.tapes = tl.get('tapes', [])
        self.cfont = caption_font()
        self.cache = {}

    def _cap(self, w, key):
        k = ('c', w, key)
        if k not in self.cache:
            fill = (255, 214, 64) if key else (255, 255, 255)
            self.cache[k] = _text_layer(w, self.cfont, fill, (20, 20, 20), 3)
        return self.cache[k]

    def _label(self, text, style):
        k = ('l', text, style)
        if k not in self.cache:
            st = STYLES[style]
            lay = _text_layer(text, label_font(st['size']), st['fill'], st['stroke'], 9)
            if st.get('tilt'):
                lay = lay.rotate(st['tilt'], resample=Image.BICUBIC, expand=True)
            self.cache[k] = lay
        return self.cache[k]

    @staticmethod
    def _paste(frame, layer, cx, cy, scale=1.0):
        if scale != 1.0:
            layer = layer.resize((max(1, int(layer.width * scale)), max(1, int(layer.height * scale))), Image.BICUBIC)
        frame.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))

    def _tape(self, frame, age, dur):
        k = ('tape',)
        if k not in self.cache:
            band = Image.new('RGBA', (1700, 110), (247, 206, 30, 255))
            d = ImageDraw.Draw(band)
            f = label_font(62)
            d.text((30, 18), 'DO NOT CROSS  •  CRIME SCENE  •  DO NOT CROSS  •  CRIME SCENE', font=f, fill=(20, 20, 20))
            self.cache[k] = band.rotate(-9, resample=Image.BICUBIC, expand=True)
        band = self.cache[k]
        slide = 1 - (1 - min(1.0, age / 6)) ** 3
        x = int((W - band.width) / 2 - (1 - slide) * band.width)
        frame.alpha_composite(band, (x, int(H * 0.2)))

    def _scope(self):
        """Periscope view: black frame with a round window and a thin crosshair."""
        if 'scope' not in self.cache:
            m = Image.new('RGBA', (W, H), (8, 10, 12, 255))
            r = int(W * 0.46)
            hole = Image.new('L', (W, H), 255)
            ImageDraw.Draw(hole).ellipse((W // 2 - r, H // 2 - r, W // 2 + r, H // 2 + r), fill=0)
            m.putalpha(hole.filter(ImageFilter.GaussianBlur(6)))
            d = ImageDraw.Draw(m)
            for k in (-1, 1):
                d.line((W // 2 + k * 60, H // 2, W // 2 + k * (r - 30), H // 2), fill=(20, 20, 20, 200), width=4)
                d.line((W // 2, H // 2 + k * 60, W // 2, H // 2 + k * (r - 30)), fill=(20, 20, 20, 200), width=4)
            self.cache['scope'] = m
        return self.cache['scope']

    def frame(self, f):
        t = f / FPS
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for tp in self.tapes:
            if tp['t0'] <= t < tp['t1']:
                self._tape(img, f - tp['t0'] * FPS, tp['t1'] - tp['t0'])
        for lb in self.labels:
            if lb.get('style') == 'scope' and lb['t0'] <= t < lb['t1']:
                img.alpha_composite(self._scope())
        for lb in self.labels:
            if lb.get('style') == 'scope':
                continue
            if lb['t0'] <= t < lb['t1']:
                age = f - lb['t0'] * FPS
                text = lb['text']
                if 'count' in lb:   # a number counting up over the first 80% of the label
                    a, b = lb['count']
                    k = min(1.0, age / max(1.0, 0.8 * (lb['t1'] - lb['t0']) * FPS))
                    text = text.replace('{n}', str(int(round(a + (b - a) * (1 - (1 - k) ** 2)))))
                self._paste(img, self._label(text, lb.get('style', 'yellow')), W / 2,
                            H * lb.get('y', LABEL_Y), _pop(age))
        for wd in self.words:
            if wd['t0'] <= t < wd['t1']:
                age = f - wd['t0'] * FPS
                self._paste(img, self._cap(wd['w'], wd.get('key', False)), W / 2, H * CAPTION_Y, _pop(age, 4, 0.88))
                break
        return img


def _pop(age, dur=6, start=0.4):
    if age >= dur:
        return 1.0
    t = age / dur
    return start + (1 - start) * (1 - (1 - t) ** 3) + 0.12 * math.sin(t * math.pi)


def main(tl_path, picture, out):
    tl = json.load(open(tl_path))
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', picture]))
    n = int(round(dur * FPS))
    ov = Overlay(tl)
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', picture,
           '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[v]', '-map', '[v]',
           '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(n):
        p.stdin.write(ov.frame(f).tobytes())
    p.stdin.close()
    sys.exit(p.wait())


if __name__ == '__main__':
    main(*sys.argv[1:4])
