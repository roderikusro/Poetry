export interface Tag {
  label: string;
  icon: string;
  type: string; // 'love' | 'nature' | 'dream' | 'hope'
}

export interface Poem {
  id: number;
  title: string;
  author: string;
  emoji: string;
  date: string;
  tags: Tag[];
  excerpt: string;
  stanzas: string[];
  stanzaImages?: string[];
  lyrics?: string[];
  timestamps?: number[];
  songTitle?: string;
  songArtist?: string;
  youtubeUrl?: string;
  isPrivate?: boolean;
  password?: string;
}

export interface Song {
  title: string;
  artist: string;
  icon: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration?: number;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
}

export interface Compliment {
  id: string;
  text: string;
}
