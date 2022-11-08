scheduleTable = document.getElementById("scheduleTable");

t ={
    "au": "d=circuit&id=1&tab=history" ,//Australia
    "my": "d=circuit&id=2&tab=history" ,//Malaysia
    "cn": "d=circuit&id=3&tab=history" ,//China
    "bh": "d=circuit&id=4&tab=history" ,//Bahrain
    "es": "d=circuit&id=5&tab=history" ,//Spain
    "mc": "d=circuit&id=6&tab=history" ,//Monaco
    "tr": "d=circuit&id=7&tab=history" ,//Turkey
    "de": "d=circuit&id=9&tab=history" ,//Germany
    "hu": "d=circuit&id=10&tab=history" ,//Hungary
    "eu": "d=circuit&id=11&tab=history" ,//Europe
    "be": "d=circuit&id=12&tab=history" ,//Belgium
    "it": "d=circuit&id=13&tab=history" ,//Italy
    "sg": "d=circuit&id=14&tab=history" ,//Singapore
    "jp": "d=circuit&id=15&tab=history" ,//Japan
    "br": "d=circuit&id=16&tab=history" ,//Brazil
    "ae": "d=circuit&id=17&tab=history" ,//AbuDhabi
    "gb": "d=circuit&id=18&tab=history" ,//Great Britain
    "fr": "d=circuit&id=19&tab=history" ,//France
    "at": "d=circuit&id=20&tab=history" ,//Austria
    "ca": "d=circuit&id=21&tab=history" ,//Canada
    "az": "d=circuit&id=22&tab=history" ,//Azerbaijan
    "mx": "d=circuit&id=23&tab=history" ,//Mexico
    "ru": "d=circuit&id=24&tab=history" ,//Russia
    "us": "d=circuit&id=25&tab=history" //USA    
}


function inject_history()
{
    track_numbers = scheduleTable.rows.length;
    tstatus = document.getElementById("togglestatus");

    
if(!tstatus.checked)
    {
        
        document.querySelector("#mLeague").click();
       
    }
    else{
        
        for(i=0; i< track_numbers ; i++)
        {
            
            track = scheduleTable.rows[i].childNodes[1].childNodes[0];
            code = track.className.slice(-2);
            try {
                //console.log(track.parentElement.previousSibling.childNodes[0].href);
                link = track.parentElement.previousSibling.childNodes[0];
                link.getAttribute("href");
                link.href = t[code];
            } catch (error) {
                new_link = document.createElement('a');
                new_link.href = t[code];
                new_link.style.borderBottom = "none";
                new_link.textContent = link.textContent;
                link.parentElement.appendChild(new_link);
                link.remove();
            }
            
        }
    }
   
}

function inject_toggle_switch()
{

    if(document.getElementById("togglestatus")!=null)
    {
        return;
    }else { 

    eswitch = document.createElement("label");
    eswitch.className = "toggleSwitch";
    input = document.createElement("input");
    input.type = "checkbox";
    input.id = "togglestatus";
    input.addEventListener("change",inject_history);
    slider = document.createElement("span");
    slider.className = "slider round";
    eswitch.appendChild(input);
    eswitch.appendChild(slider);

    div = document.createElement("div");
    div.textContent = "Show full race history ";

    div.appendChild(eswitch);

    switch_position = document.getElementById("leagueInfo");
    switch_position.insertBefore(div,switch_position.childNodes[1]);
    }



}

inject_toggle_switch();
