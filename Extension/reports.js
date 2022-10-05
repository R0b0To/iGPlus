manager = [] ;
progress_status = 0;
inject_button();


function inject_button() {
    
   button = document.createElement("button");
   button.setAttribute("style","color: white; border-radius:4px; border:0px; font-family:RobotoCondensedBold; padding:10px; background:#d66e67;");
   button.innerText= "extract";
   button.id = 'extract_button';
   button.addEventListener('click', button_function);
   button.addEventListener('touchstart', button_function);
   title_location = document.getElementsByClassName("dialog-head"); //location of the button

   if(title_location[0].childElementCount == 1)
   {  
    title_location[0].appendChild(button);
   }
  
}

function progress(){
  
  progress_div = document.createElement("div");
  progress_div.setAttribute("style","background-color:#ddd; height:10px; border-radius:4px;");
  progress_div.id='progress';

  bar_div = document.createElement("div");
  bar_div.setAttribute("style","background-color:#4CAF50; width:1%; height:10px; border-radius:4px;");
  bar_div.id = 'bar';
  progress_div.appendChild(bar_div);
  return progress_div;
}


function button_function(){
    
    b_parent = this.parentElement; 
    this.remove();
    b_parent.appendChild(progress());
    race_results = document.querySelector("#race").childNodes[1].childNodes[1];
    quali_results = document.querySelector("#qualifying").childNodes[0].childNodes[1];
   

  
    

// get quali results
    for(i=1 ; i <= quali_results.childElementCount ; i++)
    {
        driver_quali = quali_results.childNodes[i].childNodes[1].getElementsByClassName("linkParent");
        driver_id = driver_quali[0].href.replace(/\D/g,"");
        driver_name = quali_results.childNodes[i].childNodes[1].childNodes[4].textContent.substring(1);
        team_name = quali_results.childNodes[i].childNodes[1].childNodes[6].innerText;
        race_id = window.location.href.replace(/\D/g,"");
    
        manager_template = {
            "id" : driver_id,
            "name" : driver_name,
            "team" : team_name,
            "quali" : i,
            "race" : "NotFound",
            "race_finish" : "",      
            "race_id" : race_id,
            "report_id": "",          
            "rank" : [],
            "race_time" : [],
            "pit_stop" : ""
        }

        manager.push(manager_template);
        
    }

//get race results
    for(i=1 ; i <= race_results.childElementCount ; i++)
    {

        //driver id and name
        driver_race_result = race_results.childNodes[i].childNodes[1].getElementsByClassName("linkParent");

        try {
            driver_race_report = race_results.childNodes[i].childNodes[2].getElementsByClassName("linkParent")[0].href;
    
          }
          catch(err) {     
            console.log("failed to get one or more reports. most likely DNFs");
            driver_race_report = "no_race";
           
          }    

          
        // extract driver id from reports url
        driver_id = driver_race_result[0].href.replace(/\D/g,"");
       
        
        
        finish_position = i;
        //assingn race report to correct driver from quali
        j=0;
        looking_for_id = true;
        while(looking_for_id)
        {
            if(manager[j].id == driver_id){
                looking_for_id = false;
                manager[j].race = driver_race_report;
                manager[j].report_id = driver_race_report.replace(/\D/g,"");
                manager[j].race_finish = finish_position;
             }
         j++;
        }
    

    }

    //start extraction
    race_report();

}



//send requests for each driver report
async function race_report(){
console.log("requesting "+manager.length+" reports");
for(number=0 ; number <manager.length ; number++){
  if(manager[number].report_id!=""){
    
    url = "https://igpmanager.com/index.php?action=fetch&d=resultDetail&id="+manager[number].report_id+"&csrfName=&csrfToken=";  
    result = await request(url);    
    
    table= decode_result(result);

    update_managers(table,number);
   
  }
}
document.getElementById("progress").remove();
}

//handle server response
function request(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.ontimeout = function () {
      reject('timeout')
    }
    xhr.open('get', url, true)
    xhr.send()
  })
}   
      
//get only the table from the response
function decode_result(data){
  
  string = /<table.*table>/gm.exec(data)[0];
  table = string.replace(/\\n/g, "");
  table = table.replace(/\\/g, "");
  //t = document.createElement("table");
  t = new DOMParser().parseFromString(table, "text/html");
  return t.body.childNodes[0];

}
        

       
//complete the manager_template info
async function update_managers(table,index)
{


    try {

        race_table = table;
        laps_done = race_table.tBodies[0].rows.length; // getting last lap

        manager[index].pit_stop = race_table.rows[1].childNodes[1].childNodes[0].textContent.split(" ")[0];
        last_pit_lap = 0;

        
        for(i=2; i<=laps_done ; i++){

            if(race_table.rows[i].childNodes[0].textContent=="PIT")
            {
                pit_lap = race_table.rows[i-1].childNodes[0].textContent;
                pit_tyre = race_table.rows[i].childNodes[1].childNodes[2].textContent.split(" ")[0];
               
                manager[index].pit_stop+="("+(pit_lap-last_pit_lap)+")"+pit_lap+",  "+pit_tyre;

                last_pit_lap = pit_lap;
              
            }  
            else{
                manager[index].rank.push(race_table.rows[i].childNodes[4].innerHTML); //track position
               
                if(race_table.rows[i].childNodes[2].innerHTML=="-")
                manager[index].race_time.push("0"); // leading car lead by 0
                else
                {
                string = race_table.rows[i].childNodes[2].innerHTML;
                manager[index].race_time.push(string); //time from leading car
            }
            }
        }

        last_lap_completed = race_table.rows[race_table.tBodies[0].rows.length].childNodes[0].innerHTML;
        manager[index].pit_stop+="("+(last_lap_completed-last_pit_lap)+")"+(last_lap_completed);



        bar = document.getElementById("bar");
        progress_status+=(100/manager.length);
        bar.style.width = progress_status+"%";
        

        //save manager
        chrome.storage.local.set({'active': manager}, function() {
                 console.log("saved "+manager[index].name);                    
        });
       

      }
      catch(err) {
        alert(err);
       
      }


 }          

                    
                    
                
              
    
    
   


       
      
      
       