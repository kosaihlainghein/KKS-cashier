import fs from 'fs';
import path from 'path';
import os from 'os';
import { Product, CompletedSale } from '../types';

export interface LocalBaseUser {
  uid: string;
  email: string;
  displayName?: string | null;
  role: string;
  storeId: string;
  createdAt: string;
}

export interface LocalBaseProduct extends Product {
  storeId: string;
  ownerUid?: string;
  updatedAt: string;
}

export interface LocalBaseSale extends CompletedSale {
  storeId: string;
  ownerUid?: string;
  createdAt: string;
}

interface LocalBaseState {
  users: LocalBaseUser[];
  products: LocalBaseProduct[];
  sales: LocalBaseSale[];
}

const LOCAL_STORE_PATH =
  process.env.LOCAL_DB_PATH || path.join(os.tmpdir(), 'kks-pos-local-base.json');

function readStore(): LocalBaseState {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      };
    }
  } catch {
    // fallback to clean state
  }
  return { users: [], products: [], sales: [] };
}

function writeStore(state: LocalBaseState): void {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Local JSON Multi-Base write warning:', err);
  }
}

export function localGetOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  storeId = 'default-shop'
): LocalBaseUser {
  const state = readStore();
  const idx = state.users.findIndex((u) => u.uid === uid);
  const record: LocalBaseUser = {
    uid,
    email,
    displayName: displayName || null,
    role: idx >= 0 ? state.users[idx].role : 'cashier',
    storeId: idx >= 0 ? state.users[idx].storeId : storeId,
    createdAt: idx >= 0 ? state.users[idx].createdAt : new Date().toISOString(),
  };
  if (idx >= 0) {
    state.users[idx] = record;
  } else {
    state.users.push(record);
  }
  writeStore(state);
  return record;
}

export function localGetProducts(storeId: string): LocalBaseProduct[] {
  const state = readStore();
  return state.products.filter((p) => p.storeId === storeId);
}

export function localUpsertProduct(
  prod: Product,
  storeId: string,
  ownerUid = ''
): LocalBaseProduct {
  const state = readStore();
  const idx = state.products.findIndex((p) => p.id === prod.id && p.storeId === storeId);
  const record: LocalBaseProduct = {
    ...prod,
    storeId,
    ownerUid,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    state.products[idx] = record;
  } else {
    state.products.unshift(record);
  }
  writeStore(state);
  return record;
}

export function localDeleteProduct(id: string, storeId: string): void {
  const state = readStore();
  state.products = state.products.filter((p) => !(p.id === id && p.storeId === storeId));
  writeStore(state);
}

export function localGetSales(storeId: string): LocalBaseSale[] {
  const state = readStore();
  return state.sales.filter((s) => s.storeId === storeId).slice(0, 100);
}

export function localRecordSale(
  sale: CompletedSale,
  storeId: string,
  ownerUid = ''
): LocalBaseSale {
  const state = readStore();
  const existing = state.sales.find((s) => s.id === sale.id && s.storeId === storeId);
  if (existing) return existing;

  const record: LocalBaseSale = {
    ...sale,
    storeId,
    ownerUid,
    createdAt: new Date().toISOString(),
  };
  state.sales.unshift(record);

  // Decrement stock cleanly
  for (const item of sale.items) {
    const prodIdx = state.products.findIndex(
      (p) => p.id === item.product.id && p.storeId === storeId
    );
    if (prodIdx >= 0) {
      state.products[prodIdx].stock = Math.max(
        0,
        state.products[prodIdx].stock - item.quantity
      );
      state.products[prodIdx].updatedAt = new Date().toISOString();
    }
  }

  writeStore(state);
  return record;
}
