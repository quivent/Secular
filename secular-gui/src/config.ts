// API Configuration
export const config = {
  // API endpoint - can be toggled via environment variable
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5288',

  // Feature flags
  useLocalApi: import.meta.env.VITE_USE_LOCAL_API === 'true',
  useTauri: import.meta.env.VITE_USE_TAURI === 'true',

  // Environment
  env: import.meta.env.VITE_ENV || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

// Helper to get full API URL
export function getApiUrl(endpoint: string): string {
  const base = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

// Example usage:
// const url = getApiUrl('/api/system/status');
// fetch(url).then(r => r.json())
