import { db } from './index.ts';
import { products } from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';
import { Product } from '../types';
import {
  localDeleteProduct,
  localGetProducts,
  localUpsertProduct,
} from './localFallback.ts';

export async function getSqlProducts(storeId = 'default-shop') {
  if (!db) {
    return localGetProducts(storeId);
  }
  try {
    return await db
      .select()
      .from(products)
      .where(eq(products.storeId, storeId))
      .orderBy(desc(products.updatedAt));
  } catch (error) {
    console.warn('SQL read unavailable, using local Multi-Base fallback:', error);
    return localGetProducts(storeId);
  }
}

export async function upsertSqlProduct(
  prod: Product,
  storeId = 'default-shop',
  ownerUid = ''
) {
  if (!db) {
    return localUpsertProduct(prod, storeId, ownerUid);
  }
  try {
    const result = await db
      .insert(products)
      .values({
        id: prod.id,
        storeId,
        ownerUid,
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        price: Math.max(0, Math.round(prod.price)),
        stock: Math.max(0, Math.round(prod.stock)),
        barcode: prod.barcode || '',
        badge: prod.badge || '',
        purity: prod.purity || '',
        description: prod.description || '',
        image: prod.image || '',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          storeId,
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          price: Math.max(0, Math.round(prod.price)),
          stock: Math.max(0, Math.round(prod.stock)),
          barcode: prod.barcode || '',
          badge: prod.badge || '',
          purity: prod.purity || '',
          description: prod.description || '',
          image: prod.image || '',
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('SQL upsert unavailable, persisting to local Multi-Base:', error);
    return localUpsertProduct(prod, storeId, ownerUid);
  }
}

export async function bulkUpsertSqlProducts(
  productList: Product[],
  storeId = 'default-shop',
  ownerUid = ''
) {
  const saved = [];
  for (const prod of productList) {
    saved.push(await upsertSqlProduct(prod, storeId, ownerUid));
  }
  return saved;
}

export async function deleteSqlProduct(id: string, storeId = 'default-shop') {
  if (!db) {
    localDeleteProduct(id, storeId);
    return;
  }
  try {
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.storeId, storeId)));
  } catch (error) {
    console.warn('SQL delete unavailable, updating local Multi-Base:', error);
    localDeleteProduct(id, storeId);
  }
}
