import { pgTable, text, timestamp, uuid, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: integer('prediction_id').notNull().unique(), // matches contract uint64
  creator: text('creator').notNull(), // ethereum address
  title: text('title').notNull(),
  description: text('description').notNull(),
  stake: decimal('stake', { precision: 36, scale: 18 }).notNull(), // for ETH amounts
  totalBets: decimal('total_bets', { precision: 36, scale: 18 }).notNull(),
  resolvedOption: integer('resolved_option').default(-1), // -1 means unresolved
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  chainId: integer('chain_id').notNull(),
  txHash: text('tx_hash').notNull(),
});

export const predictionOptions = pgTable('prediction_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: uuid('prediction_id').references(() => predictions.id).notNull(),
  optionId: integer('option_id').notNull(),
  text: text('text').notNull(),
});

export const bets = pgTable('bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: uuid('prediction_id').references(() => predictions.id).notNull(),
  bettor: text('bettor').notNull(), // ethereum address
  optionId: integer('option_id').notNull(),
  amount: decimal('amount', { precision: 36, scale: 18 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  claimed: boolean('claimed').default(false),
  txHash: text('tx_hash').notNull(),
  sourceChain: text('source_chain'),
});

export const predictionsRelations = relations(predictions, ({ many }) => ({
  options: many(predictionOptions),
  bets: many(bets),
}));

export const predictionOptionsRelations = relations(predictionOptions, ({ one }) => ({
  prediction: one(predictions, {
    fields: [predictionOptions.predictionId],
    references: [predictions.id],
  }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  prediction: one(predictions, {
    fields: [bets.predictionId],
    references: [predictions.id],
  }),
}));