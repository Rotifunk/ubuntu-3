import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db'; // Assuming db connection is exported from here
import { chatSession } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid'; // For generating unique IDs
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Select id, title, and createdAt, ordered by createdAt descending
		const sessions = await db.select({
            id: chatSession.id,
            title: chatSession.title,
            createdAt: chatSession.createdAt // Select createdAt
        }).from(chatSession).orderBy(desc(chatSession.createdAt));

        // Convert Date objects to ISO strings for serialization
		const serializedSessions = sessions.map(session => ({
			...session,
			createdAt: session.createdAt.toISOString() // Serialize Date to string
		}));

		return json(serializedSessions); // Return serialized sessions
	} catch (error) {
		console.error('Error fetching chat sessions:', error);
		return json({ error: 'Failed to fetch chat sessions' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({})); // Handle cases where body might be empty or not JSON
		const title = body.title || 'New Chat'; // Use provided title or default

		const newChatId = nanoid(); // Generate a unique ID

		const createdAt = new Date(); // Store creation time

		// Insert the new chat session into the database
		const insertedResult = await db.insert(chatSession).values({
			id: newChatId,
			title: title,
            createdAt: createdAt // Use the stored creation time
		}).returning({
            id: chatSession.id,
            title: chatSession.title,
            createdAt: chatSession.createdAt // Return createdAt as well
        });

		if (!insertedResult || insertedResult.length === 0) {
			throw new Error('Failed to insert new chat session');
		}

        const newSessionData = insertedResult[0];

		// Return the newly created chat session object with createdAt as ISO string
		return json({
            ...newSessionData,
            createdAt: newSessionData.createdAt.toISOString() // Serialize Date to string
        }, { status: 201 }); // 201 Created status

	} catch (error) {
		console.error('Error creating new chat session:', error);
		return json({ error: 'Failed to create new chat session' }, { status: 500 });
	}
};
