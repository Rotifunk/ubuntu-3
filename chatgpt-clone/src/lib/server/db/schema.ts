import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// --- Chat Tables ---

export const chatSession = sqliteTable('chat_session', {
	id: text('id').primaryKey(), // Using text ID like before
	title: text('title').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()) // Default to current time
});

export const message = sqliteTable('message', {
	id: integer('id').primaryKey({ autoIncrement: true }), // Auto-incrementing integer ID
	chatId: text('chat_id')
		.notNull()
		.references(() => chatSession.id, { onDelete: 'cascade' }), // Cascade delete messages when session is deleted
	role: text('role', { enum: ['user', 'assistant'] }).notNull(), // Role: user or assistant (bot)
	content: text('content').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date())
});


// --- Types ---

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
