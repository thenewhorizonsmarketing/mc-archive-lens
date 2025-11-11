/**
 * Network Blocker Utility
 * Ensures the kiosk operates 100% offline by blocking external network requests
 */

export class NetworkBlocker {
  private static instance: NetworkBlocker;
  private isProduction: boolean;
  private blockedRequests: string[] = [];

  private constructor() {
    this.isProduction = import.meta.env.PROD;
  }

  public static getInstance(): NetworkBlocker {
    if (!NetworkBlocker.instance) {
      NetworkBlocker.instance = new NetworkBlocker();
    }
    return NetworkBlocker.instance;
  }

  /**
   * Initialize network blocking for offline operation
   */
  public initialize(): void {
    if (!this.isProduction) {
      console.log('[NetworkBlocker] Running in development mode - network blocking disabled');
      return;
    }

    console.log('[NetworkBlocker] Initializing offline mode...');

    // Override fetch to block external requests
    this.blockFetch();

    // Override XMLHttpRequest to block external requests
    this.blockXHR();

    // Block WebSocket connections
    this.blockWebSocket();

    // Monitor and log any blocked requests
    this.setupMonitoring();

    console.log('[NetworkBlocker] Offline mode active - all external requests blocked');
  }

  private blockFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (this.isExternalRequest(url)) {
        this.logBlockedRequest('fetch', url);
        return Promise.reject(new Error(`[NetworkBlocker] Blocked external fetch request: ${url}`));
      }

      return originalFetch(input, init);
    };
  }

  private blockXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      const urlString = typeof url === 'string' ? url : url.href;

      if (NetworkBlocker.getInstance().isExternalRequest(urlString)) {
        NetworkBlocker.getInstance().logBlockedRequest('XHR', urlString);
        throw new Error(`[NetworkBlocker] Blocked external XHR request: ${urlString}`);
      }

      return originalOpen.call(this, method, url, async, username, password);
    };
  }

  private blockWebSocket(): void {
    const OriginalWebSocket = window.WebSocket;

    (window as any).WebSocket = function(url: string | URL, protocols?: string | string[]): WebSocket {
      const urlString = typeof url === 'string' ? url : url.href;

      if (NetworkBlocker.getInstance().isExternalRequest(urlString)) {
        NetworkBlocker.getInstance().logBlockedRequest('WebSocket', urlString);
        throw new Error(`[NetworkBlocker] Blocked WebSocket connection: ${urlString}`);
      }

      return new OriginalWebSocket(url, protocols);
    };
  }

  private isExternalRequest(url: string): boolean {
    // Allow local file:// protocol
    if (url.startsWith('file://')) {
      return false;
    }

    // Allow data URLs
    if (url.startsWith('data:')) {
      return false;
    }

    // Allow blob URLs
    if (url.startsWith('blob:')) {
      return false;
    }

    // Allow relative URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ws://') && !url.startsWith('wss://')) {
      return false;
    }

    // Allow localhost in development (shouldn't reach here in production)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return false;
    }

    // Block all other external requests
    return true;
  }

  private logBlockedRequest(type: string, url: string): void {
    this.blockedRequests.push(`[${type}] ${url}`);
    console.warn(`[NetworkBlocker] Blocked ${type} request:`, url);
  }

  private setupMonitoring(): void {
    // Log blocked requests summary every 60 seconds
    setInterval(() => {
      if (this.blockedRequests.length > 0) {
        console.warn(
          `[NetworkBlocker] Blocked ${this.blockedRequests.length} external requests in the last minute`
        );
        this.blockedRequests = [];
      }
    }, 60000);
  }

  /**
   * Get statistics about blocked requests
   */
  public getStats(): { blockedCount: number; blockedRequests: string[] } {
    return {
      blockedCount: this.blockedRequests.length,
      blockedRequests: [...this.blockedRequests],
    };
  }
}

// Initialize network blocker on module load
export const initializeNetworkBlocker = (): void => {
  NetworkBlocker.getInstance().initialize();
};
