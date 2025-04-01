import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { chatSession } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Handler for DELETE /api/chats/[chatId]
export const DELETE: RequestHandler = async ({ params }) => {
	const chatId = params.chatId;

	if (!chatId) {
		return json({ error: 'Chat ID is required' }, { status: 400 });
	}

	try {
		// Delete the chat session. Messages will be deleted automatically due to 'onDelete: cascade' in schema.
		const deletedSession = await db
            .delete(chatSession)
            .where(eq(chatSession.id, chatId))
            .returning({ deletedId: chatSession.id }); // Return the ID of the deleted session

		if (!deletedSession || deletedSession.length === 0) {
			// If nothing was deleted, maybe the chat ID didn't exist
			return json({ error: 'Chat session not found' }, { status: 404 });
		}

		console.log('Deleted chat session:', deletedSession[0].deletedId);
		return json({ success: true, deletedId: deletedSession[0].deletedId }, { status: 200 });

	} catch (error) {
		console.error(`Error deleting chat session ${chatId}:`, error);
		return json({ error: 'Failed to delete chat session' }, { status: 500 });
	}
};

// Optional: Add GET handler if needed later to fetch a single chat session details
// export const GET: RequestHandler = async ({ params }) => { ... }

// Handler for PUT /api/chats/[chatId] (Update title)
export const PUT: RequestHandler = async ({ params, request }) => {
	const chatId = params.chatId;

	if (!chatId) {
		return json({ error: 'Chat ID is required' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const newTitle = body.title;

		if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
			return json({ error: 'Invalid title provided.' }, { status: 400 });
		}

		const updatedSession = await db
			.update(chatSession)
			.set({ title: newTitle.trim() })
			.where(eq(chatSession.id, chatId))
			.returning({ id: chatSession.id, title: chatSession.title }); // Return updated data

		if (!updatedSession || updatedSession.length === 0) {
			return json({ error: 'Chat session not found or failed to update' }, { status: 404 });
		}

		console.log(`Updated title for chat ${chatId} to "${updatedSession[0].title}"`);
		return json(updatedSession[0], { status: 200 });

	} catch (error) {
		console.error(`Error updating title for chat ${chatId}:`, error);
		return json({ error: 'Failed to update chat title' }, { status: 500 });
	}
};
