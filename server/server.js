import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { seedInitialData } from './data/seeder.js';
import authRoutes from './routes/authRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Reverse-Proxy Trust Configuration:
// To prevent IP spoofing and DoS via rate-limiter exhaustion or bypass, reverse-proxy trust
// must be explicitly and safely configured. Express trust proxy supports integer hop counts (1-3)
// or disabled (false). Arbitrary strings, boolean "true", negative numbers, or large hop counts
// are strictly rejected to ensure req.ip cannot be influenced by client-supplied forwarding headers.
export const parseTrustProxy = (rawTrustProxy, nodeEnv = process.env.NODE_ENV) => {
  if (rawTrustProxy === undefined || rawTrustProxy === null || String(rawTrustProxy).trim() === '') {
    if (nodeEnv === 'production') {
      console.warn(
        '⚠️ [PROXY CONFIG] TRUST_PROXY is not set in production. Reverse-proxy trust is disabled (false).\n' +
        '   For production deployments behind a reverse proxy (e.g. Render, Cloudflare), set TRUST_PROXY to the\n' +
        '   exact verified upstream hop count (e.g. TRUST_PROXY=1) after deployment verification.'
      );
    }
    return false;
  }

  const strVal = String(rawTrustProxy).trim().toLowerCase();

  // Explicitly disabled
  if (strVal === 'false' || strVal === '0') {
    return false;
  }

  // Explicitly reject "true" - unsafe because Express trusts all hops (allows client header spoofing)
  if (strVal === 'true') {
    console.error(
      '⚠️ [PROXY CONFIG] TRUST_PROXY="true" is rejected for security reasons: trusting all upstream hops allows\n' +
      '   client-controlled X-Forwarded-For header spoofing. Proxy trust remains disabled (false).\n' +
      '   Specify an exact hop count (e.g., TRUST_PROXY=1) instead.'
    );
    return false;
  }

  // Check for safe, bounded integer hop count (1 to 3 hops)
  const numVal = Number(strVal);
  if (Number.isInteger(numVal) && numVal >= 1 && numVal <= 3) {
    return numVal;
  }

  // Any other value is invalid / unsafe
  console.error(
    `⚠️ [PROXY CONFIG] Invalid TRUST_PROXY value "${rawTrustProxy}". Expected an integer between 1 and 3, or 0/false.\n` +
    '   Proxy trust remains disabled (false) to prevent untrusted header spoofing.'
  );
  return false;
};

const trustProxyConfig = parseTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV);
if (trustProxyConfig !== false) {
  app.set('trust proxy', trustProxyConfig);
} else {
  app.set('trust proxy', false);
}

// Security & Utility Middlewares:
// SEC-010: Enable Cross-Origin-Resource-Policy 'cross-origin' so authorized cross-origin
// frontends can consume API resources. Keep COOP disabled (false) because Google Identity
// Services (GSI) popup authentication requires window.opener cross-frame communication.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

// Cross-Origin Resource Sharing (CORS) Configuration:
// Replaces permissive wildcard suffix matching (*.onrender.com, *.vercel.app) with an explicit allowlist
// of verified origins to prevent cross-origin authorization tampering and CSRF risks.
// - Local development origins (localhost:5173, 127.0.0.1:5173, etc.) are always allowed.
// - Production origin must be explicitly defined via CLIENT_URL environment variable.
// - Non-browser requests without an Origin header (e.g. curl, health checks) are permitted.
// - Unapproved origins are rejected without returning permissive CORS headers (callback(null, false)).
export const getVerifiedOrigins = (env = process.env) => {
  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const configuredOrigins = (env.CLIENT_URL || '')
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return Array.from(new Set([...localOrigins, ...configuredOrigins]));
};

export const createCorsOptions = (env = process.env) => {
  const allowedOrigins = getVerifiedOrigins(env);

  if (env.NODE_ENV === 'production' && !env.CLIENT_URL) {
    console.warn(
      '⚠️ [CORS CONFIG] CLIENT_URL environment variable is not defined in production.\n' +
      '   Cross-origin requests from the production frontend will be blocked until CLIENT_URL is configured.'
    );
  }

  return {
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g., server-to-server health checks, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Explicitly reject unapproved origins without returning permissive CORS headers
      return callback(null, false);
    },
    credentials: true,
  };
};

app.use(cors(createCorsOptions(process.env)));
// SEC-006: Enforce 1MB payload limits to protect against memory exhaustion DoS attacks
app.use(express.json({ limit: '1mb' }));
// SEC-009-A: Sanitize Morgan logging by stripping query parameters from logged URLs.
// Prevents stream tickets or sensitive parameters from leaking into application stdout/logs.
morgan.token('clean-url', (req) => {
  const url = req.originalUrl || req.url;
  return typeof url === 'string' ? url.split('?')[0] : url;
});
app.use(morgan(':method :clean-url :status :response-time ms - :res[content-length]'));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    message: '💈 The Classic Cut Salon API Server is Live & Running!',
    status: 'online',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'The Classic Cut Salon API',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware:
// SEC-006: Sanitize Mongoose CastError and body parser overflow to prevent internal schema leaks
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier format provided.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request payload exceeds permitted 1MB size limit.' });
  }
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: JWT_SECRET environment variable is missing in production. Halting server.');
      process.exit(1);
    } else {
      console.warn('⚠️ WARNING: JWT_SECRET is not defined in environment variables. Please configure JWT_SECRET in server/.env.');
    }
  }

  await connectDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`\n💈 The Classic Cut Salon Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
