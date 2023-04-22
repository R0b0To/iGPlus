//needs gsi library


const CLIENT_ID = '771547073964-71rvhnkrborst6bmolc0amfcvbfh5lki.apps.googleusercontent.com';

function initGSI(){
  function handleCallbackResponce(res){    console.log('token' + res.credential);}

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback : handleCallbackResponce
  });

  //google.accounts.id.renderButton(document.getElementById('signIN'),{theme:"outline",size:"large"});
  google.accounts.id.prompt();
}

async function getAccessToken(){
  //initGSI();
 const responce = await new Promise((resolve,rej)=>{
    google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback : (tokenRes) => {
      console.log(tokenRes);
      resolve(tokenRes);
      return tokenRes
    }
  }).requestAccessToken();
    console.log(('heys'))
 }) 

 return responce.access_token

}



export{
  getAccessToken
};