"""Script -> voice lines -> shot timing + caption timeline (the picture is cut to the voice: no dead air).

python tools/voice.py <film> tts [ids]  # Kokoro per line (+ pitch / tempo per voice), Whisper check, word timestamps;
                                        # ids = g03_0,g07_1 redoes only those lines (Kokoro varies run to run)
python tools/voice.py <film> timing     # fit the shots to the lines -> <film>/timing.json, voice/timeline.json, voice.wav, visemes.json

<film>/voice/script.json:
  voices:  {who: {voice: Kokoro voice id, speed: <= 1.3, pitch: semitones, tempo: ffmpeg atempo speed-up}}
  groups:  [{shots: [ids], lines: [{who, text, caption?, key: [words shown yellow]}]}]  in shot order
  labels:  [{shot, until?, text, style: yellow|red|green|small_red|title|scope, count?: [from, to] for "{n}"}]
  timing:  {floor: 0.7, min_k: {first shot id of a group: floor}}  (optional)
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import LIB, PY  # noqa: E402

ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()   # the film folder
HERE = os.path.join(ROOT, 'voice')
LINES_DIR = os.path.join(HERE, 'lines')
SR = 24000
LEAD, GAP, TAIL = 0.0, 0.03, 0.04   # lines follow each other 0.03 s apart


def _timing_cfg():
    cfg = json.load(open(os.path.join(HERE, 'script.json'))).get('timing', {})
    # floor on how far a group's shots may shrink to its lines; a floor above the fit leaves a gap (reported)
    return cfg.get('min_k', {}), cfg.get('floor', 0.7)


def load_script():
    return json.load(open(os.path.join(HERE, 'script.json')))


def flat_lines(sc):
    out = []
    for gi, g in enumerate(sc['groups']):
        for li, ln in enumerate(g['lines']):
            who = ln.get('who', 'narrator')
            v = sc['voices'][who]
            out.append(dict(id=f'g{gi:02d}_{li}', group=gi, who=who, text=ln['text'], voice=v['voice'],
                            speed=v['speed'], pitch=v.get('pitch', 0), tempo=v.get('tempo', 1.0), caption=ln.get('caption', ln['text']),
                            key=[k.lower() for k in ln.get('key', [])], asr=ln.get('asr')))
    return out


def tts():
    sc = load_script()
    lines = flat_lines(sc)
    os.makedirs(LINES_DIR, exist_ok=True)
    spec = [dict(id=l['id'], text=l['text'], voice=l['voice'], speed=l['speed'], **({'asr': l['asr']} if l['asr'] else {})) for l in lines]
    path = os.path.join(LINES_DIR, 'lines.json')
    json.dump(spec, open(path, 'w'), indent=1)
    only = set(filter(None, (sys.argv[3] if len(sys.argv) > 3 else os.environ.get('ONLY', '')).split(',')))
    _kokoro([L for L in spec if not only or L['id'] in only])
    for l in lines:
        if only and l['id'] not in only:
            continue
        if l['pitch']:
            _pitch(os.path.join(LINES_DIR, l['id'] + '.wav'), l['pitch'])
        if l['tempo'] != 1.0:
            _tempo(os.path.join(LINES_DIR, l['id'] + '.wav'), l['tempo'])
    _durations(lines)
    r = subprocess.run([PY, os.path.join(LIB, 'core/tts/asr_check.py'), path, LINES_DIR, '--lang', 'en', '--model', 'small.en'])
    print('asr_check exit', r.returncode)


def _kokoro(spec):
    """Kokoro with a gentle trim: the library's 2% gate clips soft first consonants ('Kevin' -> 'heaven')."""
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    tts_dir = os.path.join(LIB, 'core', 'tts')
    k = Kokoro(os.path.join(tts_dir, 'kokoro-v1.0.onnx'), os.path.join(tts_dir, 'voices-v1.0.bin'))
    dur = {}
    for L in spec:
        a, sr = k.create(', ' + L['text'], voice=L['voice'], speed=L['speed'], lang='en-us')
        nz = np.where(np.abs(a) > np.abs(a).max() * 0.006)[0]
        if len(nz):
            a = a[max(0, nz[0] - int(0.09 * sr)): nz[-1] + int(0.1 * sr)]
        sf.write(os.path.join(LINES_DIR, L['id'] + '.wav'), a, sr)
        dur[L['id']] = round(len(a) / sr, 3)
        print(L['id'], dur[L['id']], L['text'])



def _tempo(wav, k):
    """Speed up delivery without changing pitch (clearer than pushing Kokoro's own speed)."""
    tmp = wav + '.tmp.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', f'atempo={k:.4f}', tmp], check=True)
    os.replace(tmp, wav)


def _durations(lines):
    import soundfile as sf
    dur = {l['id']: round(sf.info(os.path.join(LINES_DIR, l['id'] + '.wav')).duration, 3) for l in lines}
    json.dump(dur, open(os.path.join(LINES_DIR, 'dur.json'), 'w'), indent=1)


def _pitch(wav, semis):
    """Raise pitch, keep duration (cartoon voice)."""
    ratio = 2 ** (semis / 12)
    tmp = wav + '.tmp.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af',
                    f'asetrate={int(SR * ratio)},aresample={SR},atempo={1 / ratio:.5f}', tmp], check=True)
    os.replace(tmp, wav)


def timing():
    MIN_K, K_FLOOR = _timing_cfg()
    DURATIONS = json.load(open(os.path.join(ROOT, 'durations.json')))
    sc = load_script()
    lines = flat_lines(sc)
    dur = json.load(open(os.path.join(LINES_DIR, 'dur.json')))
    words = json.load(open(os.path.join(LINES_DIR, 'words.json')))
    shot_dur = dict(DURATIONS)
    placed, t = [], 0.0
    for gi, g in enumerate(sc['groups']):
        gl = [l for l in lines if l['group'] == gi]
        need = LEAD + sum(dur[l['id']] for l in gl) + GAP * (len(gl) - 1) + TAIL
        have = sum(DURATIONS[s] for s in g['shots'])
        k = max(MIN_K.get(g['shots'][0], K_FLOOR), need / have)
        if k > need / have + 1e-6:
            print(f"  gap {(k * have - need):.2f}s after group {g['shots']}")   # shots shrink or grow to the voice: no dead air
        for s in g['shots']:
            shot_dur[s] = round(DURATIONS[s] * k * 30) / 30
        cur = t + LEAD
        for l in gl:
            placed.append(dict(l, start=round(cur, 3), dur=dur[l['id']]))
            cur += dur[l['id']] + GAP
        t += sum(shot_dur[s] for s in g['shots'])
    starts, acc = {}, 0.0
    for s in sorted(shot_dur):
        starts[s] = acc
        acc += shot_dur[s]
    json.dump(shot_dur, open(os.path.join(ROOT, 'timing.json'), 'w'), indent=1)
    timeline = dict(total=round(acc, 3), lines=[{k: p[k] for k in ('id', 'who', 'start', 'dur', 'caption')} for p in placed],
                    words=_caption_words(placed, words), labels=_labels(sc, starts, shot_dur), tapes=[])
    for lb in sc['labels']:
        if lb.get('tape'):
            timeline['tapes'].append(dict(t0=starts[lb['shot']] + 0.2, t1=starts[lb['shot']] + shot_dur[lb['shot']]))
    json.dump(timeline, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
    _mix_voice(placed, acc)
    visemes()
    print(f'total {acc:.2f}s  (storyboard {sum(DURATIONS.values()):.2f}s)')


def visemes():
    """Per-line mouth-open envelope at 30 fps (0..1), for lip sync in Blender -> visemes.json."""
    import numpy as np
    import soundfile as sf
    out = {}
    for f in sorted(os.listdir(LINES_DIR)):
        if not f.endswith('.wav'):
            continue
        a, sr = sf.read(os.path.join(LINES_DIR, f), dtype='float32')
        hop = sr // 30
        rms = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) for i in range(0, len(a), hop)])
        ref = np.percentile(rms, 95) or 1.0
        env = np.clip(rms / ref, 0, 1)
        env = np.where(env < 0.12, 0, env)
        env = np.convolve(env, [0.25, 0.5, 0.25], mode='same')
        out[f[:-4]] = [round(float(x), 3) for x in env]
    json.dump(out, open(os.path.join(HERE, 'visemes.json'), 'w'))
    print('visemes', len(out))


def _caption_words(placed, asr):
    """One caption word at a time. Display tokens are spread over the spoken words' timing."""
    out = []
    for p in placed:
        spoken = [(max(0.0, w[1]), w[2]) for w in asr.get(p['id'], [])]
        tokens = p['caption'].replace('...', ' ').split()
        if spoken and len(spoken) == len(tokens):
            times = spoken
        else:
            total = sum(len(x) for x in tokens) or 1
            acc, times = 0.0, []
            for x in tokens:
                a = acc / total * p['dur']
                acc += len(x)
                times.append((a, acc / total * p['dur']))
        for i, (tok, (a, b)) in enumerate(zip(tokens, times)):
            nxt = times[i + 1][0] if i + 1 < len(times) else b + 0.25
            clean = tok.strip('.,!?…"')
            clean = clean[:1].upper() + clean[1:]          # reference style: every word capitalised
            out.append(dict(w=clean or tok, t0=round(p['start'] + a, 3), t1=round(p['start'] + max(b, nxt), 3),
                            key=clean.lower() in p['key']))
    return out


def _labels(sc, starts, shot_dur):
    out = []
    for lb in sc['labels']:
        if lb.get('tape'):
            continue
        end_shot = lb.get('until', lb['shot'])
        out.append(dict(text=lb['text'], style=lb.get('style', 'yellow'), t0=round(starts[lb['shot']] + 0.15, 3),
                        t1=round(starts[end_shot] + shot_dur[end_shot], 3), **({'count': lb['count']} if 'count' in lb else {})))
    return out


def _mix_voice(placed, total):
    import numpy as np
    import soundfile as sf
    buf = np.zeros(int((total + 1) * SR), dtype=np.float32)
    for p in placed:
        a, sr = sf.read(os.path.join(LINES_DIR, p['id'] + '.wav'), dtype='float32')
        i = int(p['start'] * sr)
        buf[i:i + len(a)] += a[: len(buf) - i]
    sf.write(os.path.join(HERE, 'voice.wav'), buf[: int(total * SR)], SR)


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[2] not in ('tts', 'timing', 'visemes'):
        sys.exit(__doc__)
    {'tts': tts, 'timing': timing, 'visemes': visemes}[sys.argv[2]]()
