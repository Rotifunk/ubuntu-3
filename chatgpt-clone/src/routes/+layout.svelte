<script lang="ts">
	import '../app.css'; // Tailwind CSS is imported here via app.css
	import Sidebar from '$lib/components/Sidebar.svelte'; // Revert to default import
	import { chatSessions, selectedChatId, selectChat, type ChatSession } from '$lib/stores/chatStore'; // Import selectChat function
	import { get } from 'svelte/store'; // Import the 'get' function
	// Removed effect import, will use $effect rune directly

	// Define the type for the data prop based on +layout.server.ts return type
	// Ensure this matches the return type in +layout.server.ts, including createdAt
	type LoadData = {
		chatSessions: Pick<ChatSession, 'id' | 'title' | 'createdAt'>[];
	};
	let { data, children }: { data: LoadData; children: any } = $props(); // Type the props
	let initialized = false; // Flag to track initialization

	// Use $effect rune to initialize stores based on loaded data ONCE
	$effect(() => {
		if (!initialized) {
			const loadedSessions = data.chatSessions || [];
			console.log('Layout effect: Initializing chatSessions store with loaded data:', loadedSessions);
			chatSessions.set(loadedSessions);

			// Ensure selectedChatId is valid based on loaded sessions and trigger message loading
			const currentSelected = get(selectedChatId); // Use get() here as we are setting based on initial load
			if (currentSelected && !loadedSessions.some(s => s.id === currentSelected)) {
				// If current selection is no longer valid, select the first available and load its messages
				console.log('Layout effect: Invalid chat selected, selecting first available.');
				selectChat(loadedSessions[0]?.id ?? null);
			} else if (!currentSelected && loadedSessions.length > 0) {
				// If nothing is selected but sessions exist, select the first one and load its messages
				console.log('Layout effect: No chat selected, selecting first available.');
				selectChat(loadedSessions[0].id);
			}
			// If a valid chat was already selected (e.g., from previous state), do nothing here,
            // assuming its messages were loaded previously or will be loaded by other means if needed.
			initialized = true; // Mark as initialized
		}
		// After initialization, this effect will still run if 'data' changes,
		// but it won't call chatSessions.set() again, preserving optimistic updates.
		// We might need more sophisticated logic if server data *needs* to overwrite the store later,
		// but for optimistic updates, this prevents the overwrite.

		// Example: If you needed to handle server-side changes *after* init, you might compare:
		// const loadedSessions = data.chatSessions || [];
		// const currentStoreSessions = get(chatSessions);
		// if (JSON.stringify(loadedSessions) !== JSON.stringify(currentStoreSessions) && initialized) {
		//    console.log("Server data changed, potentially merging or resetting store...");
		//    // Decide how to merge or reset based on application logic
		// }

		// REMOVED: Post-initialization selection logic.
		// This logic was causing issues with race conditions when adding new chats.
		// Selection changes should now be handled explicitly within the store functions
		// like addNewChatClient and deleteChatClient.
	});

</script>

<div class="flex h-screen bg-gray-900 text-white">
	<!-- Pass loaded sessions to Sidebar if needed, or let Sidebar use the store -->
	<Sidebar />

	<!-- Main Content Area -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<!-- Header (optional) -->
		<!-- <header class="bg-gray-700 p-4 shadow-md">Header</header> -->

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
