import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID & primary Shop Workspace
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('cashier'),
  storeId: text('store_id').notNull().default('default-shop'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table in PostgreSQL (Multi-Store scoped)
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().default('default-shop'),
  ownerUid: text('owner_uid').default(''),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  stock: integer('stock').notNull().default(0),
  barcode: text('barcode').default(''),
  badge: text('badge').default(''),
  purity: text('purity').default(''),
  description: text('description').default(''),
  image: text('image').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sales transactions ledger in PostgreSQL (Multi-Store scoped)
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().default('default-shop'),
  ownerUid: text('owner_uid').default(''),
  timestamp: text('timestamp').notNull(),
  subtotal: integer('subtotal').notNull(),
  discountAmount: integer('discount_amount').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  total: integer('total').notNull(),
  paymentMethod: text('payment_method').notNull(),
  cashierName: text('cashier_name').notNull(),
  registerId: text('register_id').notNull(),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

