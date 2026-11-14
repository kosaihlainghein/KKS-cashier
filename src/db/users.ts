import { db } from './index.ts';
import { users } from './schema.ts';
import { localGetOrCreateUser } from './localFallback.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  storeId = 'default-shop'
) {
  if (!db) {
    return localGetOrCreateUser(uid, email, displayName, storeId);
  }
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        storeId,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('SQL getOrCreateUser fallback to local Multi-Base:', error);
    return localGetOrCreateUser(uid, email, displayName, storeId);
  }
}
