"use client";

// Simple module-level storage for the current abort controller
let currentAbortController: AbortController | null = null;

export const streamController = {
  set: (controller: AbortController | null) => {
    currentAbortController = controller;
  },

  get: () => currentAbortController,

  abort: () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      return true;
    }
    return false;
  },

  clear: () => {
    currentAbortController = null;
  },
};
