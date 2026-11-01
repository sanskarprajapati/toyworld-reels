"""Download the CC0 3D assets the kit uses from Poly Haven into assets/ (sky HDRI, ground textures, olive trees).

python tools/fetch_assets.py            # skips files that are already there and match Poly Haven's md5

Everything here is CC0 (public domain) from https://polyhaven.com. Nothing is redistributed in this repo.
"""
import hashlib
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
API = 'https://api.polyhaven.com/files/'
UA = {'User-Agent': 'toyworld-reels asset fetch (+https://github.com/sanskarprajapati/toyworld-reels)'}

HDRI = ('kloofendal_48d_partly_cloudy_puresky', 'hdri/sky_2k.hdr')
TEXTURES = ['grass_ground', 'rocky_trail', 'leafy_grass', 'brown_mud_leaves_01']   # 1k diffuse + GL normal
TREES = ['island_tree_01', 'island_tree_02', 'island_tree_03']                      # 1k glTF with textures


def files(asset_id):
    with urllib.request.urlopen(urllib.request.Request(API + asset_id, headers=UA), timeout=30) as r:
        return json.load(r)


def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def get(entry, dest):
    """entry = Poly Haven file record {url, md5, size}; dest relative to assets/."""
    path = os.path.join(ASSETS, dest)
    if os.path.exists(path) and md5(path) == entry['md5']:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    print(f'  ↓ {dest} ({entry["size"] / 1e6:.1f} MB)', flush=True)
    tmp = path + '.part'
    with urllib.request.urlopen(urllib.request.Request(entry['url'], headers=UA), timeout=120) as r, open(tmp, 'wb') as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    if md5(tmp) != entry['md5']:
        os.remove(tmp)
        sys.exit(f'✗ checksum mismatch for {dest}; run again')
    os.replace(tmp, path)
    return True


def main():
    n = 0
    print('Poly Haven assets (CC0) → assets/')
    hid, dest = HDRI
    n += get(files(hid)['hdri']['2k']['hdr'], dest)
    for t in TEXTURES:
        f = files(t)
        n += get(f['Diffuse']['1k']['jpg'], f'textures/{t}_diff.jpg')
        n += get(f['nor_gl']['1k']['jpg'], f'textures/{t}_nor.jpg')
    for t in TREES:
        g = files(t)['gltf']['1k']['gltf']
        n += get(g, f'trees/{t}/{t}.gltf')
        for rel, entry in g['include'].items():
            n += get(entry, f'trees/{t}/{rel}')
    print(f'✓ assets ready ({n} downloaded)')


if __name__ == '__main__':
    main()
