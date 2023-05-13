try {
  if(!document.getElementById('syncedStatus') && document.getElementById('menu')){
    //this div will serve as a user session. This script will only be executed once after first access or page reload
    const sycedStatus = document.createElement('div');
    sycedStatus.style.display = 'none';
    sycedStatus.id = 'syncedStatus';
    document.body.append(sycedStatus);
    const sync = async function(){
      console.log('iGPlus| Syncing...');
      const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
      const token = await getAccessToken();

      if(token != false)
      {
        chrome.runtime.sendMessage({type:'syncData',direction:true,token:token.access_token}, (responce) =>{
          if(responce.done)
          {
            try {
              console.log('restored');
            } catch (error) {
              //user left the page
            }
          }
        });
      }
      else{
        //alert('user closed popup')
      }
    };
    setTimeout(sync, 1000);
  }else{
    //console.log('already done');
  }

} catch (error) {
  //console.log('already done');
  
}


