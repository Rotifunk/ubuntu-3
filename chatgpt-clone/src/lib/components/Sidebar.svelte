<script lang="ts">
	import { chatSessions, addNewChatClient, selectChat, selectedChatId, deleteChatClient, updateChatTitleClient } from '$lib/stores/chatStore';
	import { tick } from 'svelte';

	let editingChatId: string | null = null;
	let editText = '';
	let inputElement: HTMLInputElement | null = null;

	function startEditing(event: MouseEvent, chat: { id: string; title: string }) {
		event.stopPropagation();
		editingChatId = chat.id;
		editText = chat.title;
		tick().then(() => {
			inputElement?.focus();
			inputElement?.select();
		});
	}

	function saveEdit() {
		if (editingChatId && editText.trim()) {
			updateChatTitleClient(editingChatId, editText);
		}
		cancelEdit();
	}

	function cancelEdit() {
		editingChatId = null;
		editText = '';
	}

	function handleEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveEdit();
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}

	function handleDelete(event: MouseEvent, chatId: string) {
		event.stopPropagation();
		const chatTitle = $chatSessions.find(c => c.id === chatId)?.title ?? 'this chat';
		if (confirm(`Are you sure you want to delete "${chatTitle}"?`)) {
			deleteChatClient(chatId);
		}
	}
</script>

<!-- Sidebar -->
<div class="w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col h-full">
	<h2 class="text-xl font-semibold mb-4 text-white">Chats</h2>

	<div class="flex-1 space-y-1 overflow-y-auto mb-4">
		{#each $chatSessions as chat (chat.id)}
			<div
				class={`group flex items-center justify-between p-2 rounded cursor-pointer text-white ${
					$selectedChatId === chat.id ? 'bg-gray-700 hover:bg-gray-700' : 'hover:bg-gray-600'
				}`}
				onclick={() => editingChatId !== chat.id && selectChat(chat.id)}
				title={chat.title}
			>
				{#if editingChatId === chat.id}
					<input
						bind:this={inputElement}
						type="text"
						bind:value={editText}
						onkeydown={handleEditKeydown}
						onblur={saveEdit}
						class="flex-1 bg-gray-600 text-white px-1 py-0 rounded mr-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
						onclick={(e: MouseEvent) => e.stopPropagation()}
					/>
				{:else}
					<span class="flex-1 truncate mr-2 text-sm">{chat.title}</span>
					<div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
						<button
							class="text-gray-400 hover:text-white p-1"
							onclick={(e) => startEditing(e, chat)}
							title="Edit title"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
							</svg>
						</button>
						<button
							class="text-gray-400 hover:text-red-500 p-1 -mr-1"
							onclick={(e) => handleDelete(e, chat.id)}
							title="Delete chat"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
							</svg>
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-gray-400 text-sm text-center mt-4">No chats yet.</p>
		{/each}
	</div>

	<button
		class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
		onclick={() => addNewChatClient()}
	>
		+ New Chat
	</button>
</div>
