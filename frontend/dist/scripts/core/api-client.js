/**
 * API Client - Centralized API communication layer
 */
import { getApiBaseUrl } from "./config.js";
export class ApiClient {
    baseUrl;
    constructor(baseUrl) {
        // Use provided baseUrl, or get from config
        this.baseUrl = baseUrl ?? getApiBaseUrl();
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const error = await response.json();
                errorMessage = error.message || errorMessage;
            }
            catch {
                // If JSON parsing fails, use default message
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    }
    async get(endpoint) {
        return this.request(endpoint, { method: "GET" });
    }
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: "DELETE" });
    }
}
// Export singleton instance
// Will automatically use the baseUrl from config
export const apiClient = new ApiClient();
//# sourceMappingURL=api-client.js.map