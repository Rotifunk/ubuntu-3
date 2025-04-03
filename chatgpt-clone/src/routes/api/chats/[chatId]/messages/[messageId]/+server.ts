import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema'; // Corrected import
import { eq, and } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params }) => {
	const { chatId, messageId: messageIdStr } = params; // Rename to avoid confusion

	if (!chatId || !messageIdStr) {
		throw error(400, 'Chat ID and Message ID are required');
	}

	const messageId = parseInt(messageIdStr, 10); // Convert string param to integer

	if (isNaN(messageId)) {
		throw error(400, 'Invalid Message ID format'); // Handle non-numeric message ID
	}

	console.log(`[API DELETE] Attempting to delete messageId: ${messageId} from chatId: ${chatId}`); // Log input

	try {
		const deletedMessages = await db
			.delete(message)
			.where(and(eq(message.chatId, chatId), eq(message.id, messageId))) // Use the integer messageId
			.returning({ id: message.id });

		console.log(`[API DELETE] DB delete operation returned:`, deletedMessages); // Log DB result

		if (deletedMessages.length === 0) {
			// If no message was deleted (e.g., messageId not found for the given chatId)
			console.warn(`[API DELETE] Message ${messageId} not found for chat ${chatId}.`);
			throw error(404, 'Message not found or already deleted');
		}

		// Successfully deleted
		console.log(`[API DELETE] Successfully deleted message ${messageId}. Returning 204.`);
		return new Response(null, { status: 204 }); // 204 No Content is appropriate for successful DELETE
	} catch (err: any) {
		// Handle potential database errors or the 404 error thrown above
		if (err.status) {
			// Re-throw errors created with `error()`
			throw err;
		}
		console.error('Error deleting message:', err);
		throw error(500, 'Failed to delete message');
	}
};
