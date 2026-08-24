import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseLrc, getActiveLyricIndex, formatYouTubeSearch, formatTime } from '../data/musicUtils';

describe('Music Player Utilities', () => {
  describe('parseLrc', () => {
    test('should parse standard timed LRC lyrics correctly', () => {
      const lrc = `[00:12.30]Hello world\n[00:15.50]This is a song\n[01:02.00]End of lyrics`;
      const parsed = parseLrc(lrc);
      
      assert.strictEqual(parsed.length, 3);
      assert.strictEqual(parsed[0].time, 12.3);
      assert.strictEqual(parsed[0].text, 'Hello world');
      assert.strictEqual(parsed[1].time, 15.5);
      assert.strictEqual(parsed[1].text, 'This is a song');
      assert.strictEqual(parsed[2].time, 62.0);
      assert.strictEqual(parsed[2].text, 'End of lyrics');
    });

    test('should handle invalid lines and headers gracefully', () => {
      const lrc = `[ti:Test Title]\n[ar:Test Artist]\n[00:10.00]Valid line\nInvalid formatting line\n[00:20.50]  Spaced line  `;
      const parsed = parseLrc(lrc);
      
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].time, 10.0);
      assert.strictEqual(parsed[0].text, 'Valid line');
      assert.strictEqual(parsed[1].time, 20.5);
      assert.strictEqual(parsed[1].text, 'Spaced line');
    });
  });

  describe('getActiveLyricIndex', () => {
    const lyrics = [
      { time: 10, text: 'First line' },
      { time: 20, text: 'Second line' },
      { time: 30, text: 'Third line' }
    ];

    test('should return -1 when current time is before first line', () => {
      assert.strictEqual(getActiveLyricIndex(lyrics, 5), -1);
    });

    test('should return correct index when current time is exactly on a line', () => {
      assert.strictEqual(getActiveLyricIndex(lyrics, 10), 0);
      assert.strictEqual(getActiveLyricIndex(lyrics, 20), 1);
    });

    test('should return correct index when current time is between lines', () => {
      assert.strictEqual(getActiveLyricIndex(lyrics, 15), 0);
      assert.strictEqual(getActiveLyricIndex(lyrics, 25), 1);
    });

    test('should return last line index when current time is past the end', () => {
      assert.strictEqual(getActiveLyricIndex(lyrics, 35), 2);
      assert.strictEqual(getActiveLyricIndex(lyrics, 100), 2);
    });
  });

  describe('formatYouTubeSearch', () => {
    test('should map Piped API search response format to Song interface', () => {
      const rawPipedItems = [
        {
          title: 'Perfect',
          uploaderName: 'Ed Sheeran',
          url: '/watch?v=2Vv-BfVoq4g',
          thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/0.jpg',
          duration: 263
        },
        {
          title: 'Shape of You',
          uploaderName: 'Ed Sheeran',
          url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
          thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/0.jpg',
          duration: 233
        }
      ];

      const songs = formatYouTubeSearch(rawPipedItems);
      
      assert.strictEqual(songs.length, 2);
      
      assert.strictEqual(songs[0].title, 'Perfect');
      assert.strictEqual(songs[0].artist, 'Ed Sheeran');
      assert.strictEqual(songs[0].youtubeUrl, 'https://www.youtube.com/watch?v=2Vv-BfVoq4g');
      assert.strictEqual(songs[0].icon, '🎵');
      assert.strictEqual(songs[0].thumbnail, 'https://img.youtube.com/vi/2Vv-BfVoq4g/0.jpg');
      assert.strictEqual(songs[0].duration, 263);

      assert.strictEqual(songs[1].title, 'Shape of You');
      assert.strictEqual(songs[1].artist, 'Ed Sheeran');
      assert.strictEqual(songs[1].youtubeUrl, 'https://www.youtube.com/watch?v=JGwWNGJdvx8');
      assert.strictEqual(songs[1].thumbnail, 'https://img.youtube.com/vi/JGwWNGJdvx8/0.jpg');
      assert.strictEqual(songs[1].duration, 233);
    });
  });

  describe('formatTime', () => {
    test('should format regular seconds to MM:SS', () => {
      assert.strictEqual(formatTime(0), '00:00');
      assert.strictEqual(formatTime(5), '00:05');
      assert.strictEqual(formatTime(65), '01:05');
      assert.strictEqual(formatTime(3599), '59:59');
    });

    test('should handle NaN gracefully', () => {
      assert.strictEqual(formatTime(NaN), '00:00');
    });
  });
});

