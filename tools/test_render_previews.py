"""Checks which built page each changed source file maps to."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_previews import map_source  # noqa: E402


class MapSourceTest(unittest.TestCase):
    def test_jekyll(self):
        self.assertEqual(map_source('game-modes.md', 'jekyll'), 'game-modes/index.html')  # permalink
        self.assertEqual(map_source('civ14.md', 'jekyll'), 'civ14.html')
        self.assertEqual(map_source('news/civilization.md', 'jekyll'), 'news/civilization.html')
        self.assertEqual(map_source('_layouts/default.html', 'jekyll'), '')
        self.assertEqual(map_source('public/css/civ13.css', 'jekyll'), '')
        self.assertIsNone(map_source('tools/check_preview.py', 'jekyll'))
        self.assertIsNone(map_source('README.md', 'jekyll'))

    def test_mdbook(self):
        self.assertEqual(map_source('src/guides/Guide_to_Boats.md', 'mdbook'), 'guides/Guide_to_Boats.html')
        self.assertEqual(map_source('src/SUMMARY.md', 'mdbook'), '')
        self.assertEqual(map_source('theme/compiled/ss14.css', 'mdbook'), '')
        self.assertIsNone(map_source('src/images/maps/x.png', 'mdbook'))
        self.assertIsNone(map_source('scripts/build.py', 'mdbook'))


if __name__ == '__main__':
    unittest.main()
