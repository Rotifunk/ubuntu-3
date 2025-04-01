<script lang="ts">
	import { onMount } from 'svelte';
	import { selectedChatId, currentChatMessages, addMessageClient, getBotResponseClient } from '$lib/stores/chatStore';
	import InputField from './InputField.svelte';
	import MessageBubble from './MessageBubble.svelte';
	import type { Message } from '$lib/stores/chatStore'; // Import the correct Message type

	let chatContainerElement: HTMLDivElement | null = null;
	let shouldScroll = true;
	let isBotResponding = false; // Used for the "Bot is typing..." indicator
	let lastMessageCount = 0;

	// Make handleSendMessage async to await addMessageClient
	async function handleSendMessage(event: CustomEvent<string>) {
		console.log('handleSendMessage called with:', event.detail); // Log when function is called
		shouldScroll = true;
		const currentChatId = $selectedChatId;
		if (!currentChatId) return;
		const newMessageText = event.detail;

		// Call addMessageClient and wait for its result (true if successful)
		const messageAdded = await addMessageClient(currentChatId, { role: 'user', content: newMessageText });

		// Only proceed to get bot response if user message was added successfully
		if (messageAdded) {
			isBotResponding = true; // Show "Bot is typing..."
			shouldScroll = true; // Ensure scroll happens after potential optimistic update

			try {
				// Call the function to get the actual bot response from the server
				await getBotResponseClient(currentChatId, newMessageText);
				// Bot response added successfully by getBotResponseClient (which updates the store)
			} catch (error) {
				// Error handling (like adding an error message to the chat) is done within getBotResponseClient
				console.error("Error during bot response streaming:", error);
			} finally {
				isBotResponding = false; // Hide "Bot is typing..." when streaming finishes or errors out
				shouldScroll = true; // Ensure scroll after bot response is fully rendered
			}
		} else {
            // Handle case where adding user message failed
            console.error("Failed to add user message to the database.");
            // Potentially show an error message in the UI
            isBotResponding = false; // Ensure indicator is hidden if add failed
        }
	}

	function handleScroll() {
		if (!chatContainerElement) return;
		const isScrolledToBottom = chatContainerElement.scrollHeight - chatContainerElement.scrollTop <= chatContainerElement.clientHeight + 50;
		if (!isScrolledToBottom) {
			shouldScroll = false;
		} else {
			shouldScroll = true;
		}
	}

    onMount(() => {
    });

	// Restore $effect, but only keep the scroll logic
	$effect(() => {
		const messages = $currentChatMessages;
		// console.log('ChatArea $currentChatMessages updated:', messages); // Keep this commented out

		// Scroll logic remains the same, reacting to message additions
		if (chatContainerElement && shouldScroll && messages.length > lastMessageCount) {
			setTimeout(() => {
				if (!chatContainerElement) return;
				const lastMessageElement = chatContainerElement.querySelector('.message-bubble:last-child');
				if (lastMessageElement) {
					lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
				} else {
					chatContainerElement.scrollTop = chatContainerElement.scrollHeight;
				}
			}, 0);
		}
		lastMessageCount = messages.length;
	});
	// End of restored $effect block

</script>

<div class="flex flex-col h-full bg-gray-900">
	<!-- Message List Area - Use the derived store directly -->
	<div
		class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
		bind:this={chatContainerElement}
		on:scroll={handleScroll}
	>
		{#if $currentChatMessages.length > 0}
			{#each $currentChatMessages as message (message.id)}
				<div class="message-bubble">
					<MessageBubble
						role={message.role}
						content={message.content}
					/>
				</div>
			{/each}
		{:else if !$selectedChatId}
			<p class="text-gray-400 text-center mt-4">Select a chat or start a new one.</p>
		{:else}
			<p class="text-gray-400 text-center mt-4">Send a message to start the conversation!</p>
		{/if}

		<!-- Bot typing indicator -->
		{#if isBotResponding}
			<div class="p-4 text-center text-gray-400 text-sm">
				Bot is typing...
			</div>
		{/if}
	</div>

	<!-- Input Field Area -->
	<InputField on:send={handleSendMessage} />
</div>
