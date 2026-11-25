import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorShape } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let onTokensRefreshedCallback: ((access: string, refresh: string) => void) | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setInMemoryTokens(
  access: string | null,
  refresh: string | null
) {
  inMemoryAccessToken = access;
  inMemoryRefreshToken = refresh;
}

export function getInMemoryTokens() {
  return {
    access: inMemoryAccessToken,
    refresh: inMemoryRefreshToken,
  };
}

export function registerAuthCallbacks(
  onRefresh: (access: string, refresh: string) => void,
  onUnauthorized: () => void
) {
  onTokensRefreshedCallback = onRefresh;
  onUnauthorizedCallback = onUnauthorized;
}

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

function resolvePending(token: string | null) {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/refresh/') &&
      inMemoryRefreshToken
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: inMemoryRefreshToken,
        });
        const newAccess = refreshRes.data?.data?.access || refreshRes.data?.access;
        const newRefresh =
          refreshRes.data?.data?.refresh ||
          refreshRes.data?.refresh ||
          inMemoryRefreshToken;

        setInMemoryTokens(newAccess, newRefresh);
        if (onTokensRefreshedCallback && newAccess) {
          onTokensRefreshedCallback(newAccess, newRefresh);
        }
        resolvePending(newAccess);

        if (originalRequest.headers && newAccess) {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError) {
        resolvePending(null);
        setInMemoryTokens(null, null);
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function parseApiError(error: unknown): ApiErrorShape {
  if (
    error &&
    typeof error === 'object' &&
    'isSandboxError' in error &&
    'message' in error
  ) {
    const err = error as unknown as {
      message: string;
      status?: number;
      fieldErrors?: Record<string, string>;
    };
    return {
      message: err.message,
      status: err.status || 400,
      fieldErrors: err.fieldErrors,
    };
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        message:
          'Unable to reach the Django API server. Verify Django is running on port 8000 or switch to Preview Sandbox mode.',
        status: 0,
      };
    }

    const data = error.response.data as Record<string, unknown> | undefined;
    const fieldErrors: Record<string, string> = {};

    if (data && typeof data === 'object') {
      const errorsObj =
        (data.errors as Record<string, unknown>) ||
        (data.details as Record<string, unknown>);
      if (errorsObj && typeof errorsObj === 'object') {
        Object.entries(errorsObj).forEach(([key, val]) => {
          if (Array.isArray(val) && val.length > 0) {
            fieldErrors[key] = String(val[0]);
          } else if (typeof val === 'string') {
            fieldErrors[key] = val;
          }
        });
      }

      const message =
        (typeof data.message === 'string' && data.message) ||
        (typeof data.detail === 'string' && data.detail) ||
        (typeof data.error === 'string' && data.error) ||
        Object.values(fieldErrors)[0] ||
        `Request failed with status ${error.response.status}`;

      return {
        message,
        status: error.response.status,
        fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    }

    return {
      message: `Server returned error ${error.response.status}.`,
      status: error.response.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred. Please try again.' };
}
