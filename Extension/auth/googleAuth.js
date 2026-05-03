const ext = globalThis.browser || globalThis.chrome;
const isChrome = typeof ext?.identity?.getAuthToken === 'function';

// The Client ID you originally used (Web Application Type)
const WEB_CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';

async function getAccessToken() {
  return requestNativeToken({ interactive: false });
}

async function getFirstAccessToken() {
  return requestNativeToken({ interactive: true });
}

async function requestNativeToken(options) {
  if (isChrome) {
    return new Promise((resolve, reject) => {
      ext.identity.getAuthToken({ interactive: options.interactive }, async (token) => {
        if (ext.runtime.lastError) {
          const errMsg = ext.runtime.lastError.message;
          
          // Fallback condition: User is not signed into the browser itself
          if (errMsg.includes('turned off browser signin') || errMsg.includes('not signed in')) {
            console.warn("Browser sign-in is disabled. Falling back to Web Auth Flow...");
            try {
              const fallbackToken = await launchWebFlow(options.interactive);
              resolve(fallbackToken);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(errMsg);
          }
        } else {
          resolve({ access_token: token }); // Successfully got native Chrome token
        }
      });
    });
  } else {
    // Firefox uses web flow directly
    return launchWebFlow(options.interactive);
  }
}

/**
 * Shared generic OAuth Web Flow (Used by Firefox natively, and Chrome as a fallback)
 */
async function launchWebFlow(interactive) {
  // 1. Check if we have a valid cached token first
  const localToken = await isLocalTokenValid();
  if (localToken && !interactive) return localToken;

  // 2. Build the Google OAuth URL
  const redirectUri = ext.identity.getRedirectURL(); 
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${WEB_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES)}`;

  return new Promise((resolve, reject) => {
    ext.identity.launchWebAuthFlow({
      interactive: interactive,
      url: authUrl
    }, (responseUrl) => {
      if (ext.runtime.lastError) {
        reject(ext.runtime.lastError.message);
        return;
      }
      
      if (!responseUrl) {
        reject("Authorization was canceled.");
        return;
      }

      // Extract the token from the URL hash: #access_token=...&expires_in=...
      const url = new URL(responseUrl);
      const params = new URLSearchParams(url.hash.substring(1));
      const token = params.get('access_token');
      const expiresIn = parseInt(params.get('expires_in'), 10) || 3600;

      if (token) {
        const tokenObj = { access_token: token };
        saveAccessTokenWebFlow(tokenObj, expiresIn);
        resolve(tokenObj);
      } else {
        reject("No token found in response.");
      }
    });
  });
}

async function revokeConsent() {
  // 1. Clear Web Flow token
  const localToken = await isLocalTokenValid();
  if (localToken) {
    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${localToken.access_token}`);
    await ext.storage.local.remove('gAuth');
  }
  
  // 2. Clear Chrome Native token (if exists)
  if (isChrome) {
    return new Promise((resolve) => {
      ext.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          ext.identity.removeCachedAuthToken({ token: token }, () => {
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
}

// ==========================================
// CACHING UTILITIES (For the Web Flow)
// ==========================================
function saveAccessTokenWebFlow(token, expiresInSec) {
  const expireDate = Date.now() + (expiresInSec * 1000); 
  ext.storage.local.set({ 
    'gAuth': { access_token: token.access_token, expire_date: expireDate } 
  });
}

async function isLocalTokenValid() {
  const d = await ext.storage.local.get({ 'gAuth': false });
  if (d.gAuth) {
    const remainingMs = d.gAuth.expire_date - Date.now();
    if (remainingMs > (3 * 60 * 1000)) { 
      return d.gAuth;
    }
  }
  return false;
}

export {
  getAccessToken,
  getFirstAccessToken,
  revokeConsent
};