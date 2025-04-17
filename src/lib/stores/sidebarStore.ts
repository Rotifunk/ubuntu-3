import { writable } from 'svelte/store';

// Store to manage the mobile sidebar overlay's open/closed state
export const isMobileSidebarOpen = writable(false); // Default to closed

// Functions to control the mobile sidebar state
export function toggleMobileSidebar() {
	isMobileSidebarOpen.update((open) => !open);
}

export function setMobileSidebarOpen(isOpen: boolean) {
	isMobileSidebarOpen.set(isOpen);
}
