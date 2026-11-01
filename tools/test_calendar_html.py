"""Negative controls for manual downloads and inactive Discord placeholders."""
import unittest
from check_calendar import CalendarParser


class CalendarDownloadContracts(unittest.TestCase):
    def test_manual_download_is_still_checked(self):
        parser = CalendarParser()
        parser.feed('<a href="/public/calendar/civ13.ics" download="civ13.ics">Calendar</a>')
        self.assertEqual(parser.downloads, ['/public/calendar/civ13.ics'])
        self.assertEqual(parser.sync_downloads, 0)

    def test_only_hidden_unbound_discord_placeholder_is_separate(self):
        parser = CalendarParser()
        parser.feed('<a data-sync-download hidden download="civ13-discord.ics">Calendar</a>')
        self.assertEqual(parser.downloads, [])
        self.assertEqual(parser.sync_downloads, 1)

    def test_bound_visible_or_renamed_placeholders_fail(self):
        for attributes in (
            'hidden href="/wrong.ics" download="civ13-discord.ics"',
            'download="civ13-discord.ics"',
            'hidden download="other.ics"',
        ):
            with self.subTest(attributes=attributes), self.assertRaises(AssertionError):
                CalendarParser().feed('<a data-sync-download ' + attributes + '>Calendar</a>')


if __name__ == '__main__':
    unittest.main()
