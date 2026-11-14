import { Request, Response, NextFunction } from 'express';
import { Product, CompletedSale, PaymentMethod, CartItem } from '../types';

const ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const STORE_ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;
const VALID_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'mobile', 'bank_transfer'];

/**
 * Sets hardened HTTP security headers compatible with AI Studio iframes,
 * camera barcode scanning, and Firebase Google signInWithPopup.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight bounded in-memory rate limiter per client IP + route group.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  name: string;
}) {
  const buckets = new Map<string, RateBucket>();
  const MAX_BUCKETS = 5000;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    const key = `${options.name}:${ip}`;

    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      if (buckets.size >= MAX_BUCKETS) {
        // Evict oldest/expired entries safely
        for (const [k, b] of buckets.entries()) {
          if (now > b.resetAt) buckets.delete(k);
          if (buckets.size < MAX_BUCKETS * 0.8) break;
        }
      }
      bucket = { count: 1, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

export function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

export function sanitizeImageUrl(val: unknown): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  // Allow relative local assets, https URLs, or small safe data:image/* base64 strings
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed.slice(0, 512);
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(trimmed)) {
    // Cap inline image payload at 500KB to prevent DoS
    return trimmed.length <= 512000 ? trimmed : '';
  }
  return '';
}

export function sanitizeStoreId(raw: unknown): string {
  const cleaned = sanitizeString(raw, 64);
  if (cleaned && STORE_ID_REGEX.test(cleaned)) {
    return cleaned;
  }
  return 'default-shop';
}

export function isValidEntityId(id: unknown): id is string {
  return typeof id === 'string' && ID_REGEX.test(id);
}

export function validateProductPayload(
  body: any
): { valid: true; product: Product } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid JSON payload for product.' };
  }

  const id = sanitizeString(body.id, 128);
  if (!isValidEntityId(id)) {
    return { valid: false, error: 'Product id must be 1-128 alphanumeric, dash, or underscore characters.' };
  }

  const name = sanitizeString(body.name, 256);
  if (!name) {
    return { valid: false, error: 'Product name is required.' };
  }

  const sku = sanitizeString(body.sku, 64) || id;
  const category = sanitizeString(body.category, 64) || 'အထွေထွေ (General)';
  const price = Number(body.price);
  const stock = Number(body.stock ?? 0);

  if (!Number.isFinite(price) || price < 0 || price > 1_000_000_000) {
    return { valid: false, error: 'Product price must be a non-negative finite number.' };
  }
  if (!Number.isFinite(stock) || stock < 0 || stock > 10_000_000) {
    return { valid: false, error: 'Product stock must be a non-negative finite number.' };
  }

  return {
    valid: true,
    product: {
      id,
      sku,
      name,
      category,
      price: Math.round(price),
      stock: Math.round(stock),
      barcode: sanitizeString(body.barcode, 128),
      badge: sanitizeString(body.badge, 64),
      purity: sanitizeString(body.purity, 32),
      description: sanitizeString(body.description, 1000),
      image: sanitizeImageUrl(body.image),
    },
  };
}

export function validateSalePayload(
  body: any
): { valid: true; sale: CompletedSale } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid JSON payload for sale.' };
  }

  const id = sanitizeString(body.id || body.saleId, 128);
  if (!isValidEntityId(id)) {
    return { valid: false, error: 'Sale id must be 1-128 alphanumeric, dash, or underscore characters.' };
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 200) {
    return { valid: false, error: 'Sale must contain between 1 and 200 items.' };
  }

  const sanitizedItems: CartItem[] = [];
  let computedSubtotal = 0;

  for (const rawItem of body.items) {
    if (!rawItem || typeof rawItem !== 'object' || !rawItem.product) {
      return { valid: false, error: 'Each sale item must reference a product object.' };
    }
    const qty = Number(rawItem.quantity);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 10000) {
      return { valid: false, error: 'Item quantity must be between 1 and 10000.' };
    }
    const pPrice = Number(rawItem.product.price ?? 0);
    if (!Number.isFinite(pPrice) || pPrice < 0) {
      return { valid: false, error: 'Item product price must be non-negative.' };
    }
    const prodId = sanitizeString(rawItem.product.id, 128);
    if (!isValidEntityId(prodId)) {
      return { valid: false, error: 'Item product id is invalid.' };
    }

    const cleanProd: Product = {
      id: prodId,
      sku: sanitizeString(rawItem.product.sku, 64) || prodId,
      name: sanitizeString(rawItem.product.name, 256) || 'Item',
      category: sanitizeString(rawItem.product.category, 64) || 'General',
      price: Math.round(pPrice),
      stock: Math.max(0, Math.round(Number(rawItem.product.stock ?? 0))),
      barcode: sanitizeString(rawItem.product.barcode, 128),
      description: sanitizeString(rawItem.product.description, 256),
    };

    const roundQty = Math.round(qty);
    computedSubtotal += cleanProd.price * roundQty;
    sanitizedItems.push({
      product: cleanProd,
      quantity: roundQty,
      ...(typeof rawItem.customDiscountPercent === 'number'
        ? { customDiscountPercent: Math.max(0, Math.min(100, rawItem.customDiscountPercent)) }
        : {}),
    });
  }

  const total = Number(body.total ?? computedSubtotal);
  const subtotal = Number(body.subtotal ?? computedSubtotal);
  const discountAmount = Number(body.discountAmount ?? 0);
  const taxAmount = Number(body.taxAmount ?? 0);

  if (
    !Number.isFinite(total) || total < 0 ||
    !Number.isFinite(subtotal) || subtotal < 0 ||
    !Number.isFinite(discountAmount) || discountAmount < 0 ||
    !Number.isFinite(taxAmount) || taxAmount < 0
  ) {
    return { valid: false, error: 'Sale totals cannot be negative or invalid.' };
  }

  const rawMethod = sanitizeString(body.paymentMethod, 32) as PaymentMethod;
  const paymentMethod: PaymentMethod = VALID_PAYMENT_METHODS.includes(rawMethod)
    ? rawMethod
    : 'cash';

  return {
    valid: true,
    sale: {
      id,
      timestamp: sanitizeString(body.timestamp, 64) || new Date().toISOString(),
      items: sanitizedItems,
      subtotal: Math.round(subtotal),
      discountAmount: Math.round(discountAmount),
      taxAmount: Math.round(taxAmount),
      total: Math.round(total),
      paymentMethod,
      cashierName: sanitizeString(body.cashierName, 128) || 'Cashier Staff',
      registerId: sanitizeString(body.registerId, 64) || 'REG-01',
      loyaltyMember: body.loyaltyMember || null,
    },
  };
}
