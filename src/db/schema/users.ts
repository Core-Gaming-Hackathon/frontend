import { pgTable, text, timestamp, uuid, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { bets } from './predictions';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(), // ethereum address
  nonce: text('nonce').notNull(), // for wallet authentication
  username: text('username').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  isAdmin: boolean('is_admin').default(false),
});

export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  totalBets: integer('total_bets').default(0),
  totalWins: integer('total_wins').default(0),
  totalStaked: decimal('total_staked', { precision: 36, scale: 18 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  bets: many(bets),
}));
