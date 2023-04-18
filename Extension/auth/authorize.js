/* exported getAccessToken */
//TODO change chrome to browser when using firefox

const REDIRECT_URL = chrome.identity.getRedirectURL();
const CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const AUTH_URL =
`https://accounts.google.com/o/oauth2/auth\
?client_id=${CLIENT_ID}\
&response_type=token\
&redirect_uri=${encodeURIComponent(REDIRECT_URL)}\
&scope=${encodeURIComponent(SCOPES.join(' '))}`;
const VALIDATION_BASE_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

function extractAccessToken(redirectUri) {
  let m = redirectUri.match(/[#?](.*)/);
  if (!m || m.length < 1)
    return null;
  let params = new URLSearchParams(m[1].split('#')[0]);
  return params.get('access_token');
}


function validate(redirectURL) {
  console.log(redirectURL);
  const accessToken = extractAccessToken(redirectURL);
  if (!accessToken) {
    //throw 'Authorization failure';
    return -2;
  }
  const validationURL = `${VALIDATION_BASE_URL}?access_token=${accessToken}`;
  const validationRequest = new Request(validationURL, {
    method: 'GET'
  });

  function checkResponse(response) {
    return new Promise((resolve, reject) => {
      if (response.status != 200) {
        reject('Token validation error');
      }
      response.json().then((json) => {
        if (json.aud && (json.aud === CLIENT_ID)) {
          resolve(accessToken);
        } else {
          reject('Token validation error');
        }
      });
    });
  }

  return fetch(validationRequest).then(checkResponse);
}


function authorize() {
  return chrome.identity.launchWebAuthFlow({
    interactive: true,
    url: AUTH_URL
  });
}

function getAccessToken() {
  return authorize().then(validate)
    .catch(()=>{
    //user denied access
      return -1;}
    );
}

export {
  authorize,
  getAccessToken,

};