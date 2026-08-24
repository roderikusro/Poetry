import { Song } from '../types';

export interface TimedLyric {
  time: number;
  text: string;
}

// Parses LRC lyrics format into timed lyric objects
export function parseLrc(lrcText: string): TimedLyric[] {
  if (!lrcText) return [];
  
  const lines = lrcText.split('\n');
  const result: TimedLyric[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msStr = match[3].padEnd(3, '0').substring(0, 3);
      const milliseconds = parseInt(msStr, 10);
      
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      // Filter out headers/empty lines
      if (text && !text.startsWith('[') && !text.endsWith(']')) {
        result.push({ time: totalSeconds, text });
      }
    }
  }
  
  return result.sort((a, b) => a.time - b.time);
}

// Finds the active lyric line index based on current time (in seconds)
export function getActiveLyricIndex(lyrics: TimedLyric[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }
  
  return activeIndex;
}

// Maps raw Piped search items to Song objects
export function formatYouTubeSearch(items: any[]): Song[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => {
    let youtubeUrl = '';
    if (item.url) {
      if (item.url.startsWith('http')) {
        youtubeUrl = item.url;
      } else {
        // Handle relative URLs from Piped API (e.g. /watch?v=...)
        const cleanPath = item.url.startsWith('/') ? item.url : `/${item.url}`;
        youtubeUrl = `https://www.youtube.com${cleanPath}`;
      }
    }
    
    return {
      title: item.title || 'Unknown Title',
      artist: item.uploaderName || 'Unknown Artist',
      icon: '🎵',
      youtubeUrl: youtubeUrl,
      thumbnail: item.thumbnail || '',
      duration: item.duration || 0
    };
  });
}

// Formats seconds into MM:SS format
export function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds)) return "00:00";
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

