
document.addEventListener('DOMContentLoaded', function() {

     startOvertakes = document.getElementById('start');
     deleteButton = document.getElementById('delete');
     select_data = document.getElementById('select');
     newButton = document.getElementById('new');
     recapButton = document.getElementById('recap');
     averageButton = document.getElementById('average');
     pitButton = document.getElementById('pit'); 
     text = document.getElementById('text'); 
     downloadButton= document.getElementById('down'); 
     copyButton= document.getElementById('copy'); 

    is_save_empty = true;

    function toggleButtons()
    {
        
     if(is_save_empty){
        recapButton.disabled = true;
        averageButton.disabled = true;
        pitButton.disabled = true;
        startOvertakes.disabled= true;
      }
      else{
        recapButton.disabled = false;
        averageButton.disabled = false;
        pitButton.disabled = false;
        startOvertakes.disabled= false;
      }
    }
   // setText("hey");
    
    function setText(string){
       toggleText(true);
        text.textContent=string;  
    }
    function toggleText(b)
    {
      if(b)
      {
        text.style.display = 'block';
        copyButton.style.display = 'block';
        downloadButton.style.display = 'block';
      }
      else
      {
        text.style.display = 'none';
        copyButton.style.display = 'none';
        downloadButton.style.display = 'none';
      }
        
    }


//get names of save data
    chrome.storage.local.get(null, function(data) {

        if(typeof data.current_managers === 'undefined')
        {            
          console.log("data not found");
        }else{
          storage_list = Object.keys(data);
          valid_saves = storage_list.filter(name => name.includes('LRID'));

          //generate a "default" save for the data that was found but not named
          if(valid_saves.length==0)
          {

            chrome.storage.local.get('current_managers', function(season_data) {
              if(typeof season_data.current_managers === 'undefined')
              {    
                  console.log("no data");
              }else{
                option = document.createElement("option");
                option.textContent = "default";
                current_data = "defaultLRID";
                chrome.storage.local.set({'current_data':current_data}, function() {
                }); 
                select_data.appendChild(option);              
              }


            });
         }

         //generate selection menu with stored data
          for(i=0; i < valid_saves.length; i++)
          {
            option = document.createElement("option"); 
            option.textContent = valid_saves[i].replace('LRID','');
            if(data.current_data == valid_saves[i]){
              option.selected = true;
            }
            
            select_data.appendChild(option);
          }
          
          chrome.storage.local.set({[data.current_data]:data.current_managers}, function() {
            console.log(data);
            if(data.current_managers==0)
            is_save_empty = true;
            else{
              is_save_empty = false;
            }
            
            
            toggleButtons();
          }); 
    
        }     
     
    });


      copyButton.addEventListener('click',function(){
      navigator.clipboard.writeText(text.textContent).then(() => {
        //clipboard successfully set
    }, () => {
        //clipboard write failed, use fallback
    });
  
    });




  downloadButton.addEventListener('click',function(){


    downloadFile(text.textContent);

  });
  
  startOvertakes.addEventListener('click',function(){
      chrome.storage.local.get('current_managers', function(data) {
        
        manager = data.current_managers;

        const sortObject = manager => Object.keys(manager).sort().reduce((r, k) => (r[k] = o[k], r), {})
       
        console.log(sortObject);
        string="";
        manager.forEach(element => {
          string+=element.name+": "+get_places_gained(element)+"\n";
        });


        function get_places_gained(driver)
        {
          try {
            return driver.rank[1]-driver.quali;
          } catch (error) {
            //console.log("failed");
          }
        }

        setText(string);

      });


    });
    
    
    
    select_data.addEventListener('change', select_change);
 
    //SELECT CHANGE
    function select_change(){
      toggleText(false);
      chrome.storage.local.get(null, function(data,) {
        selection_opt = select_data.options[select_data.selectedIndex].text+"LRID";
        chrome.storage.local.set({[data.selection_opt]:data.current_managers}, function() {
          chrome.storage.local.set({'current_data':selection_opt});
          console.log("saving current managers in "+data.current_data);               
          chrome.storage.local.get(selection_opt, function(data) {
            chrome.storage.local.set({'current_managers':data[selection_opt]}, function() {
              
              if(data[selection_opt]==0)
                is_save_empty = true;
                else
                is_save_empty = false;

                toggleButtons();
            });
          });
        
        });
      });

      


    }

    //RECAP BUTTON
    recapButton.addEventListener('click', function(){

     
        chrome.storage.local.get('current_managers', function(season_data) {

               //sorting managers by quali
          sortQuali = season_data.current_managers.sort((a,b) =>{
            if(a.quali > b.quali)
            return 1
            else
            return -1
          
          });
           
          race_timings=",";  // time position
          //race_recap = ","; // track position

         //getting the max number of laps completed
          temp_max = sortQuali[0].rank.length;
          for(i=0; i<sortQuali.length; i++)
          { 
            if(temp_max < sortQuali[i].rank.length)
            {
              temp_max = sortQuali[i].rank.length;
            }

          }
          //formating with circuit lap numbers
          for(i=1; i<=temp_max ; i++)
            race_timings += ","+i;  
          
            race_timings +="\n";

                    for(i=0; i<sortQuali.length; i++)
                    {
                      if(sortQuali[i].rank[sortQuali[i].rank.length-1] <= 10)
                      {
                        race_timings+= "Top 10";
                      }
                      //race_recap +=","+sortQuali[i].name +","+ sortQuali[i].race_replay+ "<br>";
                      race_timings +=","+sortQuali[i].name +","+ sortQuali[i].race_time+ "\n";
                      
                    }
          
          //reporttext.textContent=race_timings; 
          setText(race_timings);      
         // downloadFile(race_timings,"race_recap"); 
          

    });
        
    });

    //PIT BUTTON
    pitButton.addEventListener('click',function(){

      
          chrome.storage.local.get('current_managers', function(season_data) {
          season_data.current_managers.sort((a, b) => {
            return a.race_finish - b.race_finish;
        });
          string_format ="";
          for(i=0 ; i< season_data.current_managers.length; i++)
          {
            string_format+=(i+1);
            string_format+=") ";
            string_format+=season_data.current_managers[i].name;
            string_format+=", ";
            string_format+=season_data.current_managers[i].pit_stop.toString();
            string_format+="\n";
            
          }
          setText(string_format);
         // downloadFile(string_format,"pit_history");
    });
      
    });

     //Driver Average
    averageButton.addEventListener('click',function(){

        chrome.storage.local.get('current_managers', function(data) {
          manager = data.current_managers;
            string = "Driver/Rank,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32\n";
  
             manager.forEach(driver => {
               laps_position = Array(32).fill(0);
              for(i=0 ; i <= driver.rank.length ; i++)
              {
                 laps_position[driver.rank[i]-1] += 1;
              }
  
              string+=driver.name+","+laps_position.toString()+"\n";
              //console.log(driver.name+" "+laps_position);
  
            });
  
            setText(string);
          // downloadFile(string,"lap_trend");  
      });
      
    });

    //NEW RACE BUTTON
    newButton.addEventListener('click', function(){
      
      leagueName = prompt("enter league name");
      leagueNameId =leagueName+"LRID"; //LRID is to avoid naming conflicts
      toggleText(false);
      //save before creating new data
      chrome.storage.local.get(null, function(data) { 
        if(!typeof data.current_data === 'undefined')
        {
          chrome.storage.local.set({[data.current_data]:data.current_managers}, function() { 
            console.log("saving :"+data.current_data);
          }); //saving selected


        }

          // = select_data.options[select_data.selectedIndex].text+"LRID";
         
          current_data = leagueNameId;
          option = document.createElement("option");
          option.textContent = leagueName;
          option.selected = true;
          select_data.appendChild(option);
       
          chrome.storage.local.set({[leagueNameId]:0, 'current_managers':0, 'current_data':current_data}, function() {
            is_save_empty = true;
            toggleButtons();
          });                   
                 
      });

    });

    //DELETE BUTTON
    deleteButton.addEventListener('click', function(){
      toggleText(false);
      try {
        opt = select_data.options[select_data.selectedIndex].text+"LRID";
      } catch (error) { 
        alert("nothing to delete");
        return;
      }
     
     
      chrome.storage.local.remove(opt, function() {
        select_data.remove(select_data.selectedIndex); 
        try {
          //after removing try to pick the next element from the html selection
          opt = select_data.options[select_data.selectedIndex].text+"LRID";
        } catch (error) {
          //it means the selection list is empty
          chrome.storage.local.remove("current_managers");
          return;
        }
          chrome.storage.local.get(opt, function(data) {

            console.log(data[opt]);
            if(data[opt]==0 || data[opt]=="undefined")         
              is_save_empty = true;
            else
              is_save_empty = false;
            
            

          chrome.storage.local.set({'current_data':opt,'current_managers':data[opt]},function(){
            toggleButtons();
          });

        });
        
        
        
      });


    });

  });


      //DOWNLOAD DATA
function downloadFile(data,download_name){
  var blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, "test");
  } else {
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", download_name);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }
}
  
  