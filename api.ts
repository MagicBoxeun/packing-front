export const API_BASE_URL =
  (globalThis as { PACKING_API_BASE_URL?: string }).PACKING_API_BASE_URL ??
  'http://localhost:8080/api/v1';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

type AuthUser = {
  id: string;
  nickname: string;
  isNew: boolean;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type ParcelFeedItem = {
  id: string;
  nickname: string;
  tagline: string;
};

export type ParcelCreated = ParcelFeedItem & {
  createdAt: string;
};

export type Paged<T> = {
  items: T[];
  nextCursor: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class PackingApi {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async signup(email: string, password: string): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/signup', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    this.setTokens(session.accessToken, session.refreshToken);
    return session;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const session = await this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    this.setTokens(session.accessToken, session.refreshToken);
    return session;
  }

  async logout() {
    if (!this.refreshToken) {
      this.setTokens(null, null);
      return;
    }
    try {
      await this.request<null>('/auth/logout', {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        auth: false,
      });
    } finally {
      this.setTokens(null, null);
    }
  }

  async createParcel(input: {
    nickname: string;
    tagline: string;
    content: string;
  }): Promise<ParcelCreated> {
    return this.request<ParcelCreated>('/parcels', {
      method: 'POST',
      body: input,
    });
  }

  async getFeed(limit = 10, cursor?: string): Promise<Paged<ParcelFeedItem>> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) {
      params.set('cursor', cursor);
    }
    return this.request<Paged<ParcelFeedItem>>(
      `/parcels/feed?${params.toString()}`,
    );
  }

  async openParcel(id: string): Promise<{ success: boolean; content: string }> {
    return this.request<{ success: boolean; content: string }>(
      `/parcels/${encodeURIComponent(id)}/open`,
      { method: 'POST' },
    );
  }

  async sendReply(
    id: string,
    message: string,
  ): Promise<{
    id: string;
    message: string;
    createdAt: string;
  }> {
    return this.request(`/parcels/${encodeURIComponent(id)}/reply`, {
      method: 'POST',
      body: { message },
    });
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    const data = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: this.refreshToken },
      auth: false,
      retryOnUnauthorized: false,
    });
    this.accessToken = data.accessToken;
    return true;
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      auth?: boolean;
      retryOnUnauthorized?: boolean;
    } = {},
  ): Promise<T> {
    const {
      auth = true,
      body,
      method = 'GET',
      retryOnUnauthorized = true,
    } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body == null ? {} : { 'Content-Type': 'application/json' }),
        ...(auth && this.accessToken
          ? { Authorization: `Bearer ${this.accessToken}` }
          : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
    });

    const payload = (await response
      .json()
      .catch(() => null)) as ApiEnvelope<T> | null;

    if (
      response.status === 401 &&
      auth &&
      retryOnUnauthorized &&
      (await this.refreshAccessToken())
    ) {
      return this.request<T>(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }

    if (!response.ok || payload?.success === false || payload == null) {
      throw new ApiError(
        payload?.message ?? `요청에 실패했어요. (${response.status})`,
        response.status,
      );
    }

    return payload.data;
  }
}
