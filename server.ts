import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  securityHeaders,
  createRateLimiter,
  sanitizeStoreId,
  isValidEntityId,
  validateProductPayload,
  validateSalePayload,
} from './src/middleware/security.ts';
import { getDatabaseHealth } from './src/db/index.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  getSqlProducts,
  upsertSqlProduct,
  bulkUpsertSqlProducts,
  deleteSqlProduct,
} from './src/db/products.ts';
import { getSqlSales, recordSqlSale } from './src/db/sales.ts';
import { searchMarketData } from './src/server/geminiSearch.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Harden Express server headers & proxy handling
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(express.json({ limit: '5mb' }));

  const apiRateLimiter = createRateLimiter({
    name: 'api-general',
    windowMs: 60_000,
    maxRequests: 240,
  });

  const aiRateLimiter = createRateLimiter({
    name: 'ai-search',
    windowMs: 60_000,
    maxRequests: 25,
  });

  app.use('/api', apiRateLimiter);

  // ------------------ API Routes ------------------

  // 0. Multi-Cloud & Multi-Base Health Diagnostics (Zero secrets exposed)
  app.get('/api/health', async (_req, res) => {
    const sqlHealth = await getDatabaseHealth();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: {
        sql: sqlHealth,
        firestore: {
          configured: Boolean(firebaseConfig?.projectId && firebaseConfig?.firestoreDatabaseId),
          projectId: firebaseConfig?.projectId || null,
          databaseId: firebaseConfig?.firestoreDatabaseId || null,
        },
        ai: {
          configured: Boolean(process.env.GEMINI_API_KEY),
        },
      },
    });
  });

  // 1. Firebase Auth Sync to PostgreSQL / Multi-Base Users table
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }
      const storeId = sanitizeStoreId(req.body?.storeId);
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || '',
        (req.body && req.body.displayName) || req.user.name || undefined,
        storeId
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: 'Failed to sync user profile' });
    }
  });

  // 2. Multi-Base Products API (Scoped by storeId)
  app.get('/api/products', async (req, res) => {
    try {
      const storeId = sanitizeStoreId(req.query.storeId);
      const prods = await getSqlProducts(storeId);
      res.json(prods);
    } catch (error: any) {
      console.error('Error fetching SQL products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const storeId = sanitizeStoreId(req.body?.storeId || req.query.storeId);
      const check = validateProductPayload(req.body);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      const saved = await upsertSqlProduct(check.product, storeId, req.user?.uid || '');
      res.json({ success: true, product: saved });
    } catch (error: any) {
      console.error('Error saving SQL product:', error);
      res.status(500).json({ error: 'Failed to save product' });
    }
  });

  app.post('/api/products/bulk', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const storeId = sanitizeStoreId(req.body?.storeId || req.query.storeId);
      const list = Array.isArray(req.body?.products) ? req.body.products : [];
      if (list.length === 0 || list.length > 500) {
        return res.status(400).json({ error: 'Products array must contain 1-500 items.' });
      }
      const validProducts = [];
      for (const item of list) {
        const check = validateProductPayload(item);
        if (!check.valid) {
          return res.status(400).json({ error: check.error });
        }
        validProducts.push(check.product);
      }
      const saved = await bulkUpsertSqlProducts(validProducts, storeId, req.user?.uid || '');
      res.json({ success: true, count: saved.length, products: saved });
    } catch (error: any) {
      console.error('Error bulk saving SQL products:', error);
      res.status(500).json({ error: 'Failed to bulk save products' });
    }
  });

  app.delete('/api/products/:id', optionalAuth, async (req, res) => {
    try {
      if (!isValidEntityId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid product ID format.' });
      }
      const storeId = sanitizeStoreId(req.query.storeId);
      await deleteSqlProduct(req.params.id, storeId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting SQL product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // 3. Multi-Base Sales Ledger API (Scoped by storeId)
  app.get('/api/sales', async (req, res) => {
    try {
      const storeId = sanitizeStoreId(req.query.storeId);
      const salesList = await getSqlSales(storeId);
      res.json(salesList);
    } catch (error: any) {
      console.error('Error fetching SQL sales:', error);
      res.status(500).json({ error: 'Failed to fetch sales' });
    }
  });

  app.post('/api/sales', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const storeId = sanitizeStoreId(req.body?.storeId || req.query.storeId);
      const check = validateSalePayload(req.body);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      const recorded = await recordSqlSale(check.sale, storeId, req.user?.uid || '');
      res.json({ success: true, sale: recorded });
    } catch (error: any) {
      console.error('Error recording SQL sale:', error);
      res.status(500).json({ error: 'Failed to record sale' });
    }
  });

  // 4. Gemini 3.8 Flash Search Grounding (Live Market Prices & Product Research)
  app.post('/api/ai/market-search', aiRateLimiter, async (req, res) => {
    try {
      const { query } = req.body || {};
      const q =
        typeof query === 'string' && query.trim()
          ? query.trim().slice(0, 120)
          : 'မြန်မာပါတိတ်';
      const searchResult = await searchMarketData(q);
      res.json(searchResult);
    } catch (error: any) {
      console.warn('Handling market search error with fallback:', error?.message);
      res.json({
        query: req.body?.query || 'အထွေထွေ',
        answer:
          'လက်ရှိ စျေးကွက်ပေါက်စျေးနှုန်းများ: ပုံမှန် မြန်မာပါတိတ်နှင့် လူသုံးကုန်များမှာ ၂၅,၀၀၀ မှ ၄၅,၀၀၀ ကျပ် ဝန်းကျင်ဖြစ်ပါသည်။',
        sources: [],
        suggestedPrice: 25000,
        isFallback: true,
        quotaExceeded: true,
      });
    }
  });

  // ------------------ Vite Middleware / Static ------------------
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
