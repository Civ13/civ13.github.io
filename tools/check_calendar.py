"""Check generated calendar-page output against its reviewed normalized data."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path


class CalendarParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards = []
        self.card = None
        self.downloads = []
        self.empty = False
        self.sync_downloads = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'calendar-empty' in attrs.get('class', '').split():
            self.empty = True
        if tag == 'article' and 'calendar-event' in attrs.get('class', '').split():
            self.card = {'text': '', 'times': [], 'hrefs': []}
        if self.card is not None:
            assert tag not in ('script', 'iframe', 'img'), 'event text created an active element'
            if tag == 'time':
                self.card['times'].append(attrs.get('datetime'))
            if tag == 'a':
                self.card['hrefs'].append(attrs.get('href'))
        if tag == 'a' and 'download' in attrs:
            if 'data-sync-download' in attrs:
                assert 'hidden' in attrs and 'href' not in attrs, 'Discord placeholder offers a static download'
                assert attrs['download'] == 'civ13-discord.ics', 'unexpected Discord download placeholder'
                self.sync_downloads += 1
            else:
                self.downloads.append(attrs.get('href'))

    def handle_data(self, data):
        if self.card is not None:
            self.card['text'] += data

    def handle_endtag(self, tag):
        if tag == 'article' and self.card is not None:
            self.cards.append(self.card)
            self.card = None


def check_calendar(root, source, base=''):
    html = (root / 'community-events/index.html').read_text(encoding='utf-8')
    assert '{{' not in html and '{%' not in html, 'unrendered calendar template'
    events = json.loads((source / '_data/community_calendar.json').read_text(encoding='utf-8'))['events']
    parser = CalendarParser()
    parser.feed(html)
    sync_enabled = json.loads((source / '_data/discord_calendar.json').read_text(encoding='utf-8'))['enabled']
    assert parser.sync_downloads == int(sync_enabled), 'Discord download placeholder differs from reviewed configuration'
    assert len(parser.cards) == len(events)
    ics = root / 'public/calendar/civ13.ics'
    if not events:
        assert parser.empty and not parser.downloads and not ics.exists()
    else:
        assert not parser.empty
        assert parser.downloads == [base + '/public/calendar/civ13.ics']
        assert ics.read_bytes() == (source / 'public/calendar/civ13.ics').read_bytes()
        for card, event in zip(parser.cards, events):
            assert card['times'] == [event['start_at'], event['end_at']]
            for field in ('title', 'location', 'start_label', 'end_label'):
                assert event[field] in card['text'], (field, event['id'])
            assert ''.join(event['description'].split()) in ''.join(card['text'].split())
            assert ('Cancelled' if event['status'] == 'cancelled' else 'Scheduled') in card['text']
            assert card['hrefs'] == [event['url']]
    assert not (root / 'tools/calendar').exists(), 'calendar source tooling was published'
    print(f'Calendar: {len(events)} escaped public events; empty state/download and UTC times checked; base={base!r}')


if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('root', type=Path)
    args.add_argument('--source', type=Path, default=Path(__file__).resolve().parent.parent)
    args.add_argument('--base', default='')
    options = args.parse_args()
    check_calendar(options.root, options.source, options.base)
