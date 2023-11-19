//needs gsi library
const CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';
const scopes = 'https://www.googleapis.com/auth/drive.file\ https://www.googleapis.com/auth/spreadsheets \ https://www.googleapis.com/auth/drive.readonly';
async function getAccessToken(){
  const local_access_token = await isLocalTokenValid();
  if(local_access_token != false)
    return local_access_token;
  const response = await new Promise((resolve,rej)=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      prompt:'',
      scope: scopes,
      callback : (tokenRes) => {
        saveAccessToken(tokenRes);
        resolve(tokenRes);
      },
      error_callback : (err) =>{resolve(false);}
    }).requestAccessToken();
  });
  return response;
}
async function getFirstAccessToken(){
  const response = await new Promise((resolve,rej)=>{
    google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: scopes,
      callback : (tokenRes) => {
        saveAccessToken(tokenRes);
        resolve(tokenRes);
      },
      error_callback : (err) =>{resolve(false);}
    }).requestAccessToken();
  });
  return response;
}

async function revokeConsent(){
  const local_access_token = await isLocalTokenValid();
  google.accounts.oauth2.revoke(local_access_token, done => {  });
  chrome.storage.local.remove('gAuth') ?? browser.storage.local.remove('gAuth');

}

function saveAccessToken(token){
  const expire_date = new Date().setHours(new Date().getHours() + 1);
  chrome.storage.local.set({'gAuth':{access_token:token.access_token,expire_date:expire_date}});
}
async function isLocalTokenValid(){
  const d = await chrome.storage.local.get({'gAuth':false}) ?? await browser.storage.local.get({'gAuth':false}) ;
  if(d.gAuth != false)
  {
    const remaining = d.gAuth.expire_date - new Date();
    if(remaining < 0)// if expired
      return false
    const expire_in = difference2Parts(remaining);
    if(expire_in.minutesTotal < 3) //if less than 3 minutes
      return false;
    else // still good to use
      return d.gAuth;
  }
  return false;

}

function difference2Parts(milliseconds) {
  const secs = Math.floor(Math.abs(milliseconds) / 1000);
  const mins = Math.floor(secs / 60);
  return {minutesTotal: mins};
}

export{
  getAccessToken,
  revokeConsent,
  getFirstAccessToken
};
