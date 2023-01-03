document.addEventListener('DOMContentLoaded', function() {

     startOvertakes = document.getElementById('start');
     deleteButton = document.getElementById('delete');
     select = document.getElementById('select');
     newButton = document.getElementById('new');
     recapButton = document.getElementById('recap');
     averageButton = document.getElementById('average');
     pitButton = document.getElementById('pit'); 
     text = document.getElementById('text'); 
     downloadButton= document.getElementById('down'); 
     copyButton= document.getElementById('copy'); 
     pitLossButton= document.getElementById('averagePit'); 

     
     driver = 0;
     is_save_empty = true;

    restore_options();


     function restore_options() {
      
      chrome.storage.local.get({
        language: 'eng',
      }, function(items) {
        
        recapButton.textContent = lang[items.language].RaceReport;
        startOvertakes.textContent = lang[items.language].StartOvertakes;
        deleteButton.textContent =lang[items.language].delete;
        newButton.textContent =lang[items.language].newRace;
        
        averageButton.textContent =lang[items.language].heatMap;
        pitButton.textContent =lang[items.language].PitReport;
        downloadButton.textContent =lang[items.language].downloadText;
        copyButton.textContent =lang[items.language].copyText;

      });
    }



   async function disableButton(yes)
    {

     if(yes){
        recapButton.disabled = true;
        averageButton.disabled = true;
        pitButton.disabled = true;
        startOvertakes.disabled= true;
        pitLossButton.disabled=true;
      }
      else{
        recapButton.disabled = false;
        averageButton.disabled = false;
        pitButton.disabled = false;
        startOvertakes.disabled= false;
        pitLossButton.disabled=false;
      }
    }
    
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


//-------------------------------------------------------------------------------Popup initialization-------------------------------------------
    chrome.storage.local.get(null, function(data) {

        if(data.active == null)
        {            
          console.log("data not found");
          disableButton(true);
        }else{
          storage_list = Object.keys(data);
          valid_saves = storage_list.filter(name => name.includes('LRID'));

          //generate a "default" save for the data that was found but not named
          if(valid_saves.length==0)
          {

            chrome.storage.local.set({'RaceLRID':data.active}); 
            option = document.createElement("option");
            option.textContent = "Race";
            //set 
            chrome.storage.local.set({'active_option':"RaceLRID"}); 
            select.appendChild(option);              
  
         }

         //generate selection menu with stored data
          for(i=0; i < valid_saves.length; i++)
          {
            option = document.createElement("option"); 
            option.textContent = valid_saves[i].replace('LRID','');
            if(data.active_option == valid_saves[i])
            {
              option.selected = true;
              chrome.storage.local.set({[data.active_option]:data.active});
            }
              
            
            select.appendChild(option);
          }
          
          if(data.active==0)
            disableButton(true);
          else
              disableButton(false);
            
            
       
            driver = data.active;
        }     
     
    });

//-------------------------------------------------------------------------------copy button-------------------------------------------
      copyButton.addEventListener('click',function(){
      navigator.clipboard.writeText(text.textContent).then(() => {
        //clipboard successfully set
    }, () => {
        //clipboard write failed, use fallback
    });
  
    });

  //-------------------------------------------------------------------------------pit time loss button-------------------------------------------
    pitLossButton.addEventListener('click',function(){



      
        var manager = driver;
            manager.sort((a, b) => { return a.race_finish - b.race_finish; });
        
        cvsS='';
          for (let i = 0; i < manager.length; i++) {
        
               cvsS+=(manager[i].name+","+arrayToCSV(manager[i].pitTimeLoss))+"\n";
            
          
        }
        setText(cvsS);
        
        
        function arrayToCSV(arr) {
          // check if the array is empty
          if (arr.length === 0) {
            return '';
          }
          
          // initialize a variable to store the CSV string
          let csv = '';
          
          // loop through the array and add each element to the CSV string, separated by a comma
          for (let i = 0; i < arr.length - 1; i++) {
            csv += arr[i] + ',';
          }
          
          // return the CSV string
          return csv;
        }
      


    });

//-------------------------------------------------------------------------------download button-------------------------------------------
  downloadButton.addEventListener('click',function(){
    
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
    downloadFile(text.textContent,"report");

  });
  

  //-------------------------------------------------------------------------------start overtakes-------------------------------------------
  startOvertakes.addEventListener('click',function(){
    //returns rank position at the end of lap 2 - quali position
      chrome.storage.local.get({"overSign":false},function(data){
      isChecked = data.overSign;
if(isChecked)
    sign = -1;
else
    sign = 1;

    function getOvertakes(d){return d.rank[1]-d.quali;}    
    //sort by overtakes
    driver.sort((a, b) => {return getOvertakes(a)-getOvertakes(b);});  
    string_result="";
    driver.forEach(ele => {string_result+=ele.name+": "+getOvertakes(ele)*sign+"\n";});
    //display result
    setText(string_result);
    });

    });
    
   
    
    
   //------------------------------------------------------------------------------select change---------------------------------------------- 
    select.addEventListener('change',async function(){
      toggleText(false);
      //new option of the select
      opt = select[select.selectedIndex].text+"LRID";
      //get state before the select was changed
      data = await chrome.storage.local.get(["active","active_option",opt]);
      //save the active data in the previous option 
      chrome.storage.local.set({[data["active_option"]]:data["active"]});
      //update the active data with the new selected option and save option state
      chrome.storage.local.set({"active_option":opt,"active":data[opt]},function(d)
      {
        if(data[opt]==0)
        disableButton(true);
        else
        disableButton(false);
        
        driver = data[opt];
      });

    });
 

    //------------------------------------------------------------------------------Race report---------------------------------------------- 
    recapButton.addEventListener('click', function(){

      chrome.storage.local.get({"raceSign":false},function(data){
        isChecked = data.raceSign;

 //sorting managers by quali
 sortQuali = driver.sort((a,b) =>{
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
  //lap_timings = race_timings;

          for(i=0; i<sortQuali.length; i++)
          {
            if(sortQuali[i].rank[sortQuali[i].rank.length-1] <= 10)
            {
              race_timings+= "Top 10";
              //lap_timings+="Top 10";
            }
            //race_recap +=","+sortQuali[i].name +","+ sortQuali[i].race_replay+ "<br>";
            if(isChecked)
            {
              raceTime = sortQuali[i].race_time.map(str => str.replace(/\+/g, "-"));
            }else
            raceTime = sortQuali[i].race_time;

            race_timings +=","+sortQuali[i].name +","+ raceTime+ "\n";
            //lap_timings +=","+sortQuali[i].name +","+ sortQuali[i].lap_time+ "\n";
            
          }

//reporttext.textContent=race_timings; 
setText(race_timings);      
// downloadFile(race_timings,"race_recap"); 
        
      });
         
          

    });
        
   

    //------------------------------------------------------------------------------pit report---------------------------------------------- 
    pitButton.addEventListener('click',function(){

      //sort bt race finish
          driver.sort((a, b) => {
            return a.race_finish - b.race_finish;
        });
          string_format ="";
          for(i=0 ; i< driver.length; i++)
          {
            string_format+=(i+1);
            string_format+=",";
            string_format+=driver[i].name;
            string_format+=",";
            string_format+=driver[i].pit_stop.toString();
            string_format+="\n";
            
          }
          setText(string_format);

    });

     //------------------------------------------------------------------------------driver average position---------------------------------------------- 
    averageButton.addEventListener('click',function(){

        chrome.storage.local.get('active', function(data) {
          manager = data.active;
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

    //------------------------------------------------------------------------------new race---------------------------------------------- 
    newButton.addEventListener('click', function(){
      
      leagueName = prompt("enter league name");
      if(leagueName==null)
      {
        return
      }
     
      leagueNameId =leagueName+"LRID"; //LRID is to avoid naming conflicts
      
      toggleText(false);
      //save before creating new data
      chrome.storage.local.get("active", function(data) { 

        if(!typeof data.active === 'undefined')
        {
          chrome.storage.local.set({[data.active_option]:data.active}, function() { 
          console.log("saving :"+data.active_option);
          }); //saving selected


        }

          // = select.options[select.selectedIndex].text+"LRID";
         
        
          option = document.createElement("option");
          option.textContent = leagueName;
          option.selected = true;
          select.appendChild(option);
       
          chrome.storage.local.set({[leagueNameId]:0, 'active':0, 'active_option':leagueNameId}, function() {
         
            disableButton(true);
          });                   
                 
      });

    });

    //------------------------------------------------------------------------------delete---------------------------------------------- 
    deleteButton.addEventListener('click', function(){
      toggleText(false);
      try {
        opt = select.options[select.selectedIndex].text+"LRID";
      } catch (error) { 
        alert("nothing to delete");
        return;
      }
     
     
      chrome.storage.local.remove(opt, function() {
        select.remove(select.selectedIndex); 
        try {
          //after removing try to pick the next element from the html selection
          opt = select.options[select.selectedIndex].text+"LRID";
        } catch (error) {
          //it means the selection list is empty
          chrome.storage.local.remove("active");
          return;
        }
          chrome.storage.local.get(opt, function(data) {

            console.log(data[opt]);
            if(data[opt]==0 || data[opt]=="undefined")         
              is_save_empty = true;
            else
              is_save_empty = false;
            
            

          chrome.storage.local.set({'active_option':opt,'active':data[opt]},function(){
            disableButton(is_save_empty);
          });

        });
        
        
        
      });


    });

  });




  
  