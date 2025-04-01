<script lang="ts">
	import { marked } from 'marked'; // Import marked library
	import { onMount } from 'svelte'; // Import onMount for potential client-side only parsing if needed

	// Use export let for props instead of $props() rune
	export let role: 'user' | 'assistant';
	export let content: string;

	console.log('MessageBubble received props (export let):', { role, content });

	// Parse markdown content to HTML
	// Use Promise.resolve to handle potential async nature of marked or extensions
	let parsedContent = Promise.resolve(marked.parse(content || '') as string);

	// Re-parse if content prop changes (though usually messages are immutable)
	$: if (content) {
		parsedContent = Promise.resolve(marked.parse(content) as string);
	}

	// Determine alignment and color based on role
	const isUser = role === 'user';
</script>

<div class:text-right={isUser}>
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
