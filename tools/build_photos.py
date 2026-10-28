#!/usr/bin/env python3
"""Build the web-ready photo album.

Scans content/photos (and content/Gifs), skips duplicates (identical files, or the same picture saved
twice, e.g. .JPG / .JPEG / "... 2"), writes small web copies to content/photos-web/ and updates the
"photos" list in content/manifest.json. Your originals are never touched.

Run from the project root:   python3 tools/build_photos.py        (needs: pip install pillow)
"""
import hashlib, json, os, re, shutil, sys
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
SRC, GIFS, OUT = 'content/photos', 'content/Gifs', 'content/photos-web'
MANIFEST = 'content/manifest.json'
FULL_EDGE, THUMB_EDGE = 2000, 440

# Clothing / product / lookbook pictures: listed first in the album, in this order.
CLOTHING = ['KORI 1 poster.jpg', 'KORI 3 POSTER.jpg', 'KORI 4 POSTER.jpg',
            'f85debda14ba4fb0b6118d4885efe3dc 3.PNG', 'kori drop 4.JPG', 'New Project-6.png',
            'Photoroom_20260323_20137 am 2.JPG', 'IMG_7692 2.jpg', 'IMG_7696 2.JPG', 'IMG_6557 2.JPG', 'IMG_6616 2.JPG',
            'IMG_0346 2.jpg', 'IMG_3868 2.JPG', 'IMG_3873 2.JPG', 'IMG_6665 2.JPG', 'Kori 6 9.JPG', 'Kori 6.JPG', 'Kori 9.JPG',
            'Untitled design-3 4.JPG', 'Untitled design-4 3.JPG', 'Photoroom_20260329_111138 pm 2.JPG',
            'Photoroom_20260330_41941 am 5.JPG', 'kori pic 4.JPG', 'kori pic 5.JPG']
# Pictures that sit on the desktop as icons (GIFs are added automatically). Edit "desktop" in the manifest to change later.
DESKTOP = []
TITLES = {'f85debda14ba4fb0b6118d4885efe3dc 3.PNG': 'Red Camo Hoodie',
          'Photoroom_20260323_20137 am 2.JPG': 'Brown Jeans', 'Photoroom_20260329_111138 pm 2.JPG': 'Suit Look',
          'Photoroom_20260330_41941 am 5.JPG': 'Trio Look', 'IMG_7696 2.JPG': 'Leopard Hoodie'}
EXT = ('.jpg', '.jpeg', '.png')
norm = lambda x: re.sub(r'[\s\u202f\u00a0]+', ' ', x)   # macOS uses odd spaces in some file names
CLOTHING_N = [norm(c) for c in CLOTHING]
DESKTOP_N = [norm(c) for c in DESKTOP]


def title_of(fn):
    t = norm(os.path.splitext(fn)[0])
    tn = {norm(k): v for k, v in TITLES.items()}
    if norm(fn) in tn: return tn[norm(fn)]
    if not t.lower().startswith('kori'): t = re.sub(r' \d$', '', t)
    return t.strip()


def slug(fn):
    return re.sub(r'[^a-z0-9]+', '-', os.path.splitext(fn)[0].lower()).strip('-')


def dhash(im):
    g = im.convert('L').resize((9, 8), Image.LANCZOS).tobytes()
    bits = 0
    for r in range(8):
        for c in range(8): bits = (bits << 1) | (g[r * 9 + c] > g[r * 9 + c + 1])
    return bits


def load(fn):
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, fn))); im.load(); return im


def main():
    files = sorted(f for f in os.listdir(SRC) if f.lower().endswith(EXT))
    info = []
    for f in files:
        p = os.path.join(SRC, f); im = load(f)
        info.append(dict(f=f, size=os.path.getsize(p), w=im.width, h=im.height, dh=dhash(im),
                         sha=hashlib.sha1(open(p, 'rb').read()).hexdigest(), alpha=im.mode in ('RGBA', 'LA')))
    # duplicate clusters: identical bytes, or same pixel size + near-identical picture
    used, keep = set(), []
    for i, a in enumerate(info):
        if i in used: continue
        group = [i]; used.add(i)
        for j in range(i + 1, len(info)):
            b = info[j]
            if j not in used and (a['sha'] == b['sha'] or (a['w'] == b['w'] and a['h'] == b['h'] and bin(a['dh'] ^ b['dh']).count('1') <= 3)):
                group.append(j); used.add(j)
        keep.append(info[max(group, key=lambda k: (info[k]['w'] * info[k]['h'], info[k]['size']))])
        if len(group) > 1: print('duplicates ->', keep[-1]['f'], '| skipped:', [info[k]['f'] for k in group if info[k]['f'] != keep[-1]['f']])

    # order: clothing first (in CLOTHING order), then everything else by name
    byname = {norm(k['f']): k for k in keep}
    ordered = [byname[f] for f in CLOTHING_N if f in byname] + [k for k in keep if norm(k['f']) not in CLOTHING_N]

    prev = {}
    if os.path.exists(MANIFEST):
        m = json.load(open(MANIFEST))
        prev = {p.get('orig'): p for p in m.get('photos', []) if p.get('orig')}
    else: m = {}
    os.makedirs(OUT, exist_ok=True)
    photos = []
    for k in ordered:
        f = k['f']; name = slug(f); png = k['alpha']; ext = '.png' if png else '.jpg'
        full, thumb = f'{OUT}/{name}{ext}', f'{OUT}/{name}.thumb{ext}'
        if not (os.path.exists(full) and os.path.exists(thumb)):
            im = load(f)
            for path, edge in ((full, FULL_EDGE), (thumb, THUMB_EDGE)):
                c = im.copy(); c.thumbnail((edge, edge), Image.LANCZOS)
                if png: c.save(path, optimize=True)
                else: c.convert('RGB').save(path, quality=82 if edge == FULL_EDGE else 78, optimize=True, progressive=True)
        e = dict(title=title_of(f), src=full, thumb=thumb, orig=f)
        e['desktop'] = prev.get(f, {}).get('desktop', norm(f) in DESKTOP_N)
        photos.append(e)

    # GIFs keep their animation; thumbnail is the first frame
    if os.path.isdir(GIFS):
        os.makedirs(f'{OUT}/gifs', exist_ok=True)
        seen = set()
        for i, f in enumerate(sorted(x for x in os.listdir(GIFS) if x.lower().endswith('.gif')), 1):
            sha = hashlib.sha1(open(os.path.join(GIFS, f), 'rb').read()).hexdigest()
            if sha in seen: print('duplicate gif skipped:', f); continue
            seen.add(sha)
            name = f'gif-{i}'; dst = f'{OUT}/gifs/{name}.gif'; th = f'{OUT}/gifs/{name}.thumb.jpg'
            if not os.path.exists(dst): shutil.copyfile(os.path.join(GIFS, f), dst)
            if not os.path.exists(th):
                g = Image.open(os.path.join(GIFS, f)); g.seek(0); g = g.convert('RGB'); g.thumbnail((THUMB_EDGE, THUMB_EDGE)); g.save(th, quality=78)
            photos.append(dict(title=f'3D GIF {i}', src=dst, thumb=th, orig='gifs/' + f, desktop=prev.get('gifs/' + f, {}).get('desktop', True)))

    m['photos'] = photos
    json.dump(m, open(MANIFEST, 'w'), indent=2)
    tot = sum(os.path.getsize(os.path.join(dp, x)) for dp, _, fs in os.walk(OUT) for x in fs)
    print(f'{len(files)} files -> {len(keep)} unique photos + gifs; {len(photos)} entries; web copies: {tot/1e6:.1f} MB')


if __name__ == '__main__':
    main()
