"""Validate built architecture routes, local links, preserved downloads and diagram safety."""
import argparse
import hashlib
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import zipfile
import xml.etree.ElementTree as ET

PIN = '5bf351248de6050876fe5b53f91209a970cc5668'
ROUTES = ('', 'diagrams', 'audit', 'runtime', 'persistence', 'coverage', 'validation')
ASSET = 'public/architecture/2026-10-20'
DOWNLOADS = {
    'Civ13-architecture-UML-atlas.pdf': '78c375999da1a1fffe40f7c3f9eefdba5b596d2598ab7c9475d2524f8bc3abf7',
    'Civ13-architecture-audit-evidence.zip': '35ca1c1c6fd062914fb6eb41dc218848b057e574713bc0a01aebbc9c3975df84',
}

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.image_errors = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for key in ('href', 'src'):
            if a.get(key): self.urls.append(a[key])
        if tag == 'img' and '/architecture/' in a.get('src', ''):
            if not a.get('alt'): self.image_errors.append('diagram lacks alt text')
            if not a.get('width') or not a.get('height'): self.image_errors.append('diagram lacks dimensions')

def check(root):
    checked = 0
    for slug in ROUTES:
        route = 'architecture/' + (slug + '/' if slug else '')
        page = root / route / 'index.html'
        text = page.read_text()
        assert '{{' not in text, str(page) + ': unrendered Liquid'
        assert PIN in text or slug == 'coverage', str(page) + ': source pin absent'
        assert 'Architecture' in text or 'architecture' in text, str(page) + ': content absent'
        parser = Links(); parser.feed(text)
        assert not parser.image_errors, parser.image_errors
        for href in parser.urls:
            parts = urlsplit(href)
            if parts.scheme or parts.netloc or not parts.path: continue
            path = unquote(parts.path)
            candidate = root / path.lstrip('/') if path.startswith('/') else page.parent / path
            if path.endswith('/'): candidate = candidate / 'index.html'
            assert candidate.exists(), f'{page}: broken local link {href}'
            checked += 1
    home = (root / 'architecture/index.html').read_text()
    assert 'not an exhaustive enumeration' in home
    assert 'No gameplay runtime or live server was tested' in home
    assert 'UML Atlas' in (root / 'index.html').read_text(), 'atlas absent from main navigation'
    for name, digest in DOWNLOADS.items():
        data = (root / ASSET / name).read_bytes()
        assert hashlib.sha256(data).hexdigest() == digest, name + ': original audit download changed'
    assert (root / ASSET / 'Civ13-architecture-UML-atlas.pdf').read_bytes().startswith(b'%PDF-')
    with zipfile.ZipFile(root / ASSET / 'Civ13-architecture-audit-evidence.zip') as bundle:
        assert bundle.testzip() is None
        assert 'inventory/call-sites.csv' in bundle.namelist()
        assert 'README.md' in bundle.namelist()
    svgs = list((root / ASSET).rglob('*.svg'))
    assert len(svgs) == 20, 'expected 18 UML and 2 graph views'
    for path in svgs:
        svg = ET.parse(path)
        for element in svg.iter():
            assert element.tag.split('}')[-1] not in ('script', 'foreignObject'), str(path) + ': active SVG'
            assert not any(k.lower().startswith('on') for k in element.attrib), str(path) + ': event handler'
    assert not (root / ASSET / 'inventory/call-sites.csv').exists(), 'large raw table should stay in ZIP'
    print(f'Architecture atlas passed: {len(ROUTES)} routes, {checked} local references, {len(svgs)} SVGs, 2 checksum-pinned downloads')

if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('root', type=Path)
    check(args.parse_args().root)
