"""Check the built public pages, canonical metadata, and local raster assets."""
import argparse
import json
import struct
from pathlib import Path
from urllib.parse import urlsplit
from check_preview import HeadParser, check_html

PAGES = ('index.html', 'civ14.html', 'typespess.html', 'news/civilization.html', 'game-modes/index.html')


def check_site(root, origin='https://civ13.github.io', base=''):
    for name in PAGES:
        html = (root / name).read_text(encoding='utf-8')
        errors, counts = check_html(html)
        parser = HeadParser()
        parser.feed(html)
        route = '/' if name == 'index.html' else '/' + name
        if name == 'game-modes/index.html':
            route = '/game-modes/'
        expected = origin + base + route
        if parser.metadata.get('og:url') != expected:
            errors.append('incorrect canonical OG URL: ' + expected)
        if parser.metadata.get('twitter:card') != 'summary_large_image':
            errors.append('expected large-image Twitter fallback')
        image_url = parser.metadata.get('og:image', '')
        if not image_url.startswith(origin + base + '/public/img/'):
            errors.append('incorrect image origin/base path')
        else:
            image = root / urlsplit(image_url).path.removeprefix(base + '/')
            data = image.read_bytes()
            if data[:8] != b'\x89PNG\r\n\x1a\n':
                errors.append('image is not real PNG data')
            else:
                width, height = struct.unpack('>II', data[16:24])
                if parser.metadata.get('og:image:width') != str(width) or parser.metadata.get('og:image:height') != str(height):
                    errors.append('image dimensions differ from fallback metadata')
        # Removing the component script must leave exactly the same fallback.
        import re
        fallback = re.sub(r'<script id="discord:component-embed".*?</script>', '', html, flags=re.S)
        fallback_parser = HeadParser()
        fallback_parser.feed(fallback)
        if fallback_parser.metadata != parser.metadata:
            errors.append('fallback depends on component script')
        if errors:
            raise AssertionError(f'{name}: {errors}')
        print(json.dumps({'page': name, **counts, 'canonical': expected}))
    missing = HeadParser()
    missing.feed((root / '404.html').read_text(encoding='utf-8'))
    assert not missing.scripts, '404 must not advertise a content card'


if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('root', type=Path)
    args.add_argument('--origin', default='https://civ13.github.io')
    args.add_argument('--base', default='')
    options = args.parse_args()
    check_site(options.root, options.origin, options.base)
