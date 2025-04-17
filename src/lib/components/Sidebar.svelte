<script lang="ts">
	import {
		chatSessions,
		addNewChatClient,
		selectChat,
		selectedChatId,
		deleteChatClient,
		updateChatTitleClient
	} from '$lib/stores/chatStore';
	import { isMobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen } from '$lib/stores/sidebarStore';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { slide } from 'svelte/transition'; // Using slide for mobile overlay
	import { Menu, X, Trash2, Pencil, Plus, MessageSquare, List } from 'lucide-svelte'; // Import List icon

	// State for desktop hover effect
	let isDesktopHoverOpen = false;

	// State for inline editing
	let editingChatId: string | null = null;
	let editText = '';
	let inputElement: HTMLInputElement | null = null;

	// --- Event Handlers ---

	function handleAddNewChat() {
		addNewChatClient();
		setMobileSidebarOpen(false); // Close mobile sidebar after adding
	}

	function handleSelectChat(id: string) {
		if (editingChatId !== id) {
			selectChat(id);
			setMobileSidebarOpen(false); // Close mobile sidebar after selection
		}
	}

	function startEditing(event: MouseEvent, chat: { id: string; title: string }) {
		event.stopPropagation(); // Prevent chat selection
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
		event.stopPropagation(); // Prevent chat selection
		const chatTitle = $chatSessions.find((c) => c.id === chatId)?.title ?? 'this chat';
		if (confirm(`Are you sure you want to delete "${chatTitle}"?`)) {
			deleteChatClient(chatId);
			// No need to close mobile sidebar here, deleteChatClient handles selection change
		}
	}

	// Reactive calculation for desktop sidebar width
	$: desktopSidebarWidth = isDesktopHoverOpen ? 'w-64' : 'w-16'; // 64px ~ 4rem, 256px ~ 16rem
</script>

<!-- Mobile Header & Menu Button -->
<div
	class="sticky top-0 z-30 h-14 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-[#26211c] border-b border-neutral-700 w-full"
>
	<span class="font-semibold text-neutral-200">ChatGPT Clone</span>
	<button onclick={toggleMobileSidebar} aria-label="Open sidebar">
		<Menu class="text-neutral-200 cursor-pointer h-6 w-6" />
	</button>
</div>

<!-- Mobile Sidebar Overlay -->
{#if $isMobileSidebarOpen}
	<div
		transition:slide={{ duration: 300, axis: 'x' }}
		class="fixed h-full w-full inset-0 bg-[#26211c] p-6 z-[100] flex flex-col justify-between md:hidden"
		role="dialog"
		aria-modal="true"
	>
		<button
			class="absolute right-6 top-6 z-50 text-neutral-200 cursor-pointer"
			onclick={() => setMobileSidebarOpen(false)}
			aria-label="Close sidebar"
		>
			<X class="h-6 w-6" />
		</button>

		<div class="flex flex-col flex-1 overflow-y-auto">
			<h2 class="text-xl font-semibold mb-4 text-neutral-200">Chats</h2>
			<div class="flex-1 space-y-1 overflow-y-auto mb-4">
				{#each $chatSessions as chat (chat.id)}
					<div
						class={cn(
							'group flex items-center justify-between p-2 rounded cursor-pointer text-neutral-200',
							$selectedChatId === chat.id
								? 'bg-neutral-700 hover:bg-neutral-700'
								: 'hover:bg-neutral-600'
						)}
						onclick={() => handleSelectChat(chat.id)}
						title={chat.title}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && handleSelectChat(chat.id)}
					>
						{#if editingChatId === chat.id}
							<input
								bind:this={inputElement}
								type="text"
								bind:value={editText}
								onkeydown={handleEditKeydown}
								onblur={saveEdit}
								class="flex-1 bg-neutral-600 text-white px-1 py-0 rounded mr-2 focus:outline-none focus:ring-1 focus:ring-[#c96442] text-sm"
								onclick={(e: MouseEvent) => e.stopPropagation()}
							/>
						{:else}
							<MessageSquare class="h-4 w-4 mr-2 flex-shrink-0 text-neutral-400" />
							<span class="flex-1 truncate mr-2 text-sm">{chat.title}</span>
							<div class="flex items-center flex-shrink-0">
								<button
									class="text-neutral-400 hover:text-white p-1"
									onclick={(e) => startEditing(e, chat)}
									title="Edit title"
									aria-label="Edit chat title"
								>
									<Pencil class="w-4 h-4" />
								</button>
								<button
									class="text-neutral-400 hover:text-red-500 p-1 -mr-1"
									onclick={(e) => handleDelete(e, chat.id)}
									title="Delete chat"
									aria-label="Delete chat"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-neutral-400 text-sm text-center mt-4">No chats yet.</p>
				{/each}
			</div>
		</div>

		<button
			class="w-full bg-[#c96442] hover:bg-[#a95436] text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
			onclick={handleAddNewChat}
		>
			<Plus class="w-5 h-5" /> New Chat
		</button>
	</div>
{/if}

<!-- Desktop Sidebar -->
<div
	class={cn(
		'hidden md:flex md:flex-col h-screen flex-shrink-0 bg-[#26211c] p-4 transition-all duration-300 ease-in-out border-r border-neutral-700',
		desktopSidebarWidth
	)}
	onmouseenter={() => (isDesktopHoverOpen = true)}
	onmouseleave={() => (isDesktopHoverOpen = false)}
	role="region"
	aria-label="Desktop Sidebar"
>
	<div class="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
		<div class="mb-4 h-8 flex items-center">
			{#if isDesktopHoverOpen}
				<span class="font-semibold text-xl text-neutral-200 whitespace-nowrap">CHATS</span>
			{:else}
				<List class="h-6 w-6 text-neutral-200 mx-auto" />
			{/if}
		</div>

		<div class="flex-1 space-y-1 mb-4">
			{#each $chatSessions as chat (chat.id)}
				<div
					class={cn(
						'group flex items-center justify-between p-2 rounded cursor-pointer text-neutral-200',
						$selectedChatId === chat.id
								? 'bg-neutral-700 hover:bg-neutral-700'
								: 'hover:bg-neutral-600'
						)}
						onclick={() => handleSelectChat(chat.id)}
						title={chat.title}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && handleSelectChat(chat.id)}
					>
						{#if editingChatId === chat.id}
							{#if isDesktopHoverOpen}
								<input
									bind:this={inputElement}
									type="text"
									bind:value={editText}
									onkeydown={handleEditKeydown}
									onblur={saveEdit}
									class="flex-1 bg-neutral-600 text-white px-1 py-0 rounded mr-2 focus:outline-none focus:ring-1 focus:ring-[#c96442] text-sm"
									onclick={(e: MouseEvent) => e.stopPropagation()}
								/>
							{/if}
						{:else}
							<MessageSquare class="h-4 w-4 mr-2 flex-shrink-0 text-neutral-400" />
							{#if isDesktopHoverOpen}
								<span class="flex-1 truncate mr-2 text-sm">{chat.title}</span>
								<div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
									<button
										class="text-neutral-400 hover:text-white p-1"
										onclick={(e) => startEditing(e, chat)}
										title="Edit title"
										aria-label="Edit chat title"
									>
										<Pencil class="w-4 h-4" />
									</button>
									<button
										class="text-neutral-400 hover:text-red-500 p-1 -mr-1"
										onclick={(e) => handleDelete(e, chat.id)}
										title="Delete chat"
										aria-label="Delete chat"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							{/if}
						{/if}
					</div>
				{:else}
					{#if isDesktopHoverOpen}
						<p class="text-neutral-400 text-sm text-center mt-4">No chats yet.</p>
					{/if}
				{/each}
			</div>
		</div>

	<button
		class={cn(
			'w-full bg-[#c96442] hover:bg-[#a95436] text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-all duration-300 ease-in-out',
			!isDesktopHoverOpen && 'px-0'
		)}
		onclick={handleAddNewChat}
	>
		<Plus class="w-5 h-5 flex-shrink-0" />
		{#if isDesktopHoverOpen}
			<span class="whitespace-nowrap">New Chat</span>
		{/if}
	</button>
</div>
