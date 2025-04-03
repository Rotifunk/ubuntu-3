<script lang="ts">
	import { marked } from 'marked'; // Import marked library
	import { onMount } from 'svelte'; // Import onMount for potential client-side only parsing if needed
	import { deleteMessageClient, selectedChatId } from '$lib/stores/chatStore';
	import { get } from 'svelte/store';

	// Use export let for props instead of $props() rune
	export let role: 'user' | 'assistant';
	export let content: string;
	export let messageId: number; // Add messageId prop

	console.log('MessageBubble received props (export let):', { role, content, messageId }); // Log messageId too

	// Parse markdown content to HTML
	// Use Promise.resolve to handle potential async nature of marked or extensions
	let parsedContent = Promise.resolve(marked.parse(content || '') as string);

	// Re-parse if content prop changes (though usually messages are immutable)
	$: if (content) {
		parsedContent = Promise.resolve(marked.parse(content) as string);
	}

	// Determine alignment and color based on role
	const isUser = role === 'user';

	function handleDelete() {
		const currentChatId = get(selectedChatId);
		if (!currentChatId) {
			console.error('Cannot delete message: No chat selected.');
			return;
		}
		// Optional: Add confirmation dialog
		if (window.confirm('Are you sure you want to delete this message?')) {
			deleteMessageClient(currentChatId, messageId);
		}
	}
</script>

<div class="group relative {isUser ? 'text-right' : ''}"> <!-- Combined class and class: directive -->
	<div
		class={`message-content inline-block p-3 rounded-lg max-w-xl text-white ${
			isUser ? 'bg-blue-600' : 'bg-gray-700'
		}`}
	>
		{#await parsedContent}
			<p class="text-sm">Loading...</p> <!-- Optional loading state -->
		{:then htmlContent}
			<!-- Render the parsed HTML content -->
			<!-- Use a container div for styling markdown elements -->
			<div class="prose prose-sm prose-invert max-w-none">
				{@html htmlContent}
			</div>
		{:catch error}
			<p class="text-sm text-red-400">Error parsing markdown: {error.message}</p>
			<pre class="text-xs whitespace-pre-wrap">{content}</pre> <!-- Show raw content on error -->
		{/await}
	</div>
	<!-- Delete Button - appears on hover -->
	<button
		onclick={handleDelete}
		class="absolute top-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
		class:right-0={isUser}
		class:left-0={!isUser}
		aria-label="Delete message"
		title="Delete message"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	</button>
</div>

<style>
	/* Add custom styles for markdown elements if needed */
	.message-content :global(pre) {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.5rem;
		border-radius: 0.25rem;
		overflow-x: auto;
	}
    .message-content :global(code) {
        font-size: 0.875em; /* Adjust code font size */
    }
    /* Ensure prose styles don't override basic bubble layout */
    .prose {
        max-width: none; /* Override default prose max-width */
    }
</style>
