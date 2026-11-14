import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Product, CompletedSale } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockData';

export interface DeviceInfo {
  deviceId: string;
  storeId?: string;
  deviceName: string;
  registerId: string;
  cashierName: string;
  platform: string;
  lastActive: string;
  isCurrentDevice?: boolean;
}

export interface MultiCloudHealth {
  status: string;
  timestamp: string;
  databases: {
    sql: {
      driver: 'cloud-sql' | 'postgres-url' | 'local-json';
      connected: boolean;
      latencyMs?: number;
    };
    firestore: {
      configured: boolean;
      projectId: string | null;
      databaseId: string | null;
    };
    ai: {
      configured: boolean;
    };
  };
}

export interface StoreBackupPayload {
  schemaVersion: string;
  exportedAt: string;
  storeId: string;
  products: Product[];
  sales: CompletedSale[];
}

const STORAGE_DEVICE_KEY = 'kks_cashier_device_id';
const STORAGE_STORE_ID_KEY = 'kks_store_id';
const STORAGE_STORE_PRIVATE_KEY = 'kks_store_private';

function productsStorageKey(storeId: string) {
  return `kks_offline_products_${storeId}`;
}
function salesStorageKey(storeId: string) {
  return `kks_offline_sales_${storeId}`;
}
function pendingSalesStorageKey(storeId: string) {
  return `kks_pending_sales_${storeId}`;
}

export function normalizeStoreId(raw: string): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return cleaned.length >= 3 ? cleaned : 'SHOP-DEFAULT';
}

// ----------------- Store Workspace & Device Identification -----------------
export function getOrCreateStoreId(): string {
  let storeId = localStorage.getItem(STORAGE_STORE_ID_KEY);
  if (!storeId || storeId.trim().length < 3) {
    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    storeId = `SHOP-${suffix}`;
    localStorage.setItem(STORAGE_STORE_ID_KEY, storeId);
  }
  return normalizeStoreId(storeId);
}

export function setActiveStoreId(newStoreId: string): string {
  const normalized = normalizeStoreId(newStoreId);
  localStorage.setItem(STORAGE_STORE_ID_KEY, normalized);
  return normalized;
}

export function getStorePrivateFlag(storeId: string): boolean {
  return localStorage.getItem(`${STORAGE_STORE_PRIVATE_KEY}_${storeId}`) === 'true';
}

export function setStorePrivateFlag(storeId: string, isPrivate: boolean): void {
  localStorage.setItem(`${STORAGE_STORE_PRIVATE_KEY}_${storeId}`, isPrivate ? 'true' : 'false');
}

export function getOrCreateDeviceId(): string {
  let devId = localStorage.getItem(STORAGE_DEVICE_KEY);
  if (!devId) {
    devId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem(STORAGE_DEVICE_KEY, devId);
  }
  return devId;
}

// Sanitize strings to comply with firebase-blueprint.json & SQL constraints
function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function sanitizeIdStr(val: unknown, fallbackPrefix = 'id'): string {
  const raw = typeof val === 'string' ? val.trim() : '';
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

function normalizeProductForCloud(
  product: Product,
  storeId: string,
  ownerUid = ''
) {
  return {
    id: sanitizeIdStr(product.id, 'prod'),
    storeId: normalizeStoreId(storeId),
    ownerUid: cleanStr(ownerUid, 128),
    sku: cleanStr(product.sku || product.id, 64) || 'SKU-01',
    name: cleanStr(product.name, 256) || 'Unnamed Item',
    category: cleanStr(product.category, 64) || 'General',
    price: Math.max(0, Math.round(Number(product.price) || 0)),
    stock: Math.max(0, Math.round(Number(product.stock) || 0)),
    barcode: cleanStr(product.barcode, 128),
    badge: cleanStr(product.badge, 64),
    purity: cleanStr(product.purity, 32),
    description: cleanStr(product.description, 1000),
    image: cleanStr(product.image, 512000),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSaleForCloud(
  sale: CompletedSale,
  storeId: string,
  ownerUid = '',
  syncedFromOffline = false
) {
  const safeItems = (Array.isArray(sale.items) ? sale.items : []).slice(0, 200).map((item) => ({
    quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
    ...(typeof item.customDiscountPercent === 'number'
      ? { customDiscountPercent: item.customDiscountPercent }
      : {}),
    product: {
      id: sanitizeIdStr(item.product?.id, 'item'),
      sku: cleanStr(item.product?.sku, 64) || 'SKU',
      name: cleanStr(item.product?.name, 256) || 'Item',
      category: cleanStr(item.product?.category, 64) || 'General',
      price: Math.max(0, Math.round(Number(item.product?.price) || 0)),
      stock: Math.max(0, Math.round(Number(item.product?.stock) || 0)),
      barcode: cleanStr(item.product?.barcode, 128),
      description: cleanStr(item.product?.description, 256),
    },
  }));

  return {
    id: sanitizeIdStr(sale.id, 'TXN'),
    storeId: normalizeStoreId(storeId),
    ownerUid: cleanStr(ownerUid, 128),
    timestamp: cleanStr(sale.timestamp, 64) || new Date().toISOString(),
    items: safeItems,
    subtotal: Math.max(0, Math.round(Number(sale.subtotal) || 0)),
    discountAmount: Math.max(0, Math.round(Number(sale.discountAmount) || 0)),
    taxAmount: Math.max(0, Math.round(Number(sale.taxAmount) || 0)),
    total: Math.max(0, Math.round(Number(sale.total) || 0)),
    paymentMethod: (['cash', 'card', 'mobile', 'bank_transfer'].includes(sale.paymentMethod)
      ? sale.paymentMethod
      : 'cash') as CompletedSale['paymentMethod'],
    cashierName: cleanStr(sale.cashierName, 128) || 'Cashier Staff',
    registerId: cleanStr(sale.registerId, 64) || 'REG-01',
    loyaltyMember: sale.loyaltyMember ? { ...sale.loyaltyMember } : null,
    syncedFromOffline,
    createdAt: new Date().toISOString(),
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Guest terminal without token
  }
  return headers;
}

// ----------------- Offline Local Cache Helpers -----------------
export function getLocalProducts(storeId = getOrCreateStoreId()): Product[] {
  try {
    const raw = localStorage.getItem(productsStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalProducts(products: Product[], storeId = getOrCreateStoreId()): void {
  try {
    localStorage.setItem(productsStorageKey(storeId), JSON.stringify(products));
  } catch {
    // quota exceeded or disabled
  }
}

export function getLocalSales(storeId = getOrCreateStoreId()): CompletedSale[] {
  try {
    const raw = localStorage.getItem(salesStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalSales(sales: CompletedSale[], storeId = getOrCreateStoreId()): void {
  try {
    localStorage.setItem(salesStorageKey(storeId), JSON.stringify(sales.slice(0, 100)));
  } catch {
    // fallback
  }
}

export function getPendingSales(storeId = getOrCreateStoreId()): CompletedSale[] {
  try {
    const raw = localStorage.getItem(pendingSalesStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function addPendingSale(sale: CompletedSale, storeId = getOrCreateStoreId()): void {
  try {
    const pending = getPendingSales(storeId);
    if (!pending.some((s) => s.id === sale.id)) {
      pending.push(sale);
      localStorage.setItem(pendingSalesStorageKey(storeId), JSON.stringify(pending));
      notifyNetworkListeners(storeId);
    }
  } catch {
    // fallback
  }
}

export function removePendingSale(saleId: string, storeId = getOrCreateStoreId()): void {
  try {
    const pending = getPendingSales(storeId).filter((s) => s.id !== saleId);
    localStorage.setItem(pendingSalesStorageKey(storeId), JSON.stringify(pending));
    notifyNetworkListeners(storeId);
  } catch {
    // fallback
  }
}

// ----------------- Network & Sync Status Management -----------------
type NetworkStatusCallback = (status: { isOnline: boolean; pendingCount: number }) => void;
const networkListeners = new Set<NetworkStatusCallback>();

let currentOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

function notifyNetworkListeners(storeId = getOrCreateStoreId()) {
  const pendingCount = getPendingSales(storeId).length;
  for (const cb of networkListeners) {
    cb({ isOnline: currentOnlineStatus, pendingCount });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentOnlineStatus = true;
    const storeId = getOrCreateStoreId();
    notifyNetworkListeners(storeId);
    flushPendingSales(storeId);
  });

  window.addEventListener('offline', () => {
    currentOnlineStatus = false;
    notifyNetworkListeners();
  });
}

export function subscribeToNetworkStatus(
  callback: NetworkStatusCallback,
  storeId = getOrCreateStoreId()
): () => void {
  networkListeners.add(callback);
  callback({ isOnline: currentOnlineStatus, pendingCount: getPendingSales(storeId).length });
  return () => {
    networkListeners.delete(callback);
  };
}

export function isDeviceOnline(): boolean {
  return currentOnlineStatus;
}

// ----------------- Multi-Cloud Health Diagnostics -----------------
export async function fetchMultiCloudHealth(): Promise<MultiCloudHealth | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return (await res.json()) as MultiCloudHealth;
  } catch {
    return null;
  }
}

// ----------------- Store Workspace Lock Settings -----------------
export async function updateStoreWorkspaceSettings(
  storeId: string,
  storeName: string,
  isPrivate: boolean,
  ownerUid = ''
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  setStorePrivateFlag(cleanStore, isPrivate);
  try {
    const storeRef = doc(db, 'stores', cleanStore);
    await setDoc(
      storeRef,
      {
        storeId: cleanStore,
        storeName: cleanStr(storeName, 128) || cleanStore,
        ownerUid: cleanStr(ownerUid, 128),
        isPrivate,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Safe fallback if offline
  }
}

export async function fetchStoreWorkspaceSettings(
  storeId: string
): Promise<{ isPrivate: boolean; ownerUid?: string; storeName?: string } | null> {
  try {
    const snap = await getDoc(doc(db, 'stores', normalizeStoreId(storeId)));
    if (snap.exists()) {
      const data = snap.data();
      return {
        isPrivate: Boolean(data.isPrivate),
        ownerUid: data.ownerUid || '',
        storeName: data.storeName || storeId,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

// ----------------- Dual-Cloud Flush (Firestore + PostgreSQL SQL) -----------------
export async function flushPendingSales(
  storeId = getOrCreateStoreId(),
  ownerUid = ''
): Promise<{ synced: number; remaining: number }> {
  const cleanStore = normalizeStoreId(storeId);
  const pending = getPendingSales(cleanStore);
  if (pending.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  const headers = await getAuthHeaders();

  for (const sale of pending) {
    try {
      const normalizedSale = normalizeSaleForCloud(sale, cleanStore, ownerUid, true);
      const saleDocRef = doc(db, 'stores', cleanStore, 'sales', normalizedSale.id);
      await setDoc(saleDocRef, normalizedSale);

      for (const item of normalizedSale.items) {
        try {
          const prodRef = doc(db, 'stores', cleanStore, 'products', item.product.id);
          await updateDoc(prodRef, {
            stock: increment(-item.quantity),
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore if product doc doesn't exist in Firestore
        }
      }

      // Sync to PostgreSQL / Cloud SQL endpoint as well
      await fetch('/api/sales', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...normalizedSale, storeId: cleanStore }),
      }).catch(() => {});

      removePendingSale(sale.id, cleanStore);
      synced++;
    } catch {
      break;
    }
  }

  notifyNetworkListeners(cleanStore);
  return { synced, remaining: getPendingSales(cleanStore).length };
}

// ----------------- Products Sync (Shared Stock Across Multi-Base) -----------------
export function subscribeToProducts(
  onProductsUpdated: (products: Product[]) => void,
  storeId = getOrCreateStoreId()
) {
  const cleanStore = normalizeStoreId(storeId);
  const local = getLocalProducts(cleanStore);
  onProductsUpdated(local);

  // Pull from SQL Multi-Base as secondary cloud source on initial mount
  fetch(`/api/products?storeId=${encodeURIComponent(cleanStore)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((sqlProds) => {
      if (Array.isArray(sqlProds) && sqlProds.length > 0 && getLocalProducts(cleanStore).length === 0) {
        saveLocalProducts(sqlProds, cleanStore);
        onProductsUpdated(sqlProds);
      }
    })
    .catch(() => {});

  const productsRef = collection(db, 'stores', cleanStore, 'products');
  const q = query(productsRef, where('storeId', '==', cleanStore));

  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          sku: data.sku || docSnap.id,
          name: data.name || 'Unnamed Product',
          category: data.category || 'အထွေထွေ (General)',
          price: Number(data.price) || 0,
          stock: typeof data.stock === 'number' ? data.stock : 0,
          barcode: data.barcode || '',
          badge: data.badge || '',
          purity: data.purity || '',
          description: data.description || '',
          image: data.image || '',
        });
      });

      saveLocalProducts(loaded, cleanStore);
      currentOnlineStatus = true;
      notifyNetworkListeners(cleanStore);
      onProductsUpdated(loaded);
    },
    () => {
      currentOnlineStatus = false;
      notifyNetworkListeners(cleanStore);
      onProductsUpdated(getLocalProducts(cleanStore));
    }
  );
}

// ----------------- Sales Sync -----------------
export function subscribeToRecentSales(
  onSalesUpdated: (sales: CompletedSale[]) => void,
  storeId = getOrCreateStoreId()
) {
  const cleanStore = normalizeStoreId(storeId);
  const localSales = getLocalSales(cleanStore);
  if (localSales.length > 0) {
    onSalesUpdated(localSales);
  }

  // Secondary cloud failover fetch from PostgreSQL / Cloud SQL
  fetch(`/api/sales?storeId=${encodeURIComponent(cleanStore)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((sqlSales) => {
      if (Array.isArray(sqlSales) && sqlSales.length > 0 && getLocalSales(cleanStore).length === 0) {
        saveLocalSales(sqlSales, cleanStore);
        onSalesUpdated(sqlSales);
      }
    })
    .catch(() => {});

  const salesRef = collection(db, 'stores', cleanStore, 'sales');
  const q = query(salesRef, where('storeId', '==', cleanStore), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const sales: CompletedSale[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        sales.push({
          id: docSnap.id,
          timestamp: data.timestamp || new Date().toLocaleTimeString(),
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: Number(data.subtotal) || 0,
          discountAmount: Number(data.discountAmount) || 0,
          taxAmount: Number(data.taxAmount) || 0,
          total: Number(data.total) || 0,
          paymentMethod: data.paymentMethod || 'cash',
          loyaltyMember: data.loyaltyMember || null,
          cashierName: data.cashierName || 'Staff',
          registerId: data.registerId || 'REG-01',
        });
      });

      // Sort newest first in memory (avoids composite index dependency)
      sales.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      const latest30 = sales.slice(0, 30);
      saveLocalSales(latest30, cleanStore);
      onSalesUpdated(latest30);
    },
    () => {
      onSalesUpdated(getLocalSales(cleanStore));
    }
  );
}

// ----------------- Record Sale (Dual-Cloud + Offline Resilient) -----------------
export async function recordCloudSale(
  sale: CompletedSale,
  storeId = getOrCreateStoreId(),
  ownerUid = ''
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const normalized = normalizeSaleForCloud(sale, cleanStore, ownerUid, false);

  // 1. Instantly update local sales history
  const localSales = getLocalSales(cleanStore);
  saveLocalSales([sale, ...localSales], cleanStore);

  // 2. Instantly decrement local products stock
  const prods = getLocalProducts(cleanStore);
  const updatedProds = prods.map((p) => {
    const soldItem = sale.items.find((i) => i.product.id === p.id);
    if (soldItem) {
      return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
    }
    return p;
  });
  saveLocalProducts(updatedProds, cleanStore);

  // 3. Persist to PostgreSQL / Cloud SQL Multi-Base API
  try {
    const headers = await getAuthHeaders();
    fetch('/api/sales', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...normalized, storeId: cleanStore }),
    }).catch((e) => console.warn('SQL record sale warning:', e));
  } catch {
    // fallback handled
  }

  // 4. Persist to Cloud Firestore
  try {
    const saleDocRef = doc(db, 'stores', cleanStore, 'sales', normalized.id);
    await setDoc(saleDocRef, normalized);

    for (const item of normalized.items) {
      try {
        const prodRef = doc(db, 'stores', cleanStore, 'products', item.product.id);
        await updateDoc(prodRef, {
          stock: increment(-item.quantity),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // item might be a quick ad-hoc item not stored in inventory catalog
      }
    }

    const statsRef = doc(db, 'stores', cleanStore, 'dailyStats', 'store_summary');
    await setDoc(
      statsRef,
      {
        id: 'store_summary',
        storeId: cleanStore,
        totalSales: increment(normalized.total),
        itemsSold: increment(normalized.items.reduce((acc, i) => acc + i.quantity, 0)),
        transactionsCount: increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    addPendingSale(sale, cleanStore);
  }
}

// ----------------- Product Management (Dual-Cloud Sync) -----------------
export async function saveProductToCloud(
  product: Product,
  storeId = getOrCreateStoreId(),
  ownerUid = ''
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const normalized = normalizeProductForCloud(product, cleanStore, ownerUid);

  const local = getLocalProducts(cleanStore);
  const exists = local.some((p) => p.id === normalized.id);
  const updated = exists
    ? local.map((p) => (p.id === normalized.id ? product : p))
    : [product, ...local];
  saveLocalProducts(updated, cleanStore);

  try {
    const headers = await getAuthHeaders();
    fetch('/api/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...normalized, storeId: cleanStore }),
    }).catch((e) => console.warn('SQL sync product warning:', e));
  } catch {
    // offline safe
  }

  try {
    const prodRef = doc(db, 'stores', cleanStore, 'products', normalized.id);
    await setDoc(prodRef, normalized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${cleanStore}/products/${normalized.id}`);
  }
}

export async function updateProductStockInCloud(
  productId: string,
  newStock: number,
  storeId = getOrCreateStoreId()
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const safeStock = Math.max(0, Math.round(newStock));
  const local = getLocalProducts(cleanStore);
  const targetProd = local.find((p) => p.id === productId);
  const updatedList = local.map((p) => (p.id === productId ? { ...p, stock: safeStock } : p));
  saveLocalProducts(updatedList, cleanStore);

  if (targetProd) {
    getAuthHeaders()
      .then((headers) =>
        fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...targetProd, stock: safeStock, storeId: cleanStore }),
        })
      )
      .catch(() => {});
  }

  try {
    const prodRef = doc(db, 'stores', cleanStore, 'products', sanitizeIdStr(productId, 'prod'));
    await updateDoc(prodRef, {
      stock: safeStock,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `stores/${cleanStore}/products/${productId}`);
  }
}

export async function deleteProductFromCloud(
  productId: string,
  storeId = getOrCreateStoreId()
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const local = getLocalProducts(cleanStore).filter((p) => p.id !== productId);
  saveLocalProducts(local, cleanStore);

  getAuthHeaders()
    .then((headers) =>
      fetch(`/api/products/${encodeURIComponent(productId)}?storeId=${encodeURIComponent(cleanStore)}`, {
        method: 'DELETE',
        headers,
      })
    )
    .catch(() => {});

  try {
    const prodRef = doc(db, 'stores', cleanStore, 'products', sanitizeIdStr(productId, 'prod'));
    await deleteDoc(prodRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `stores/${cleanStore}/products/${productId}`);
  }
}

export async function clearAllProductsFromCloud(
  storeId = getOrCreateStoreId()
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const currentLocal = getLocalProducts(cleanStore);
  saveLocalProducts([], cleanStore);

  // Sync deletes to SQL
  getAuthHeaders()
    .then((headers) => {
      for (const p of currentLocal) {
        fetch(`/api/products/${encodeURIComponent(p.id)}?storeId=${encodeURIComponent(cleanStore)}`, {
          method: 'DELETE',
          headers,
        }).catch(() => {});
      }
    })
    .catch(() => {});

  try {
    const productsRef = collection(db, 'stores', cleanStore, 'products');
    const q = query(productsRef, where('storeId', '==', cleanStore));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, 'stores', cleanStore, 'products', docSnap.id));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `stores/${cleanStore}/products`);
  }
}

export async function loadSampleProductsToCloud(
  storeId = getOrCreateStoreId(),
  ownerUid = ''
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  saveLocalProducts(INITIAL_PRODUCTS, cleanStore);

  getAuthHeaders()
    .then((headers) =>
      fetch('/api/products/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ storeId: cleanStore, products: INITIAL_PRODUCTS }),
      })
    )
    .catch(() => {});

  try {
    for (const prod of INITIAL_PRODUCTS) {
      const normalized = normalizeProductForCloud(prod, cleanStore, ownerUid);
      await setDoc(doc(db, 'stores', cleanStore, 'products', normalized.id), normalized);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `stores/${cleanStore}/products`);
  }
}

// ----------------- Portable Cross-Cloud Backup Export & Import -----------------
export function buildStoreBackupJson(
  storeId: string,
  products: Product[],
  sales: CompletedSale[]
): string {
  const payload: StoreBackupPayload = {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    storeId: normalizeStoreId(storeId),
    products,
    sales,
  };
  return JSON.stringify(payload, null, 2);
}

export async function restoreStoreBackup(
  rawJson: string,
  targetStoreId: string,
  ownerUid = ''
): Promise<{ productsImported: number }> {
  const parsed = JSON.parse(rawJson);
  if (!parsed || !Array.isArray(parsed.products)) {
    throw new Error('Invalid backup file format.');
  }
  const cleanStore = normalizeStoreId(targetStoreId);
  const validProducts: Product[] = parsed.products
    .filter((p: any) => p && typeof p.name === 'string' && typeof p.id === 'string')
    .slice(0, 500);

  const existing = getLocalProducts(cleanStore);
  const mergedMap = new Map<string, Product>();
  existing.forEach((p) => mergedMap.set(p.id, p));
  validProducts.forEach((p) => mergedMap.set(p.id, p));
  saveLocalProducts(Array.from(mergedMap.values()), cleanStore);

  const headers = await getAuthHeaders();
  await fetch('/api/products/bulk', {
    method: 'POST',
    headers,
    body: JSON.stringify({ storeId: cleanStore, products: validProducts }),
  }).catch(() => {});

  for (const prod of validProducts) {
    try {
      const normalized = normalizeProductForCloud(prod, cleanStore, ownerUid);
      await setDoc(doc(db, 'stores', cleanStore, 'products', normalized.id), normalized, {
        merge: true,
      });
    } catch {
      // continue importing remaining items
    }
  }

  return { productsImported: validProducts.length };
}

// ----------------- Multi-Device Presence -----------------
export async function pingDevicePresence(
  device: DeviceInfo,
  storeId = getOrCreateStoreId()
): Promise<void> {
  const cleanStore = normalizeStoreId(storeId);
  const safeDevId = sanitizeIdStr(device.deviceId, 'DEV');
  try {
    const devRef = doc(db, 'stores', cleanStore, 'devices', safeDevId);
    await setDoc(
      devRef,
      {
        deviceId: safeDevId,
        storeId: cleanStore,
        deviceName: cleanStr(device.deviceName, 128) || 'Terminal',
        registerId: cleanStr(device.registerId, 64) || 'REG-01',
        cashierName: cleanStr(device.cashierName, 128) || 'Cashier',
        platform: cleanStr(device.platform, 64) || 'Web',
        lastActive: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // ignore offline ping errors
  }
}

export function subscribeToActiveDevices(
  onDevicesUpdated: (devices: DeviceInfo[]) => void,
  storeId = getOrCreateStoreId()
) {
  const cleanStore = normalizeStoreId(storeId);
  const devicesRef = collection(db, 'stores', cleanStore, 'devices');
  const q = query(devicesRef, where('storeId', '==', cleanStore));

  return onSnapshot(
    q,
    (snapshot) => {
      const devList: DeviceInfo[] = [];
      const now = Date.now();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const lastActiveTime = new Date(d.lastActive || 0).getTime();
        const isOnline = now - lastActiveTime < 15 * 60 * 1000;
        if (isOnline) {
          devList.push({
            deviceId: docSnap.id,
            storeId: cleanStore,
            deviceName: d.deviceName || 'Terminal',
            registerId: d.registerId || 'REG-01',
            cashierName: d.cashierName || 'Cashier',
            platform: d.platform || 'Web',
            lastActive: d.lastActive || '',
          });
        }
      });
      onDevicesUpdated(devList);
    },
    () => {
      onDevicesUpdated([]);
    }
  );
}
