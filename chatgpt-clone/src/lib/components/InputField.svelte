<script lang="ts">
	import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
	import { selectedChatId } from '$lib/stores/chatStore'; // Import selectedChatId
	import { browser } from '$app/environment'; // Import browser check

	let message = '';
	const dispatch = createEventDispatcher<{ send: string }>();
	let textareaElement: HTMLTextAreaElement;

	function adjustHeight() {
		if (!textareaElement) return;
		textareaElement.style.height = 'auto'; // Reset height
		// Add a minimum height based on one line's scrollHeight
		const minHeight = textareaElement.scrollHeight;
		textareaElement.style.height = `${minHeight}px`; // Set initial height

		// Now calculate actual scroll height with content
		textareaElement.style.height = 'auto'; // Reset again
		textareaElement.style.height = `${textareaElement.scrollHeight}px`; // Set to content height
	}

	onMount(() => {
		// Ensure the element exists before adjusting height
		if (textareaElement) {
			setTimeout(adjustHeight, 0); // Use timeout to ensure accurate initial calculation
		}
	});

    // Adjust height when message is cleared after sending
	afterUpdate(() => {
		if (textareaElement && message === '') {
            // Reset to minimum height when cleared
            textareaElement.style.height = 'auto';
            const initialRows = textareaElement.rows;
            textareaElement.rows = 1;
            const minHeight = textareaElement.scrollHeight;
            textareaElement.rows = initialRows;
            textareaElement.style.height = `${minHeight}px`;
		}
	});

	function sendMessage() {
		const trimmedMessage = message.trim();
		if (!trimmedMessage) return;
		dispatch('send', trimmedMessage);
		message = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

    function handleInput() {
        adjustHeight();
    }

	// Focus textarea when selected chat changes
	$: if (browser && textareaElement && $selectedChatId) {
		// Check browser to avoid errors during SSR if applicable
		// Timeout helps ensure focus happens after potential DOM updates related to chat switch
		setTimeout(() => textareaElement.focus(), 50); // Small delay
	}
</script>

<!-- Input Field Area -->
<div class="p-4 border-t border-gray-700 bg-gray-900">
	<div class="bg-gray-700 rounded-lg p-2 flex items-end">
		<textarea
			bind:this={textareaElement}
			placeholder="Send a message..."
			class="flex-1 bg-transparent focus:outline-none px-2 text-white resize-none overflow-y-hidden max-h-40"
			bind:value={message}
			on:input={handleInput}
			on:keydown={handleKeydown}
			rows="1"
		></textarea>
		<button
            class="ml-2 text-gray-400 hover:text-white disabled:opacity-50 self-end mb-1"
            on:click={sendMessage}
            disabled={!message.trim()}
        >
			<!-- Send Icon -->
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
			</svg>
		</button>
	</div>
</div>
