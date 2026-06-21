import { ApiError, PackingApi } from '../api';

type FetchCall = [string, RequestInit | undefined];

const ok = (data: unknown, status = 200) => response(true, status, data);

const fail = (message: string, status = 400) =>
  response(false, status, null, message);

function response(
  success: boolean,
  status: number,
  data: unknown,
  message: string | null = null,
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success, data, message }),
  };
}

function calls() {
  return (globalThis.fetch as jest.Mock).mock.calls as FetchCall[];
}

beforeEach(() => {
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn();
});

test('signup and login store tokens for authenticated requests', async () => {
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce(
      ok({
        accessToken: 'signup-access',
        refreshToken: 'signup-refresh',
        user: { id: 'user-1', nickname: '신규 사용자', isNew: true },
      }),
    )
    .mockResolvedValueOnce(
      ok({
        id: 'parcel-1',
        nickname: '신규 사용자',
        tagline: '테스트 소포',
        createdAt: '2026-06-23T12:00:00',
      }),
    )
    .mockResolvedValueOnce(
      ok({
        accessToken: 'login-access',
        refreshToken: 'login-refresh',
        user: { id: 'user-1', nickname: '신규 사용자', isNew: false },
      }),
    )
    .mockResolvedValueOnce(ok({ items: [], nextCursor: null }));

  const api = new PackingApi();
  await api.signup('new@example.com', 'password123');
  await api.createParcel({
    nickname: '신규 사용자',
    tagline: '테스트 소포',
    content: '테스트 본문입니다.',
  });
  await api.login('new@example.com', 'password123');
  await api.getFeed(5);

  expect(calls()[0][0]).toContain('/auth/signup');
  expect(calls()[0][1]?.body).toBe(
    JSON.stringify({ email: 'new@example.com', password: 'password123' }),
  );
  expect(calls()[1][1]?.headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer signup-access' }),
  );
  expect(calls()[2][0]).toContain('/auth/login');
  expect(calls()[3][1]?.headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer login-access' }),
  );
});

test('logout sends refresh token and clears local tokens', async () => {
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce(
      ok({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', nickname: '사용자', isNew: false },
      }),
    )
    .mockResolvedValueOnce(ok(null))
    .mockResolvedValueOnce(ok({ items: [], nextCursor: null }));

  const api = new PackingApi();
  await api.login('user@example.com', 'password123');
  await api.logout();
  await api.getFeed(10);

  expect(calls()[1][0]).toContain('/auth/logout');
  expect(calls()[1][1]?.body).toBe(
    JSON.stringify({ refreshToken: 'refresh-token' }),
  );
  expect(calls()[2][1]?.headers).not.toEqual(
    expect.objectContaining({ Authorization: expect.any(String) }),
  );
});

test('logout clears local tokens even when the server rejects logout', async () => {
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce(
      ok({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', nickname: '사용자', isNew: false },
      }),
    )
    .mockResolvedValueOnce(fail('이미 만료된 토큰입니다.', 401))
    .mockResolvedValueOnce(ok({ items: [], nextCursor: null }));

  const api = new PackingApi();
  await api.login('user@example.com', 'password123');
  await expect(api.logout()).rejects.toThrow(ApiError);
  await api.getFeed(10);

  expect(calls()[2][1]?.headers).not.toEqual(
    expect.objectContaining({ Authorization: expect.any(String) }),
  );
});

test('parcel endpoints use expected paths, methods, query params, and bodies', async () => {
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ items: [], nextCursor: 'next-cursor' }))
    .mockResolvedValueOnce(ok({ success: true, content: '내용' }))
    .mockResolvedValueOnce(
      ok({
        id: 'reply-1',
        message: '답장',
        createdAt: '2026-06-23T12:05:00',
      }),
    );

  const api = new PackingApi();
  api.setTokens('access-token', 'refresh-token');
  await api.getFeed(3, 'cursor value');
  await api.openParcel('parcel/id with spaces');
  await api.sendReply('parcel/id with spaces', '답장');

  expect(calls()[0][0]).toContain(
    '/parcels/feed?limit=3&cursor=cursor+value',
  );
  expect(calls()[0][1]?.method).toBe('GET');
  expect(calls()[1][0]).toContain('/parcels/parcel%2Fid%20with%20spaces/open');
  expect(calls()[1][1]?.method).toBe('POST');
  expect(calls()[2][0]).toContain('/parcels/parcel%2Fid%20with%20spaces/reply');
  expect(calls()[2][1]?.method).toBe('POST');
  expect(calls()[2][1]?.body).toBe(JSON.stringify({ message: '답장' }));
});

test('401 responses refresh access token once and retry the original request', async () => {
  (globalThis.fetch as jest.Mock)
    .mockResolvedValueOnce(fail('만료된 토큰입니다.', 401))
    .mockResolvedValueOnce(ok({ accessToken: 'new-access-token' }))
    .mockResolvedValueOnce(ok({ items: [], nextCursor: null }));

  const api = new PackingApi();
  api.setTokens('old-access-token', 'refresh-token');
  await api.getFeed(10);

  expect(calls()[0][1]?.headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer old-access-token' }),
  );
  expect(calls()[1][0]).toContain('/auth/refresh');
  expect(calls()[1][1]?.body).toBe(
    JSON.stringify({ refreshToken: 'refresh-token' }),
  );
  expect(calls()[2][1]?.headers).toEqual(
    expect.objectContaining({ Authorization: 'Bearer new-access-token' }),
  );
});

test('failed envelopes throw ApiError with server message and status', async () => {
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
    fail('요청 값이 올바르지 않습니다.', 422),
  );

  const api = new PackingApi();
  await expect(api.getFeed(10)).rejects.toMatchObject({
    name: 'ApiError',
    message: '요청 값이 올바르지 않습니다.',
    status: 422,
  });
});
