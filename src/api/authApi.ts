import { axiosClient, setInMemoryTokens } from './axiosClient';
import { sandboxStore } from './sandboxStore';
import {
  ApiMode,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types';

export const authApi = {
  async login(payload: LoginPayload, mode: ApiMode): Promise<AuthResponse> {
    if (mode === 'sandbox') {
      const res = await sandboxStore.login(payload);
      setInMemoryTokens(res.tokens.access, res.tokens.refresh);
      return res;
    }

    const response = await axiosClient.post('/auth/login/', payload);
    const data = response.data?.data || response.data;
    const authRes: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      },
    };
    setInMemoryTokens(authRes.tokens.access, authRes.tokens.refresh);
    return authRes;
  },

  async register(
    payload: RegisterPayload,
    mode: ApiMode
  ): Promise<AuthResponse> {
    if (mode === 'sandbox') {
      const res = await sandboxStore.register(payload);
      setInMemoryTokens(res.tokens.access, res.tokens.refresh);
      return res;
    }

    const response = await axiosClient.post('/auth/register/', payload);
    const data = response.data?.data || response.data;
    const authRes: AuthResponse = {
      user: data.user,
      tokens: {
        access: data.access,
        refresh: data.refresh,
      },
    };
    setInMemoryTokens(authRes.tokens.access, authRes.tokens.refresh);
    return authRes;
  },

  async getCurrentUser(mode: ApiMode): Promise<User | null> {
    if (mode === 'sandbox') {
      return null;
    }
    const response = await axiosClient.get('/auth/me/');
    return response.data?.data || response.data;
  },

  logout() {
    setInMemoryTokens(null, null);
  },
};
