import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q || '';
  
  try {
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.us.to',
      'https://piped-api.lunar.icu',
      'https://api.piped.yt'
    ];
    
    let data = null;
    let success = false;
    
    for (const instance of pipedInstances) {
      try {
        const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
        const response = await fetch(searchUrl);
        if (response.ok) {
          data = await response.json();
          if (data && Array.isArray(data.items)) {
            success = true;
            break;
          }
        }
      } catch (e) {
        // Try next
      }
    }
    
    if (!success || !data || !data.items || data.items.length === 0) {
      for (const instance of pipedInstances) {
        try {
          const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
          const response = await fetch(searchUrl);
          if (response.ok) {
            data = await response.json();
            if (data && Array.isArray(data.items)) {
              success = true;
              break;
            }
          }
        } catch (e) {
          // Try next
        }
      }
    }
    
    if (success && data && Array.isArray(data.items)) {
      const songs = data.items.map((item) => {
        let youtubeUrl = '';
        if (item.url) {
          if (item.url.startsWith('http')) {
            youtubeUrl = item.url;
          } else {
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
      res.json(songs);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to search YouTube Music' });
  }
});

// Lyrics endpoint
app.get('/api/lyrics', async (req, res) => {
  const track = req.query.track || '';
  const artist = req.query.artist || '';
  
  try {
    const query = `${track} ${artist}`.trim();
    const lrclibUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(lrclibUrl, {
      headers: {
        'User-Agent': 'AntigravityMusicPlayer/1.0.0 (https://github.com/MetrolistGroup/Metrolist)'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const match = data.find((item) => item.syncedLyrics) || data[0];
        res.json(match);
      } else {
        res.status(404).json({ error: 'Lyrics not found' });
      }
    } else {
      res.status(response.status).json({ error: 'Failed to fetch from LRCLIB' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch lyrics' });
  }
});

// Serve static assets from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
