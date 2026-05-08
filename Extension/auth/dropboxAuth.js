const ext = globalThis.browser || globalThis.chrome;

const hasIdentityAPI = typeof ext?.identity !== 'undefined';
console.log(hasIdentityAPI);
const DROPBOX_CLIENT_ID = '3r2ckkoixravmqt'; // Your app key — this is fine, it's public

// --- PKCE Helpers ---

function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- Token Storage ---

async function saveTokens({ access_token, refresh_token, expires_in }) {
  const expire_date = Date.now() + ((expires_in || 14400) * 1000);
  await ext.storage.local.set({
    dbxAuth: { access_token, refresh_token, expire_date }
  });
}

async function isLocalTokenValid() {
  const d = await ext.storage.local.get({ dbxAuth: false });
  if (d?.dbxAuth) {
    const remainingMs = d.dbxAuth.expire_date - Date.now();
    if (remainingMs > 3 * 60 * 1000) return d.dbxAuth;
  }
  return false;
}

// --- Token Refresh ---

async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: DROPBOX_CLIENT_ID,
    })
  });

  if (!response.ok) throw new Error('Token refresh failed');

  const data = await response.json();
  // Preserve the existing refresh_token if a new one isn't issued
  await saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in
  });
  return data.access_token;
}

// --- Auth Flows ---

async function launchWebFlow(interactive, forceReapprove = false) {
  const local = await isLocalTokenValid();
  // If not interactive, we want silent auto-reapprove
  if (local && !interactive) return local;

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const redirectUri = ext.identity.getRedirectURL();

  const authUrl = new URL('https://www.dropbox.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', DROPBOX_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('token_access_type', 'offline');

  // --- NEW LOGIC: Only force reapprove if explicitly requested ---
  if (forceReapprove) {
    authUrl.searchParams.set('force_reapprove', 'true');
  }

  const responseUrl = await new Promise((resolve, reject) => {
    ext.identity.launchWebAuthFlow({ interactive, url: authUrl.toString() }, (url) => {
      if (ext.runtime.lastError) return reject(ext.runtime.lastError.message);
      if (!url) return reject('Authorization canceled.');
      resolve(url);
    });
  });

  return exchangeCodeForToken(responseUrl, redirectUri, codeVerifier);
}

async function launchAndroidTabFlow(interactive, forceReapprove = false) {
  if (!interactive) return null;

  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const cleanId = ext.runtime.id.replace(/{|}/g, '');
  const redirectUri = `https://${cleanId}.extensions.allizom.org/flowName=GeneralOauthFlow`;

  const authUrl = new URL('https://www.dropbox.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', DROPBOX_CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('token_access_type', 'offline');

  if (forceReapprove) {
    authUrl.searchParams.set('force_reapprove', 'true');
  }

  const responseUrl = await new Promise((resolve, reject) => {
    ext.tabs.create({ url: authUrl.toString() }, (tab) => {
      const onUpdated = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.url?.startsWith(redirectUri)) {
          ext.tabs.onUpdated.removeListener(onUpdated);
          ext.tabs.remove(tabId);
          resolve(changeInfo.url);
        }
      };
      ext.tabs.onUpdated.addListener(onUpdated);
      ext.tabs.onRemoved.addListener((tabId) => {
        if (tabId === tab.id) {
          ext.tabs.onUpdated.removeListener(onUpdated);
          reject('Login tab closed');
        }
      });
    });
  });

  return exchangeCodeForToken(responseUrl, redirectUri, codeVerifier);
}

async function exchangeCodeForToken(responseUrl, redirectUri, codeVerifier) {
  const url = new URL(responseUrl);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('No authorization code in response.');

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: DROPBOX_CLIENT_ID,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await response.json();
  await saveTokens(data);
  return { access_token: data.access_token };
}

// --- Public API ---

async function requestToken(options) {
  // We pass options.forceReapprove down to the flows
  if (hasIdentityAPI) return launchWebFlow(options.interactive, options.forceReapprove);
  return launchAndroidTabFlow(options.interactive, options.forceReapprove);
}

async function getAccessToken() {
  const local = await isLocalTokenValid();
  if (local) return local;

  const stored = await ext.storage.local.get({ dbxAuth: false });
  if (stored?.dbxAuth?.refresh_token) {
    try {
      return { access_token: await refreshAccessToken(stored.dbxAuth.refresh_token) };
    } catch (err) { /* ignore and move to requestToken */ }
  }

  // Regular request is NOT forced and NOT interactive (Auto-reapprove)
  return requestToken({ interactive: false, forceReapprove: false });
}


async function getFirstAccessToken(forceReapprove) {
  return requestToken({ interactive: true, forceReapprove: forceReapprove });
}
async function switchAccount() {
  // 1. Revoke the current token on Dropbox's side
  await revokeConsent();
  
  // 2. Force interactive login — skips the local cache check
  return requestToken({ interactive: true, forceReapprove: true });
}

async function revokeConsent() {
  const stored = await ext.storage.local.get({ dbxAuth: false });
  const token = stored?.dbxAuth?.access_token;
  if (token) {
    await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    await ext.storage.local.remove('dbxAuth');
  }
}

async function invalidateToken() {
  await ext.storage.local.remove('dbxAuth');
}

export {
  getAccessToken,
  getFirstAccessToken,
  revokeConsent,
  invalidateToken,
  switchAccount
};