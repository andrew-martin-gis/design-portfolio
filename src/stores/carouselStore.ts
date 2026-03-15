import { writable } from 'svelte/store';

export const activeAppIndex = writable<number>(0);
