import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { message as messageTable, chatSession } from '$lib/server/db/schema'; // Renamed to avoid conflict
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, type Content } from '@google/generative-ai'; // Removed Part
import { env } from '$env/dynamic/private';
import { eq, asc } from 'drizzle-orm'; // Removed desc
import type { RequestHandler } from './$types';
// Removed stream helper import for now, using native Response

// Define the expected request body structure (only the new message content)
interface GeminiRequestBody {
    message: string;
}

// Initialize Google Generative AI client
const API_KEY = env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Safety settings for the model (adjust as needed)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Handler for POST /api/chats/[chatId]/gemini - Now returns a stream
export const POST: RequestHandler = async ({ params, request }) => {
	const chatId = params.chatId;

	if (!chatId) {
		return json({ error: 'Chat ID is required' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const requestBody = body as GeminiRequestBody;
		const userMessageContent = requestBody.message;

		if (!userMessageContent || typeof userMessageContent !== 'string') {
			return json({ error: 'Invalid request body. Requires "message" (string).' }, { status: 400 });
		}

        // --- Fetch chat history from DB ---
        const history = await db
            .select({ role: messageTable.role, content: messageTable.content })
            .from(messageTable)
            .where(eq(messageTable.chatId, chatId))
            .orderBy(asc(messageTable.createdAt)); // Important: maintain chronological order

        // Format history for Gemini API (alternating user/model roles)
        const geminiHistory: Content[] = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user', // Map 'assistant' to 'model'
            parts: [{ text: msg.content }]
        }));

        // --- Call Gemini API using stream ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25", safetySettings });
        const chat = model.startChat({ history: geminiHistory });

        // Use generateContentStream instead of sendMessage
        const resultStream = await chat.sendMessageStream(userMessageContent);

        // Create a ReadableStream to send back to the client
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of resultStream.stream) {
                        // Check for potential errors or blocks in the chunk
                        if (!chunk.candidates || chunk.candidates.length === 0) {
                             console.warn('Gemini stream chunk blocked or empty:', chunk.promptFeedback);
                             // Optionally send an error marker in the stream or just stop
                             // controller.enqueue(encoder.encode("[STREAM_BLOCKED]"));
                             continue; // Skip this chunk
                        }
                        const chunkText = chunk.text();
                        if (chunkText) {
                            // Send each chunk as a string
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                    controller.close();
                } catch (streamError) {
                    console.error('Error reading Gemini stream:', streamError);
                    controller.error(streamError);
                }
            },
            cancel() {
                console.log('Client cancelled the stream request.');
            }
        });

        // Return the stream directly
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-cache', // Ensure no caching
            }
        });

        // --- Bot response saving to DB is removed from this endpoint ---

	} catch (error) {
		console.error(`Error processing Gemini request for chat ${chatId}:`, error);
		// Consider more specific error handling based on API errors
		return json({ error: 'Failed to process request with Gemini' }, { status: 500 });
	}
};
