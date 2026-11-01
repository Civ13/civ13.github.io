"""Check actual Jekyll output, including subpath links and escaped catalog text."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path


class HelpParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards = []
        self.card = None
        self.controls = {}
        self.in_heading = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article' and 'help-resource' in attrs.get('class', '').split():
            assert self.card is None
            self.card = {'category': attrs['data-category'], 'keywords': attrs['data-keywords'], 'title': '', 'hrefs': [], 'text': '', 'hidden': 'hidden' in attrs}
        if self.card is not None:
            if tag == 'h2':
                self.in_heading = True
            if tag == 'a':
                self.card['hrefs'].append(attrs.get('href'))
            assert tag not in ('script', 'iframe', 'img'), 'catalog created an active element'
        if attrs.get('id', '').startswith('help-'):
            self.controls[attrs['id']] = attrs

    def handle_data(self, data):
        if self.card is not None:
            self.card['text'] += data
            if self.in_heading:
                self.card['title'] += data

    def handle_endtag(self, tag):
        if tag == 'h2':
            self.in_heading = False
        if tag == 'article' and self.card is not None:
            self.cards.append(self.card)
            self.card = None


def check_help(root, source, base=''):
    html = (root / 'player-help/index.html').read_text(encoding='utf-8')
    assert '{{' not in html and '{%' not in html, 'unrendered Liquid'
    parser = HelpParser()
    parser.feed(html)
    resources = json.loads((source / '_data/help_resources.json').read_text(encoding='utf-8'))
    assert len(parser.cards) == len(resources) > 0
    for card, resource in zip(parser.cards, resources):
        assert card['title'].strip() == resource['title']
        assert resource['description'] in card['text']
        assert card['category'] == resource['category']
        assert card['keywords'] == resource['keywords']
        expected_url = resource['url'] if resource['url'].startswith('https://') else base + resource['url']
        assert card['hrefs'] == [expected_url], (card['hrefs'], expected_url)
    assert 'hidden' in parser.controls['help-finder'], 'unusable search must stay hidden without JS'
    assert parser.controls['help-search']['maxlength'] == '160'
    assert parser.controls['help-count']['role'] == 'status'
    assert parser.controls['help-count']['aria-live'] == 'polite'
    assert all(not card['hidden'] for card in parser.cards), 'guide links must remain browsable without JS'
    assert not (root / 'tools/monitoring').exists(), 'operator tooling was published'
    assert base + '/public/js/player-help.js' in html
    print(f'Player help: {len(resources)} escaped, browsable links; base={base!r}; operator tools excluded')


if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('root', type=Path)
    args.add_argument('--source', type=Path, default=Path(__file__).resolve().parent.parent)
    args.add_argument('--base', default='')
    options = args.parse_args()
    check_help(options.root, options.source, options.base)
