async function changeLanguage(){
if(document.getElementById("quick_lang_change")== null && document.getElementById('driver-table')!=null){
const { fetchSettings } = await import(chrome.runtime.getURL('./common/fetcher.js'));

select_placement = document.querySelector('[class=notice]');
const select_container = document.createElement("div");
select_container.id="quick_lang_change";
select_container.style.display = "contents";
const settings = await fetchSettings();
console.log(settings)
console.log(select_container)
select_container.innerHTML = settings.vars.langPicker;
select_placement.append(select_container)
select = select_container.childNodes[0];
select.addEventListener("change",()=>{
    sendChangeReq(settings.vars)
}); 
}


function sendChangeReq(player){
    const url = 'https://igpmanager.com/index.php?action=send&addon=igp&type=settings&jsReply=formSubmit&ajax=1';

    const htmlfragment = document.createElement('div');
    htmlfragment.innerHTML =  DOMPurify.sanitize(player.timezones);
    const tz =htmlfragment.childNodes[0].value

    const data = new URLSearchParams();
    data.append("sfx", player.sfx);
    data.append("is2D", player.is2D)
    data.append("defaultView3D", player.defaultView3D)
    data.append("language", select.value)
    data.append("tz", tz)
    data.append("tzAuto", (player.tzoChecked =="checked") ? "on":"off")
    data.append("dFullscreen", '1')
    data.append("pic", '')
    data.append("email", player.email)
    data.append("biography", player.biography)
    data.append("currency", player.currency)
    data.append("temperature", player.temperature)
    data.append("speed", player.speed)
    data.append("weight", player.weight)
    data.append("height", player.height)
    data.append("allowPm", player.allowPm)
    data.append("csrfName", '')
    data.append("csrfToken", '')
    data.append("music", player.music)
      

      fetch(url, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: data.toString() 
      })
        .then(response => {
          if (response.ok) {
            return response.json(); // Parse the response if it's JSON
          } else {
            throw new Error('Request failed');
          }
        })
        .then(data => {
          location.reload();
          console.log(data);
        })
        .catch(error => {
          // Handle any errors that occurred during the request
          console.error(error);
        });
}}

(async () => {
    for (let i = 0; i < 3; i += 1) {
      try {
        await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
        await changeLanguage();
        break;
      } catch (err) {
        console.log(err)
        console.warn(`Retry to enhance research table #${i + 1}/3`);
      }
    }
  })();