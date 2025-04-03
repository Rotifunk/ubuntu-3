import { writable, derived, get } from 'svelte/store';

// Define Message type (matching API/DB structure)
export type Message = {
	id: number;
	role: 'user' | 'assistant'; // Use 'assistant' for bot/system messages
	content: string;
    // Optional: Add createdAt if needed later
};

export type ChatSession = {
	id: string;
	title: string;
	createdAt: string; // Add createdAt as ISO string
};

// Function to generate a simple unique ID (still needed for client-side optimistic updates if desired)
function generateId(): string {
	return Math.random().toString(36).substring(2, 9); // Shorter ID for readability
}

// --- Store Definitions ---

// Store for all chat sessions (metadata) - Initialized empty, loaded from server
export const chatSessions = writable<ChatSession[]>([]);

// Store for messages of the CURRENTLY selected chat - Initialized empty, loaded from server
export const currentChatMessages = writable<Message[]>([]);

// Store for the currently selected chat ID
export const selectedChatId = writable<string | null>(null);


// --- Store Update Functions ---
// These functions now primarily interact with the server API.

// Function to load chat sessions from the server
export async function loadChatSessions() {
	try {
		const response = await fetch('/api/chats');
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const sessions: ChatSession[] = await response.json();
		console.log('[Load Sessions] Fetched sessions:', sessions.map(s => s.id));
		chatSessions.set(sessions);

		// Remove automatic selection logic from here.
		// Selection should be handled explicitly where needed (e.g., initial load, add/delete).
		// const currentSelected = get(selectedChatId);
        // if (!currentSelected && sessions.length > 0) {
        //     selectChat(sessions[0].id);
        // } else if (currentSelected && !sessions.some(s => s.id === currentSelected)) {
		// 	console.warn('loadChatSessions: Selected chat became invalid, selecting first available.');
        //     selectChat(sessions[0]?.id ?? null);
        // }

	} catch (error) {
		console.error('Failed to load chat sessions:', error);
	}
}

// Function to load messages for a specific chat from the server
export async function loadMessagesForChat(chatId: string | null) {
	if (!chatId) {
		currentChatMessages.set([]);
		return;
	}
	try {
		const response = await fetch(`/api/chats/${chatId}/messages`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const messages: Message[] = await response.json();
		console.log(`Loaded messages for chat ${chatId}:`, messages);
		currentChatMessages.set(messages);
	} catch (error) {
		console.error(`Failed to load messages for chat ${chatId}:`, error);
		currentChatMessages.set([]);
	}
}

// Function to select a chat - Now also triggers loading messages
export function selectChat(id: string | null) {
	selectedChatId.set(id);
	console.log('Selected chat:', id);
	loadMessagesForChat(id);
}

// --- Client-side functions to interact with the server API ---

export async function addNewChatClient(title: string = 'New Chat') {
	// Revert to non-optimistic approach: Call API first
	try {
		const response = await fetch('/api/chats', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const newSession: ChatSession = await response.json();

		// Explicitly reload sessions to ensure the new one is included
		// This prevents a race condition where automatic invalidation might load
		// the list before the new chat is available, causing selection issues.
		console.log('[Add New Chat] Reloading chat sessions after creation...');
		await loadChatSessions();

		// Now that the list is updated (by loadChatSessions), select the newly added chat
		console.log('[Add New Chat] Selecting newly created chat:', newSession.id);
		selectChat(newSession.id);

        console.log('[Add New Chat] Successfully added new chat, reloaded list, and selected:', newSession);

	} catch (error) {
		console.error('Failed to add new chat:', error);
		// No optimistic update to revert
	}
}

// Updated function to handle streaming response from Gemini API with debouncing
export async function getBotResponseClient(chatId: string, userMessageContent: string) {
	console.log(`getBotResponseClient called for chat ${chatId} with message: "${userMessageContent}"`); // Log function call
	let botMessageId = Date.now() + Math.random(); // Temporary ID for the streaming message
	let accumulatedContent = ''; // Still used for the final DB save
	let messageAdded = false;
	let textBuffer = ''; // Buffer for debounced updates
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	const debounceInterval = 100; // ms - Adjust as needed

	const updateStore = () => {
		if (!messageAdded) {
			// Add the initial message bubble with the buffered content
			const newMessage: Message = {
				id: botMessageId,
				role: 'assistant',
				content: textBuffer
			};
			currentChatMessages.update(messages => [...messages, newMessage]);
			messageAdded = true;
		} else {
			// Update the content of the existing message bubble
			currentChatMessages.update(messages =>
				messages.map(msg =>
					msg.id === botMessageId ? { ...msg, content: textBuffer } : msg
				)
			);
		}
	};

	try {
		const response = await fetch(`/api/chats/${chatId}/gemini`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: userMessageContent }),
		});

		if (!response.ok || !response.body) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Failed to get stream'}`);
		}

		const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				console.log('Stream finished.');
				// Clear any pending timer and do a final update
				if (debounceTimer) clearTimeout(debounceTimer);
				updateStore(); // Ensure the very last part is displayed
				break;
			}

			textBuffer += value;
			accumulatedContent += value; // Keep track of the full content for DB save

			// Clear existing timer and set a new one
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(updateStore, debounceInterval);
		}

		// --- Save the complete bot message to DB ---
		// accumulatedContent should hold the final complete message here
		if (accumulatedContent) {
			console.log('Complete bot response received, saving to DB:', accumulatedContent);
			// Save the bot response to the database
            await addMessageClient(chatId, { role: 'assistant', content: accumulatedContent });
		}

	} catch (error) {
		// Clear timer on error as well
		if (debounceTimer) clearTimeout(debounceTimer);
		console.error(`Failed to get or process bot response stream for chat ${chatId}:`, error);
		const errorMessage: Message = {
			id: botMessageId, // Use the same temp ID or generate new
			role: 'assistant',
			content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
		};
        // Ensure error message is added or updated
        if (!messageAdded) {
            currentChatMessages.update(messages => [...messages, errorMessage]);
        } else {
            currentChatMessages.update(messages =>
                messages.map(msg => msg.id === botMessageId ? errorMessage : msg)
            );
        }
	}
}


export async function deleteChatClient(idToDelete: string) {
	let nextSelectedId: string | null = null;
	let originalSessions: ChatSession[] = [];
	chatSessions.update(sessions => {
		originalSessions = [...sessions];
		const deletedIndex = sessions.findIndex(session => session.id === idToDelete);
		if (deletedIndex === -1) return sessions;
		if (sessions.length > 1) {
			nextSelectedId = sessions[deletedIndex === sessions.length - 1 ? deletedIndex - 1 : deletedIndex + 1].id;
		}
		return sessions.filter(session => session.id !== idToDelete);
	});
	if (get(selectedChatId) === idToDelete) {
		selectChat(nextSelectedId);
	}
	try {
		const response = await fetch(`/api/chats/${idToDelete}`, { method: 'DELETE' });
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
		}
		console.log('Successfully deleted chat session on server:', idToDelete);
	} catch (error) {
		console.error(`Failed to delete chat ${idToDelete}:`, error);
		chatSessions.set(originalSessions);
		await loadChatSessions();
	}
}

export async function updateChatTitleClient(chatId: string, newTitle: string) {
	const trimmedTitle = newTitle.trim();
	if (!trimmedTitle) return;
	let originalTitle = '';
	chatSessions.update(sessions => {
		return sessions.map(session => {
			if (session.id === chatId) {
				originalTitle = session.title;
				return { ...session, title: trimmedTitle };
			}
			return session;
		});
	});
	try {
		const response = await fetch(`/api/chats/${chatId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: trimmedTitle }),
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
		}
		const updatedSession: ChatSession = await response.json();
		console.log('Successfully updated title on server:', updatedSession);
		chatSessions.update(sessions =>
			sessions.map(session => session.id === chatId ? updatedSession : session)
		);
	} catch (error) {
		console.error(`Failed to update title for chat ${chatId}:`, error);
		chatSessions.update(sessions =>
			sessions.map(session => session.id === chatId ? { ...session, title: originalTitle } : session)
		);
	}
}

// Define the type for the data sent to add a message
type AddMessageData = {
    role: 'user' | 'assistant';
    content: string;
};

// Updated addMessageClient: returns boolean, only does optimistic update for user messages
export async function addMessageClient(chatId: string, messageData: AddMessageData): Promise<boolean> {
	console.log(`addMessageClient called for chat ${chatId} with role: ${messageData.role}`);
	let optimisticMessage: Message | null = null;

	// Only perform optimistic update for user messages
	if (messageData.role === 'user') {
		optimisticMessage = {
			id: Date.now() + Math.random(),
			role: messageData.role,
			content: messageData.content
		};
		currentChatMessages.update(messages => [...messages, optimisticMessage!]);
	}

	try {
		const response = await fetch(`/api/chats/${chatId}/messages`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(messageData),
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const savedMessage: Message = await response.json();

		// If it was a user message, replace the optimistic one with the saved one
		if (optimisticMessage) {
			currentChatMessages.update(messages =>
				messages.map(msg => msg.id === optimisticMessage!.id ? savedMessage : msg)
			);
		}
		// If it was an assistant message, we don't need to update the store here,
		// as the streaming logic in getBotResponseClient already handled the UI updates.
		// We just needed to save it to the DB.

        return true; // Indicate success
	} catch (error) {
		console.error(`Failed to add message to chat ${chatId}:`, error);
		// Revert optimistic update only if it was performed (i.e., for user messages)
		if (optimisticMessage) {
			currentChatMessages.update(messages => messages.filter(msg => msg.id !== optimisticMessage!.id));
		}
        return false; // Indicate failure
	}
}

// Function to delete a specific message
export async function deleteMessageClient(chatId: string, messageId: number) {
	console.log(`[Delete Client] Start: Deleting message ${messageId} from chat ${chatId}`);
	let originalMessages: Message[] = [];
	let deletedMessage: Message | undefined;

	// Log state *before* optimistic update
	console.log('[Delete Client] Messages before optimistic update:', get(currentChatMessages).map(m => m.id));

	// Optimistic UI update
	currentChatMessages.update(messages => {
		originalMessages = [...messages]; // Store original state for potential revert
		deletedMessage = messages.find(msg => msg.id === messageId);
		const filteredMessages = messages.filter(msg => msg.id !== messageId);
		// Log state *after* optimistic update (inside the update function)
		console.log('[Delete Client] Messages after optimistic update (inside update):', filteredMessages.map(m => m.id));
		return filteredMessages;
	});

	// Log state *after* optimistic update (outside the update function)
	console.log('[Delete Client] Messages after optimistic update (outside update):', get(currentChatMessages).map(m => m.id));


	if (!deletedMessage) {
		console.warn(`[Delete Client] Message ${messageId} not found in store for optimistic deletion.`);
		console.log(`[Delete Client] End: Finished processing deletion for message ${messageId} (not found in store).`);
		return;
	}

	try {
		console.log(`[Delete Client] Calling API: DELETE /api/chats/${chatId}/messages/${messageId}`);
		const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
			method: 'DELETE',
		});
		console.log(`[Delete Client] API response status: ${response.status}`);

		if (!response.ok) {
			if (response.status === 404) {
				console.warn(`[Delete Client] API returned 404: Message ${messageId} not found on server.`);
				// Optimistic update was correct, no need to revert.
			} else {
				const errorData = await response.json().catch(() => ({}));
				console.error(`[Delete Client] API error: Status ${response.status}, Data:`, errorData);
				// Throw error to be caught by the catch block below
				throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Failed to delete'}`);
			}
		} else {
			console.log(`[Delete Client] API success: Message ${messageId} deleted on server.`);
			// Deletion successful. Explicitly reload messages to ensure consistency,
			// overriding any potentially stale list from automatic invalidation.
			console.log(`[Delete Client] Reloading messages for chat ${chatId} after successful delete.`);
			await loadMessagesForChat(chatId);
			// Log state after reloading post-success
        	console.log('[Delete Client] Messages after reloading post-success:', get(currentChatMessages).map(m => m.id));
		}

	} catch (error) {
		console.error(`[Delete Client] Catch block error: Failed to delete message ${messageId} for chat ${chatId}:`, error);
		// Revert optimistic update on failure (except for 404)
		console.log(`[Delete Client] Reloading messages for chat ${chatId} due to deletion error.`);
		await loadMessagesForChat(chatId);
		// Log state after reloading due to error
		console.log('[Delete Client] Messages after reloading due to error:', get(currentChatMessages).map(m => m.id));
	}
	console.log(`[Delete Client] End: Finished processing deletion for message ${messageId}`);
}
