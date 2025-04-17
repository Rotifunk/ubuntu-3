import { db } from '$lib/server/db';
import { chatSession } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { ChatSession } from '$lib/stores/chatStore'; // Import ChatSession type

// Define the return type for the load function, including createdAt
type LoadOutput = {
	chatSessions: Pick<ChatSession, 'id' | 'title' | 'createdAt'>[];
};

export const load = async (): Promise<LoadOutput> => { // Add explicit return type
	try {
		// Fetch all chat sessions from the database, ordered by creation date
		const sessions = await db
            .select({
                id: chatSession.id,
                title: chatSession.title,
                createdAt: chatSession.createdAt // Select createdAt
            })
            .from(chatSession)
            .orderBy(desc(chatSession.createdAt)); // Already ordering by createdAt desc

		// Convert Date objects to ISO strings for serialization
		const serializedSessions = sessions.map(session => ({
			...session,
			createdAt: session.createdAt.toISOString() // Serialize Date to string
		}));

		return {
			chatSessions: serializedSessions
		};
	} catch (error) {
		console.error('Error loading chat sessions in layout:', error);
		// Return empty array or handle error appropriately
		// Returning an empty array allows the UI to load without crashing
		return {
			chatSessions: [] // Ensure the return type matches even on error
		};
	}
};
