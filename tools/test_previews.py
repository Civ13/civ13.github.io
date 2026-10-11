"""Integration checks against the locked Jekyll renderer and malformed payloads."""
import copy
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from check_preview import HeadParser, check_html, script_json, validate_payload
from check_site_previews import check_site


def test_invalid():
    payload = {'component': {'type': 17, 'components': [{'type': 10, 'content': 'Hello'}]}}
    assert not validate_payload(script_json(payload))[0]
    invalid = []
    invalid.append(' ' * 3001)
    many = copy.deepcopy(payload)
    many['component']['components'] *= 40
    invalid.append(json.dumps(many))
    for child in (
        {'type': 17, 'components': [{'type': 10, 'content': 'Nested'}]},
        {'type': 12, 'items': [{'media': {'url': 'https://example.com/a.png'}}] * 11},
        {'type': 1, 'components': [{'type': 2, 'style': 5, 'label': 'Bad', 'url': 'https://example.com', 'custom_id': 'no'}]},
        {'type': 1, 'components': [{'type': 2, 'style': 5, 'label': 'Bad', 'url': 'https://example.com', 'extra': True}]},
        {'type': 1, 'components': [{'type': 2, 'style': 5, 'label': 'Bad', 'url': 'https://example.com/' + 'x' * 512}]},
    ):
        bad = copy.deepcopy(payload)
        bad['component']['components'] = [child]
        invalid.append(json.dumps(bad))
    for raw in invalid:
        assert validate_payload(raw)[0], 'invalid payload accepted'
    print('Malformed payload checks passed')


def test_render():
    repo = Path(__file__).resolve().parent.parent
    with tempfile.TemporaryDirectory() as tmp:
        source = Path(tmp) / 'source'
        shutil.copytree(repo, source, ignore=shutil.ignore_patterns('.git', '_site', 'tools', 'vendor', '.bundle', '__pycache__'))
        fixtures = {
            'escaped': 'Quotes " & café 雪 </ScRiPt><script>alert(1)</script>',
            'oversize': '雪' * 1100,
            'empty': '',
        }
        for name, text in fixtures.items():
            (source / (name + '.md')).write_text('---\nlayout: default\ntitle: ' + json.dumps(text, ensure_ascii=False) + '\ndescription: ' + json.dumps(text, ensure_ascii=False) + '\nimage: /public/img/banner.png\n---\nFixture\n', encoding='utf-8')
        config = Path(tmp) / 'alternate.yml'
        config.write_text('url: https://preview.example\nbaseurl: /civ13\n', encoding='utf-8')
        output = Path(tmp) / 'site'
        # Jekyll 3.10 resolves layout paths relative to the working directory.
        # Keep fixtures isolated while reusing the repository's locked bundle.
        subprocess.run(['bundle', 'exec', 'jekyll', 'build', '--source', str(source), '--destination', str(output), '--config', str(source / '_config.yml') + ',' + str(config)], cwd=source, env=dict(os.environ, BUNDLE_GEMFILE=str(repo / 'Gemfile')), check=True)
        check_site(output, 'https://preview.example', '/civ13')
        assert 'src="/civ13/public/img/splash.png"' in (output / 'civ14.html').read_text(encoding='utf-8')
        html = (output / 'escaped.html').read_text(encoding='utf-8')
        errors, counts = check_html(html)
        assert not errors, errors
        parser = HeadParser()
        parser.feed(html)
        assert fixtures['escaped'] in json.loads(parser.scripts[0])['component']['components'][0]['content']
        assert '<' not in parser.scripts[0]
        for name in ('oversize', 'empty'):
            parser = HeadParser()
            parser.feed((output / (name + '.html')).read_text(encoding='utf-8'))
            assert not parser.scripts, name + ' should omit the component preview'
            assert parser.metadata.get('og:title') and parser.metadata.get('og:image')
        print('Jekyll Unicode, script escaping, oversized/empty omission, alternate-origin and fallback checks passed', counts)


if __name__ == '__main__':
    test_invalid()
    test_render()
