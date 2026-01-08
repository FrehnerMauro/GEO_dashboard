/**
 * DOM Utilities
 */

export function showElement(element: HTMLElement | null): void {
  if (element) {
    element.style.display = "block";
  }
}

export function hideElement(element: HTMLElement | null): void {
  if (element) {
    element.style.display = "none";
  }
}

export function getElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}

