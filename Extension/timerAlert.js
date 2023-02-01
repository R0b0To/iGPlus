function checkAcademyTimer()
{
    timerAlert = document.getElementById("academyAlert");
    if(timerAlert==null)
    {
     url = `https://igpmanager.com/index.php?action=fetch&d=facility&id=11&csrfName=&csrfToken=`;
     fetch(url)
    .then(response => response.json())
    .then(data => {
        try {
        r= /cdStyle=.+?>(.*?)<\/span/;
        resetDate = r.exec(data.vars.options)[1];
        injectNotification(resetDate);
        } catch (error) {
            //academy lv 0
        }
        
    }) 
    }else{
      //nothing to do
          
    }
   
}
function injectNotification (resetDate){
    if(document.getElementById("academyAlert")==null)
    {
    notification = document.createElement("div"); 
    notification.className = "notify";
    notification.id = "academyAlert";
    notification.setAttribute("style","display:flex;background:#5986b3!important");
    s = secondsToReset(resetDate);
    notification.setAttribute("timer",s);
    
    if(s>0)
    {
      notification.style.display = "none";
      setTimeout(() => {
        document.getElementById("academyAlert").style.display = "flex";
      },parseInt(s))  
    }else{
        alert("new drivers in HQ");
    }
    span = document.createElement("span");
    span.className= "robotoBold";
    span.textContent = "!";
    notification.append(span);
    try {
    hq = document.getElementById("mHeadquarters");
    hq.style.position = "relative";
    hq.append(notification); 
    } catch (error) {
        //error
    }
     
    }
}

function secondsToReset(resetDate)
{
    d1 = new Date(resetDate);
    d2 = new Date();
    diff = (d1-d2); 
    return diff;
}

checkAcademyTimer();