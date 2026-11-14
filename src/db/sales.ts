import { db } from './index.ts';
import { sales, products } from './schema.ts';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CompletedSale } from '../types';
import { localGetSales, localRecordSale } from './localFallback.ts';

export async function getSqlSales(storeId = 'default-shop') {
  if (!db) {
    return localGetSales(storeId);
  }
  try {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.storeId, storeId))
      .orderBy(desc(sales.createdAt))
      .limit(100);
  } catch (error) {
    console.warn('SQL sales read unavailable, using local Multi-Base fallback:', error);
    return localGetSales(storeId);
  }
}

export async function recordSqlSale(
  sale: CompletedSale,
  storeId = 'default-shop',
  ownerUid = ''
) {
  if (!db) {
    return localRecordSale(sale, storeId, ownerUid);
  }
  try {
    return await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(sales)
        .values({
          id: sale.id,
          storeId,
          ownerUid,
          timestamp: sale.timestamp || new Date().toISOString(),
          subtotal: Math.max(0, Math.round(sale.subtotal || 0)),
          discountAmount: Math.max(0, Math.round(sale.discountAmount || 0)),
          taxAmount: Math.max(0, Math.round(sale.taxAmount || 0)),
          total: Math.max(0, Math.round(sale.total || 0)),
          paymentMethod: sale.paymentMethod || 'cash',
          cashierName: sale.cashierName || 'Cashier',
          registerId: sale.registerId || 'REG-01',
          items: sale.items,
        })
        .onConflictDoNothing()
        .returning();

      // Only decrement inventory if this sale row was newly inserted (idempotent sync)
      if (inserted.length > 0 && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          if (!item?.product?.id || !Number.isFinite(item.quantity) || item.quantity <= 0) {
            continue;
          }
          await tx
            .update(products)
            .set({
              stock: sql`GREATEST(0, ${products.stock} - ${Math.round(item.quantity)})`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, item.product.id),
                eq(products.storeId, storeId)
              )
            );
        }
      }

      return inserted[0] || sale;
    });
  } catch (error) {
    console.warn('SQL sale transaction unavailable, persisting to local Multi-Base:', error);
    return localRecordSale(sale, storeId, ownerUid);
  }
}
