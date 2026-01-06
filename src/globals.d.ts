/**
 * Global type declarations for Cloudflare Workers
 */

declare global {
  const console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
  };

  function fetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response>;
}

export {};







