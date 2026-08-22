export function buildAuthHeaders({ ct0, bearerToken }) {
  if (!ct0) {
    throw new Error('Missing ct0 (csrf) cookie — user is not logged in to X');
  }
  return {
    Authorization: `Bearer ${bearerToken}`,
    'x-csrf-token': ct0,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
  };
}

const X_COOKIE_URL = 'https://x.com';

export async function getAuthCookies() {
  const ct0Cookie = await chrome.cookies.get({
    url: X_COOKIE_URL,
    name: 'ct0',
  });
  const authTokenCookie = await chrome.cookies.get({
    url: X_COOKIE_URL,
    name: 'auth_token',
  });
  return {
    ct0: ct0Cookie?.value ?? null,
    isLoggedIn: Boolean(authTokenCookie?.value),
  };
}
