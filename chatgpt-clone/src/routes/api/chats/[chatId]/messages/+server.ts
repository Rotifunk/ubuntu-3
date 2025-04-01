import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { message } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Define the expected request body structure for adding a message
interface AddMessageBody {
    role: 'user' | 'assistant'; // Explicitly define allowed roles
    content: string;
}

export const GET: RequestHandler = async ({ params }) => {
	const chatId = params.chatId;
    console.log(`[API /api/chats/${chatId}/messages] Received GET request for chatId: ${chatId}`); // Log received chatId

	if (!chatId) {
		return json({ error: 'Chat ID is required' }, { status: 400 });
	}

	try {
		const messages = await db
			.select({
                // Select specific fields needed by the frontend
                id: message.id,
                role: message.role,
                content: message.content,
                // Omit createdAt for now unless needed
            })
			.from(message)
			.where(eq(message.chatId, chatId)) // Ensure we are using the correct schema object property 'chatId' which maps to 'chat_id' column
			.orderBy(asc(message.createdAt));

        console.log(`Returning ${messages.length} messages for chat ${chatId}`); // Add log to see how many messages are found
		return json(messages);
	} catch (error) {
		console.error(`Error fetching messages for chat ${chatId}:`, error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	const chatId = params.chatId;

	if (!chatId) {
		return json({ error: 'Chat ID is required' }, { status: 400 });
	}

	try {
		const body = await request.json();
        // Validate the request body against the defined interface
        const messageContent = body as AddMessageBody;

		if (!messageContent || typeof messageContent.role !== 'string' || typeof messageContent.content !== 'string' || !['user', 'assistant'].includes(messageContent.role)) {
			return json({ error: 'Invalid message format. Requires role ("user" or "assistant") and content (string).' }, { status: 400 });
		}

		// Insert the new message into the database
		const insertedMessage = await db.insert(message).values({
			chatId: chatId,
			role: messageContent.role, // Use validated role
			content: messageContent.content, // Use validated content
            createdAt: new Date()
		}).returning({
            id: message.id, // Return the generated ID
            role: message.role,
            content: message.content
        });

		if (!insertedMessage || insertedMessage.length === 0) {
			throw new Error('Failed to insert new message');
		}

		// Return the newly created message object
		// Note: In a real LLM integration, this might trigger the LLM call
		// and potentially return the assistant's response later or via streaming.
		return json(insertedMessage[0], { status: 201 }); // 201 Created

	} catch (error) {
		console.error(`Error adding message to chat ${chatId}:`, error);
		return json({ error: 'Failed to add message' }, { status: 500 });
	}
};
