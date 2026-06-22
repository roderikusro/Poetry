import { Song } from '../types';

export interface TimedLyric {
  time: number;
  text: string;
}

// Parses LRC lyrics format into timed lyric objects
export function parseLrc(lrcText: string): TimedLyric[] {
  // STUB: Returns empty array, causing tests to fail
  return [];
}

// Finds the active lyric line index based on current time (in seconds)
export function getActiveLyricIndex(lyrics: TimedLyric[], currentTime: number): number {
  // STUB: Returns -1, causing tests to fail
  return -1;
}

// Maps raw Piped search items to Song objects
export function formatYouTubeSearch(items: any[]): Song[] {
  // STUB: Returns empty array, causing tests to fail
  return [];
}
