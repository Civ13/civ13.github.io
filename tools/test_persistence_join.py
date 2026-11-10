"""Offline route contract; never opens a browser, game or network connection."""
from html.parser import HTMLParser
from pathlib import Path
import sys
import unittest

ROOT = Path(sys.argv.pop(1)) if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else Path(__file__).resolve().parents[1]
TARGET = "byond://play.valzargaming.com:1714"

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.refresh, self.scripts = [], [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a": self.links.append(attrs.get("href"))
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.refresh.append(attrs.get("content"))
        if tag == "script": self.scripts.append(attrs)

class JoinContract(unittest.TestCase):
    def test_gateway_and_fallback(self):
        html = (ROOT / "persistence/index.html").read_text()
        page = Page()
        page.feed(html)
        self.assertEqual(page.refresh, ["0; url=" + TARGET])
        self.assertEqual([url for url in page.links if url and url.startswith("byond:")], [TARGET])
        self.assertIn("<code>" + TARGET + "</code>", html)
        self.assertNotIn(":1715", html)
        self.assertEqual(page.scripts, [])
        self.assertIn("not a live status check", html)
        self.assertIn("do not join a linked region directly", html)
        self.assertIn("wake-and-join", html)

if __name__ == "__main__":
    unittest.main()
