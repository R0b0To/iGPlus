const ext = globalThis.browser || globalThis.chrome;

// 1. Improved Detection
const isRealChrome = (() => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('chrome') && !ua.includes('edg/') && !ua.includes('brave');
})();

const isFirefoxAndroid = (() => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('firefox') && ua.includes('android');
})();

const isNativeSupported = isRealChrome && typeof ext?.identity?.getAuthToken === 'function';
const hasIdentityAPI = typeof ext?.identity !== 'undefined';

const WEB_CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';

async function requestNativeToken(options) {
  // Path A: Google Chrome Native (Fastest)
  if (isNativeSupported) {
    return new Promise((resolve, reject) => {
      ext.identity.getAuthToken({ interactive: options.interactive }, async (token) => {
        if (ext.runtime.lastError) {
          const errMsg = ext.runtime.lastError.message;
          if (errMsg.includes('turned off') || errMsg.includes('not signed in')) {
            try {
              const fallbackToken = await launchWebFlow(options.interactive);
              resolve(fallbackToken);
            } catch (err) { reject(err); }
          } else { reject(errMsg); }
        } else {
          resolve({ access_token: token });
        }
      });
    });
  } 
  
  // Path B: Desktop Firefox / Edge / Brave (Identity API exists)
  if (hasIdentityAPI) {
    return launchWebFlow(options.interactive);
  } 

  // Path C: Firefox Android Fallback (No Identity API)
  console.log("iGPlus | Identity API missing (Android). Using Tab flow.");
  return launchAndroidTabFlow(options.interactive);
}

async function getAccessToken() {
  const local = await isLocalTokenValid();
  if (local) return local;

  try {
    return await requestNativeToken({ interactive: false });
  } catch (err) {
    console.warn("Silent token request failed:", err);
    return null;
  }
}

async function getFirstAccessToken() {
  return requestNativeToken({ interactive: true });
}

/**
 * Standard Identity Web Flow (Desktop)
 */
async function launchWebFlow(interactive) {
  const localToken = await isLocalTokenValid();
  if (localToken && !interactive) return localToken;

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
      resolve(parseTokenFromUrl(responseUrl));
    });
  });
}

/**
 * Android Fallback: Uses tabs.create instead of identity API
 */
async function launchAndroidTabFlow(interactive) {
  if (!interactive) return null;

  // 1. Clean the Extension ID (Google Console doesn't like { } braces)
  const cleanId = ext.runtime.id.replace(/{|}/g, "");
  
  // 2. Construct the URI manually to match the one you found
  const redirectUri = `https://${cleanId}.extensions.allizom.org/flowName=GeneralOauthFlow`;
  
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${WEB_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES)}`;

  return new Promise((resolve, reject) => {
    // Open the login page in a new tab
    ext.tabs.create({ url: authUrl }, (tab) => {
      
      const listener = (tabId, changeInfo) => {
        // We check if the URL starts with our clean redirect URI
        if (tabId === tab.id && changeInfo.url && changeInfo.url.startsWith(redirectUri)) {
          try {
            const tokenObj = parseTokenFromUrl(changeInfo.url);
            
            // Success: Clean up
            ext.tabs.onUpdated.removeListener(listener);
            ext.tabs.remove(tabId); 
            resolve(tokenObj);
          } catch (e) {
            reject("Failed to parse token from Android redirect");
          }
        }
      };

      ext.tabs.onUpdated.addListener(listener);
      
      // Cleanup if user closes tab manually
      ext.tabs.onRemoved.addListener((tabId) => {
        if (tabId === tab.id) {
          ext.tabs.onUpdated.removeListener(listener);
          reject("Login tab closed");
        }
      });
    });
  });
}

/**
 * Shared Helper to parse tokens from Google's redirect URL
 */
function parseTokenFromUrl(responseUrl) {
  const url = new URL(responseUrl);
  const params = new URLSearchParams(url.hash.substring(1));
  const token = params.get('access_token');
  const expiresIn = parseInt(params.get('expires_in'), 10) || 3600;

  if (token) {
    const tokenObj = { access_token: token };
    saveAccessTokenWebFlow(tokenObj, expiresIn);
    return tokenObj;
  }
  throw new Error("No token found in response.");
}

async function revokeConsent() {
  const localToken = await isLocalTokenValid();
  if (localToken) {
    fetch(`https://accounts.google.com/o/oauth2/revoke?token=${localToken.access_token}`);
    await ext.storage.local.remove('gAuth');
  }
  
  if (isNativeSupported) {
    ext.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        ext.identity.removeCachedAuthToken({ token: token }, () => {
          fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        });
      }
    });
  }
}

function saveAccessTokenWebFlow(token, expiresInSec) {
  const expireDate = Date.now() + (expiresInSec * 1000); 
  ext.storage.local.set({ 
    'gAuth': { access_token: token.access_token, expire_date: expireDate } 
  });
}

async function invalidateToken(token) {
  if (isNativeSupported) {
    return new Promise((resolve) => {
      ext.identity.removeCachedAuthToken({ token: token }, resolve);
    });
  } else {
    await ext.storage.local.remove('gAuth');
  }
}

async function isLocalTokenValid() {
  const d = await ext.storage.local.get({ 'gAuth': false });
  if (d && d.gAuth) {
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
  revokeConsent,
  invalidateToken
};