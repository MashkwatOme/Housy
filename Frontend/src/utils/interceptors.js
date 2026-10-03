// Global fetch interceptor to handle transparent access token refreshing

const originalFetch = window.fetch;
let isRefreshing = false;
let failedQueue = [];

const processQueue = () => {
  failedQueue.forEach((prom) => {
    prom.resolve();
  });
  failedQueue = [];
};

window.fetch = async function (url, options = {}) {
  // Safe string conversion for various fetch parameter formats (string, URL, Request)
  const urlString = typeof url === 'string'
    ? url
    : url instanceof URL
      ? url.href
      : (url && url.url) || '';

  // Do not intercept auth calls to prevent circular loops
  const isAuthCall = urlString.includes('/api/auth/refresh') ||
                     urlString.includes('/api/auth/login') ||
                     urlString.includes('/api/auth/register');

  if (isAuthCall) {
    return originalFetch(url, options);
  }

  const response = await originalFetch(url, options);

  // If unauthorized (401) and not already retried, try to refresh token
  if (response.status === 401 && !options._retry) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        failedQueue.push({
          resolve: () => resolve(originalFetch(url, { ...options, _retry: true }))
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await originalFetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        isRefreshing = false;
        const retryResponse = await originalFetch(url, { ...options, _retry: true });
        processQueue();
        return retryResponse;
      } else {
        isRefreshing = false;
        // Session has expired, notify context to clean up and redirect
        window.dispatchEvent(new CustomEvent('auth-session-expired'));
        const retryResponse = await originalFetch(url, { ...options, _retry: true });
        processQueue();
        return retryResponse;
      }
    } catch (err) {
      isRefreshing = false;
      window.dispatchEvent(new CustomEvent('auth-session-expired'));
      const retryResponse = await originalFetch(url, { ...options, _retry: true });
      processQueue();
      return retryResponse;
    }
  }

  return response;
};
