/**
 * API Utility Functions
 * Helper functions for making API calls
 */

import { getApiUrl } from "../core/config.js";

/**
 * Make a fetch request to the API
 * Automatically uses the correct base URL
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint, { method: "GET" });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Make a PUT request to the API
 */
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Make a DELETE request to the API
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint, { method: "DELETE" });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return await response.json();
}
