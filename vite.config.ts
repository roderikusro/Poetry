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
            const pipedInstances = [
              'https://pipedapi.kavin.rocks',
              'https://pipedapi.us.to',
              'https://piped-api.lunar.icu',
              'https://api.piped.yt'
            ];
            
            let data: any = null;
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
              const songs = data.items.map((item: any) => {
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
