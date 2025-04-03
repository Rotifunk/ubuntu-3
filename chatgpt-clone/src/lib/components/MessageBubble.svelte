<script lang="ts">
	import { marked } from 'marked'; // Import marked library
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import python from 'highlight.js/lib/languages/python';
	import css from 'highlight.js/lib/languages/css';
	import xml from 'highlight.js/lib/languages/xml'; // For HTML
	import bash from 'highlight.js/lib/languages/bash';
	import { onMount } from 'svelte'; // Import onMount for potential client-side only parsing if needed
	import { deleteMessageClient, selectedChatId } from '$lib/stores/chatStore';
	import { get } from 'svelte/store';

	// Register highlight.js languages
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('xml', xml); // HTML
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('plaintext', (hljs) => ({ // Explicit plaintext
	  name: 'Plain text',
	  aliases: ['text'],
	  disableAutodetect: true,
	  contains: []
	}));


	// Configure marked to use highlight.js
	const highlight = (code: string, lang: string) => {
	  const language = hljs.getLanguage(lang) ? lang : 'plaintext';
	  try {
	    // Use highlightAuto for automatic detection if lang is not provided or invalid,
	    // but prefer explicit language if available.
	    const result = language === 'plaintext' && !lang // If explicitly plaintext or no lang hint
	      ? hljs.highlight(code, { language: 'plaintext', ignoreIllegals: true })
	      : hljs.getLanguage(lang) // If lang hint is valid
	        ? hljs.highlight(code, { language, ignoreIllegals: true })
	        : hljs.highlightAuto(code); // Fallback to auto-detect if lang hint invalid

	    // Add the language class for CSS styling
	    return `<pre><code class="hljs ${result.language}">${result.value}</code></pre>`;
	  } catch (e) {
	    console.error(`Highlighting error for lang ${lang}:`, e);
	    // Fallback to plaintext highlighting on error
	    const fallbackResult = hljs.highlight(code, { language: 'plaintext', ignoreIllegals: true });
	    return `<pre><code class="hljs plaintext">${fallbackResult.value}</code></pre>`;
	  }
	};

	// Override the default renderer for code blocks
	const renderer = new marked.Renderer();
	// Adjust signature to match marked's expected type and add explicit types
	renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
	  // Marked might pass 'undefined' or an empty string if no language is specified
	  const language = lang || 'plaintext';
	  return highlight(text, language); // Use our highlight function with text and determined language
	};

	// Set options for marked globally or pass them to parse
	// Passing to parse is generally safer in component context
	const markedOptions = {
	  renderer: renderer,
	  pedantic: false,
	  gfm: true,
	  breaks: false,
	  sanitize: false,
	  smartLists: true,
	  smartypants: false,
	  xhtml: false
	};

	// Use export let for props instead of $props() rune
	export let role: 'user' | 'assistant';
	export let content: string;
	export let messageId: number; // Add messageId prop

	console.log('MessageBubble received props (export let):', { role, content, messageId }); // Log messageId too

	// Parse markdown content to HTML using the configured options
	let parsedContent = Promise.resolve(marked.parse(content || '', markedOptions) as string);

	// Re-parse if content prop changes
	$: if (content) {
		parsedContent = Promise.resolve(marked.parse(content, markedOptions) as string);
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

<!-- Removed conditional text-right alignment for the container -->
<div class="group relative">
	<div
		class={`message-content inline-block p-3 rounded-lg max-w-4xl text-white ${ // Increased max-width
			isUser ? 'bg-[#3a312a]' : 'bg-[#2a221a]' // User: #3a312a, Assistant: #2a221a (slightly darker than chat area)
		}`}
	>
		{#await parsedContent}
			<p class="text-sm">Loading...</p> <!-- Optional loading state -->
		{:then htmlContent}
			<!-- Render the parsed HTML content -->
			<!-- Use a container div for styling markdown elements -->
			<!-- Changed prose-sm to prose-base for larger text -->
			<!-- Applied custom text color -->
			<div class="prose prose-base prose-invert max-w-none text-[#d7c0a3] prose-strong:text-[#b08354]">
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
		class="absolute top-0 right-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
		aria-label="Delete message"
		title="Delete message"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
	</button>
</div>

<style>
	/* Remove default prose pre/code styling as highlight.js handles it */
	/* Keep the overflow style */
	.message-content :global(pre) {
		overflow-x: auto;
		background-color: #0d1117;
		/* padding: 0; Remove padding, let hljs theme handle it */
		border-radius: 0.65rem; /* Keep or adjust radius */
	}
	/* Remove prose code styling */
    /* .message-content :global(code) { */
        /* font-size: 0.875em; Let hljs theme handle font size */
    /* } */

    /* Ensure prose styles don't override basic bubble layout */
    .prose {
        max-width: none; /* Override default prose max-width */
    }
</style>
