import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function searchProxyPlugin(): Plugin {
  return {
    name: 'search-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        
        const parsedUrl = new URL(req.url, 'http://localhost');
        if (parsedUrl.pathname === '/api/search') {
          const query = parsedUrl.searchParams.get('q') || '';
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          
          try {
            const invidiousInstances = [
              'https://yt.chocolatemoo53.com',
              'https://inv.thepixora.com',
              'https://invidious.nerdvpn.de',
              'https://invidious.f5.si'
            ];
            
            let data: any = null;
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
              const songs = data.map((item: any) => ({
                title: item.title || 'Unknown Title',
                artist: item.author || 'Unknown Artist',
                icon: '🎵',
                youtubeUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                thumbnail: `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
                duration: item.lengthSeconds || 0
              }));
              res.end(JSON.stringify(songs));
            } else {
              res.end(JSON.stringify([]));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Failed to search YouTube Music' }));
          }
          return;
        }
        
        if (parsedUrl.pathname === '/api/lyrics') {
          const track = parsedUrl.searchParams.get('track') || '';
          const artist = parsedUrl.searchParams.get('artist') || '';
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          
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
                const match = data.find((item: any) => item.syncedLyrics) || data[0];
                res.end(JSON.stringify(match));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Lyrics not found' }));
              }
            } else {
              res.statusCode = response.status;
              res.end(JSON.stringify({ error: 'Failed to fetch from LRCLIB' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Failed to fetch lyrics' }));
          }
          return;
        }
        
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), searchProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
