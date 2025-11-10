import { getApiUrl } from '../config';

// API Client with configurable endpoint
class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // System
  async getSystemStatus() {
    return this.request<{
      node_running: boolean;
      uptime: string;
      peers: number;
      repos: number;
    }>('/api/system/status');
  }

  // Node
  async startNode() {
    return this.request<{ success: boolean; output: string }>('/api/node/start', {
      method: 'POST',
    });
  }

  async stopNode() {
    return this.request<{ success: boolean; output: string }>('/api/node/stop', {
      method: 'POST',
    });
  }

  // Repositories
  async listRepos() {
    return this.request<{
      repos: Array<{
        name: string;
        rid: string;
        visibility: string;
        head: string;
        description: string;
      }>;
    }>('/api/repos');
  }

  async initRepo(data: { path: string; name: string; description: string; visibility: string }) {
    return this.request<{ success: boolean; output: string }>('/api/repos/init', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cloneRepo(data: { rid: string; seed?: string; path?: string }) {
    return this.request<{ success: boolean; output: string }>('/api/repos/clone', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async pushRepo(data: { path: string }) {
    return this.request<{ success: boolean; output: string }>('/api/repos/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async pullRepo(data: { path: string }) {
    return this.request<{ success: boolean; output: string }>('/api/repos/pull', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Friends
  async listFriends(repoPath: string) {
    return this.request<{
      friends: Array<{
        name: string;
        nid: string;
        status: string;
        repos: number;
      }>;
    }>(`/api/friends?repoPath=${encodeURIComponent(repoPath)}`);
  }

  async addFriend(data: { name: string; nid: string; repoPath: string }) {
    return this.request<{ success: boolean; output: string }>('/api/friends/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeFriend(name: string, repoPath: string) {
    return this.request<{ success: boolean; output: string }>(
      `/api/friends/${name}?repoPath=${encodeURIComponent(repoPath)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async pushToFriend(data: { friendName: string; repoPath: string }) {
    return this.request<{ success: boolean; output: string }>('/api/friends/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async pullFromFriend(data: { friendName: string; repoPath: string }) {
    return this.request<{ success: boolean; output: string }>('/api/friends/pull', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncWithFriends(data: { friendName?: string; repoPath: string }) {
    return this.request<{ success: boolean; output: string }>('/api/friends/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cost
  async getCostMetrics() {
    return this.request<{
      compute: number;
      storage: number;
      egress: number;
      total: number;
      history: any[];
    }>('/api/cost/metrics');
  }
}

// Export singleton instance
export const api = new ApiClient();

// Example usage in components:
/*
import { api } from '../api/client';

// In your component:
const status = await api.getSystemStatus();
const repos = await api.listRepos();
await api.addFriend({ name: 'alice', nid: 'did:key:z6Mk...', repoPath: '/path' });
*/
