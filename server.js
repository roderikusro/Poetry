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
    const invidiousInstances = [
      'https://yt.chocolatemoo53.com',
      'https://inv.thepixora.com',
      'https://invidious.nerdvpn.de',
      'https://invidious.f5.si'
    ];
    
    let data = null;
    let success = false;
    
    for (const instance of invidiousInstances) {
      try {
        const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(searchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json)) {
            data = json;
            success = true;
            break;
          }
        }
      } catch (e) {
        // Try next
      }
    }
    
    if (success && data && Array.isArray(data)) {
      const songs = data.map((item) => ({
        title: item.title || 'Unknown Title',
        artist: item.author || 'Unknown Artist',
        icon: '🎵',
        youtubeUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
        thumbnail: `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
        duration: item.lengthSeconds || 0
      }));
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
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Roderikus Poetry - Server Notice</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #080A15; color: #e2e8f0; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; text-align: center; }
            .card { background: rgba(18, 22, 42, 0.8); padding: 2rem 3rem; border-radius: 1.5rem; border: 1px solid rgba(243, 229, 171, 0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            h1 { color: #f3e5ab; margin-bottom: 0.5rem; }
            p { color: #94a3b8; }
            code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 0.25rem; color: #c4b5fd; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Roderikus Poetry</h1>
            <p>Berkas produksi (<code>dist/index.html</code>) belum siap atau sedang diperbarui.</p>
            <p>Jalankan <code>npm run build</code> atau gunakan Vite Dev Server (<code>npm run dev</code>).</p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
