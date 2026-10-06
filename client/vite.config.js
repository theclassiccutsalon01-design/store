import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import http from 'http';

function serveCustomAssetFolders() {
  return {
    name: 'serve-custom-asset-folders',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url.split('?')[0];
        const decodedUrl = decodeURIComponent(rawUrl);
        const prefixes = ['/3d-model', '/models', '/3d model', '/video', '/hair-cut', '/backgrounds', '/extra', '/figures', '/logo', '/music'];
        for (const prefix of prefixes) {
          if (decodedUrl.startsWith(prefix)) {
            const relPath = decodedUrl.replace(prefix, '');
            const folder = prefix.slice(1);
            // Check public/folder first, then root folder
            let filePath = path.join(__dirname, 'public', folder, relPath);
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              filePath = path.join(__dirname, folder, relPath);
            }
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap = {
                '.glb': 'model/gltf-binary',
                '.gltf': 'model/gltf+json',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.mp3': 'audio/mpeg',
              };
              res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
        }
        next();
      });
    },
  };
}

function apiFallbackPlugin() {
  const fallbackConfig = {
    salonName: 'The Classic Cut Salon',
    tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
    aboutStory:
      'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
    phone: '+91 93221 88848',
    whatsapp: '+919322188848',
    email: 'sraut7285@gmail.com',
    address: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
    mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
    mapEmbedUrl: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
    openingHours: {
      weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
      weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
      monday: 'CLOSED (Shop is closed on every Monday)',
    },
    heroVideoUrl: '/video/backgroundvideo.mp4',
    defaultOfferTitle: 'Luxury Grooming Offer Coupon',
    defaultOfferDiscount: '30% to 40% OFF',
  };

  return {
    name: 'api-fallback-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = (req.url || '').split('?')[0];
        if (!rawUrl.startsWith('/api')) {
          return next();
        }

        // Forward to backend on 127.0.0.1:5000 with graceful offline fallback
        const headers = { ...req.headers, host: '127.0.0.1:5000' };
        const proxyReq = http.request(
          {
            hostname: '127.0.0.1',
            port: 5000,
            path: req.url,
            method: req.method,
            headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', () => {
          if (res.headersSent) return;
          if (rawUrl.includes('/cms/config')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fallbackConfig));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'offline',
              message: 'Backend server is not running, using client defaults',
            })
          );
        });

        req.pipe(proxyReq);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveCustomAssetFolders(), apiFallbackPlugin()],
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-motion': ['gsap', 'lenis'],
          'vendor-three': ['three'],
        },
      },
    },
  },
});
