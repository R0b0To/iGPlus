
document.addEventListener('DOMContentLoaded', function() {

    var deleteButton = document.getElementById('delete');
    var select_data = document.getElementById('select');
    var newButton = document.getElementById('new');
    var recapButton = document.getElementById('recap');
    var averageButton = document.getElementById('average');
    var pitButton = document.getElementById('pit'); 

//get names of save data
    chrome.storage.local.get(null, function(data) {

        if(typeof data.current_managers === 'undefined')
        {    
          console.log("data not found");  
        }else{
          storage_list = Object.keys(data);
          valid_saves = storage_list.filter(name => name.includes('LRID'));
          //console.log(storage_list);
          if(valid_saves.length==0){

            chrome.storage.local.get('current_managers', function(season_data) {
              //console.log(season_data.current_managers);
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

        // alert(data.current_data);
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
          }); 
          


        }
     
    });


    select_data.addEventListener('change', select_change);
 
    //SELECT CHANGE
    function select_change(){
 
      
      chrome.storage.local.get(null, function(data,) {
        //console.log(data);
        //console.log("saving this: "+data.current_data);
        current_data = select_data.options[select_data.selectedIndex].text+"LRID";
        chrome.storage.local.set({[data.current_data]:data.current_managers}, function() {
          chrome.storage.local.set({'current_data':current_data});

          console.log("saving current managers in "+data.current_data);  
          //console.log("loading "+current_data);                
          chrome.storage.local.get(current_data, function(data) {
            //console.log(data[current_data]);  
            chrome.storage.local.set({'current_managers':data[current_data]}, function() {
                              
             });
          });
        
        });
      });

      



    }

 

    //RECAP BUTTON
    recapButton.addEventListener('click', function(){
      chrome.storage.local.get('current_managers', function(season_data) {

        if(typeof season_data.current_managers === 'undefined' || season_data.current_managers === 0)
        {
            console.log("empty");     
        }else{

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
          
          //reporttext.innerHTML=race_timings;       
          downloadFile(race_timings,"race_recap");






          arr_constr = season_data.current_managers;

          try {
            
            EHunt =  arr_constr.find( driver => driver.id ==="9934136");
            JHill= arr_constr.find( driver => driver.id ==="10493073");
            PRopane= arr_constr.find( driver => driver.id ==="10992984");
            ASenna= arr_constr.find( driver => driver.id ==="11108378");
            VAhlström= arr_constr.find( driver => driver.id ==="10695650");
            MLindström= arr_constr.find( driver => driver.id ==="7849804");
            
            APolster= arr_constr.find( driver => driver.id ==="10852487");
            //VMelky= arr_constr.find( driver => driver.id ==="11084714");           
            LJames= arr_constr.find( driver => driver.id ==="10141502");
            MSchumacher = arr_constr.find( driver => driver.id ==="10420126");       
                   
            RGrosjean = arr_constr.find( driver => driver.id ==="7801931");
            JMoss = arr_constr.find( driver => driver.id ==="11288723");           
            IUrgant = arr_constr.find( driver => driver.id ==="11257173");
           
           
            //NReinhardt = arr_constr.find( driver => driver.id ==="11235538");           
            
            KKobayashi = arr_constr.find( driver => driver.id ==="10597638");
            AProst = arr_constr.find( driver => driver.id ==="10306030");
            JClark = arr_constr.find( driver => driver.id ==="11336399");
            MJimenez = arr_constr.find( driver => driver.id ==="9835761");
            GFisichella = arr_constr.find( driver => driver.id ==="10726168");
            MVerstappen = arr_constr.find( driver => driver.id ==="10677651");
            HÇetin = arr_constr.find( driver => driver.id ==="11213949");
            MRuiz = arr_constr.find( driver => driver.id ==="10565051");         
            

            RDavies = arr_constr.find( driver => driver.id ==="11121385");
            FFernández = arr_constr.find( driver => driver.id ==="10456489");
            JWalker = arr_constr.find( driver => driver.id ==="11068454");
            
            GRussell = arr_constr.find( driver => driver.id ==="11183510");
            JMalik = arr_constr.find( driver => driver.id ==="11178944");
            //SSchmitz = arr_constr.find( driver => driver.id ==="11385632");
            NJones = arr_constr.find( driver => driver.id ==="11429285");
            JWhite = arr_constr.find( driver => driver.id ==="9228440");
            JEvans = arr_constr.find( driver => driver.id ==="9344979");

          } catch (error) {
            console(error);
          }

          lineUpList=(
            (PRopane.rank[1]-PRopane.quali)+"\n"+
            (RDavies.rank[1]-RDavies.quali)+"\n"+
            (JClark.rank[1]-JClark.quali)+"\n"+
            (FFernández.rank[1]-FFernández.quali)+"\n"+
            (EHunt.rank[1]-EHunt.quali)+"\n"+
            (JMoss.rank[1]-JMoss.quali)+"\n"+
            (JWalker.rank[1]-JWalker.quali)+"\n"+
            (" ")+"\n"+
            (ASenna.rank[1]-ASenna.quali)+"\n"+
            (MLindström.rank[1]-MLindström.quali)+"\n"+
            (AProst.rank[1]-AProst.quali)+"\n"+
            (GRussell.rank[1]-GRussell.quali)+"\n"+
            (RGrosjean.rank[1]-RGrosjean.quali)+"\n"+
            (KKobayashi.rank[1]-KKobayashi.quali)+"\n"+
            (MSchumacher.rank[1]-MSchumacher.quali)+"\n"+
            (JMalik.rank[1]-JMalik.quali)+"\n"+
            (APolster.rank[1]-APolster.quali)+"\n"+
            (JHill.rank[1]-JHill.quali)+"\n"+
            (MJimenez.rank[1]-MJimenez.quali)+"\n"+
            (VAhlström.rank[1]-VAhlström.quali)+"\n"+
            (GFisichella.rank[1]-GFisichella.quali)+"\n"+
            (LJames.rank[1]-LJames.quali)+"\n"+
            (HÇetin.rank[1]-HÇetin.quali)+"\n"+
            (MVerstappen.rank[1]-MVerstappen.quali)+"\n"+
            (" ")+"\n"+
            (NJones.rank[1]-NJones.quali)+"\n"+
            (" ")+"\n"+
            (JWhite.rank[1]-JWhite.quali)+"\n"+
            (" ")+"\n"+
            (IUrgant.rank[1]-IUrgant.quali)+"\n"+
            (MRuiz.rank[1]-MRuiz.quali)+"\n"+
            (JEvans.rank[1]-JEvans.quali)
            //(" ")+"\n"+
            );

            console.log(lineUpList);



        }    

    })});


    //PIT BUTTON
    pitButton.addEventListener('click',function(){
      chrome.storage.local.get('current_managers', function(season_data) {

        if(typeof season_data.current_managers === 'undefined' || season_data.current_managers === 0)
        {
            console.log("empty data"); 
                
        }else{
          
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
           // string_format+=",";
            //string_format+=season_data.current_managers[i].race_replay.length;
            string_format+="\n";
            
          }
          
          console.log(string_format);
          
          downloadFile(string_format,"pit_history");

        }    

    })});

     //Driver Average
     averageButton.addEventListener('click',function(){
      chrome.storage.local.get('current_managers', function(data) {

        manager = data.current_managers;
        if(typeof manager === 'undefined' || manager === 0)
        {
            console.log("empty data"); 
                
        }else{

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

          console.log(string);
         downloadFile(string,"lap_trend");

        }    

    })});

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
    //NEW RACE BUTTON
    newButton.addEventListener('click', function(){
      
      leagueName = prompt("enter league name");
      leagueNameId =leagueName+"LRID";
      
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

          });                   
          

        
      });
      


    });


    //DELETE BUTTON
    deleteButton.addEventListener('click', function(){

      try {
        opt = select_data.options[select_data.selectedIndex].text+"LRID";
      } catch (error) {
        alert("nothing to delete");
        return;
      }
     
     
      chrome.storage.local.remove(opt, function() {
        select_data.remove(select_data.selectedIndex); 
        try {
          opt = select_data.options[select_data.selectedIndex].text+"LRID";
        } catch (error) {
          chrome.storage.local.remove("current_managers", function() {});
          return;
        }
        
        
        chrome.storage.local.set({'current_managers':data[opt]}, function() {
                              
        });
      });


    });

  });

  
  