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


function fuel_calc(f){
  return ((f** -0.085)*0.671);}

async function get_eco()
  {
    //request car design
    url = "https://igpmanager.com/index.php?action=fetch&p=cars&csrfName=&csrfToken=";
    response = await request(url);
    car_design = JSON.parse(response);
    fuel_eco = car_design.vars.fuel_economyBar;
    tyre_eco = car_design.vars.tyre_economyBar;
    fuel_lap = fuel_calc(fuel_eco)*track[0];
    eco = [fuel_lap, tyre_eco];
    return eco;   
}
  
function circuit_info(){
    
    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    code = /[^-]+(?=">)/g.exec(circuit)[0];

    t ={
      "au":{"length":5.3017135,"wear":40},//Australia
      "my":{"length":5.5358276,"wear":85},//Malaysia
      "cn":{"length":5.4417996,"wear":80},//China
      "bh":{"length":4.7273,"wear":60},//Bahrain
      "es":{"length":4.4580207,"wear":85},//Spain
      "mc":{"length":4.0156865,"wear":20},//Monaco
      "tr":{"length":5.1630893,"wear":90},//Turkey
      "de":{"length":4.1797523,"wear":50},//Germany
      "hu":{"length":3.4990127,"wear":30},//Hungary
      "eu":{"length":5.5907145,"wear":45},//Europe
      "be":{"length":7.0406127,"wear":60},//Belgium
      "it":{"length":5.4024186,"wear":35},//Italy
      "sg":{"length":5.049042,"wear":45},//Singapore
      "jp":{"length":5.0587635,"wear":70},//Japan
      "br":{"length":3.9715014,"wear":60},//Brazil
      "ae":{"length":5.412688,"wear":50},//AbuDhabi
      "gb":{"length":5.75213,"wear":65},//Great Britain
      "fr":{"length":5.882508,"wear":80},//France
      "at":{"length":4.044372,"wear":60},//Austria
      "ca":{"length":4.3413563,"wear":45},//Canada
      "az":{"length":6.053212,"wear":45},//Azerbaijan
      "mx":{"length":4.3076024,"wear":60},//Mexico
      "ru":{"length":6.078335,"wear":50},//Russia
      "us":{"length":4.60296,"wear":65}//USA    
  }

     return [t[code].length,t[code].wear];
}


 /**
 * Returns stint wear after n laps.
 *
 * @param {string} tyre The tyre.
 * @param {number} laps The number of laps.
 * @return {array} tyre wear after laps.
 */
function getWear(tyre,laps){
 
  /**tyre wear formula, 
   * eco[1] is car tyre economy
   * track[1] is track wear
   * track[0] is track length
   * multiplier is league length scaling
  */
  medium_wear =(1.43 *eco[1]  ** -0.0778) * (0.00364 *track[1] +0.354) *track[0]  * 1.384612 * multiplier;
  
  soft_wear = medium_wear*1.338;
  super_wear = medium_wear*2.03;
  hard_wear = medium_wear*0.824;


switch (tyre) {
  case "SS":
    t=super_wear;
  break;
  case "S":
    t=soft_wear;
  break;
  case "M":
    t=medium_wear;
  break;
  case "H":
    t=hard_wear;
  break;
  default:
   return "";
  break;
}

//calculate stint wear
stint = Math.exp(1)**((-t/100*1.18)*laps)*100;
stint2 = (1-(1*((t)+(0.0212*laps-0.00926)*track[0])/100));
for(j=1 ; j<laps ; j++)
{
  stint2 = (stint2-(stint2*((t)+(0.0212*j-0.00926)*track[0])/100));
}
stint2 = stint2*100;

average = ((stint+stint2)/2).toFixed(2);

return average;

}

function openPushMenu(e)
{
  //document.getElementById("myDropdown").classList.toggle("show");
  this.nextSibling.classList.toggle("show");
  this.nextSibling.nextSibling.classList.toggle("show");
  savePush();
}


async function inject_advanced_stint(){

  placement = document.getElementsByClassName("fuel");


  async function create_elem(id,name,car){
    
   
    elem = document.createElement("tr");
    elem.id = id;
    row_name = document.createElement("th");
    row_name.textContent=name;
    row_name.style.fontSize =".8em";
    
    if(name=="Push" && car==0){
      
        const defaultPush = [-0.002,-0.001,0,0.001,0.002];
        pushToUse = [];
      
      
        getPush = await chrome.storage.local.get("pushLevels");
        
        if(getPush.pushLevels!=null)
        pushToUse = getPush.pushLevels;
        else
        pushToUse = defaultPush;
     

      var pushButtonHeader = document.createElement('th');
          pushButtonHeader.className = "dropdown1";

      var pushButton = document.createElement('div');
          pushButton.className ="dropbtn1";
          pushButton.textContent = "Push";
          pushButton.addEventListener("click",openPushMenu)

          pushButtonHeader.appendChild(pushButton);

          var pushDiv = document.createElement('div');
          pushDiv.className = "dropdown1-content not-selectable";
          pushDiv.id="myDropdown";

          //push list
          for(var i=5; i>0 ;i--)
          {
          
      var pushInputDiv = document.createElement("div");
          pushInputDiv.className = "number-input";

      var pushInputLabel = document.createElement('div');
          pushInputLabel.textContent = "PL"+i;
          pushInputLabel.setAttribute("style","font-size: 0.8rem; color:white;align-self:center;background-color:#669999;height:100%;display: flex;width:42px;justify-content: center;align-items: center;");

      var pushInputDown = document.createElement('div');
          pushInputDown.textContent = "−";
          pushInputDown.setAttribute("style","font-size:xx-large; color:black; width: 40px;")
          pushInputDown.addEventListener('click',function(){
            this.parentNode.querySelector('input[type=number]').stepDown()
          });

      var pushInput = document.createElement('input');
          pushInput.id= "PL"+i;
          pushInput.type = "number";
          pushInput.step ="0.001";
          pushInput.setAttribute("style","margin: 9px;");
          pushInput.value = pushToUse[i-1];
          

      var pushInputUp = document.createElement('div');
          pushInputUp.setAttribute("style","font-size:xx-large; color:black; width: 40px;")
          pushInputUp.textContent="+";
          pushInputUp.addEventListener('click',function(){
            this.parentNode.querySelector('input[type=number]').stepUp()
          });

      pushInputDiv.appendChild(pushInputLabel);
      pushInputDiv.appendChild(pushInputDown);
      pushInputDiv.appendChild(pushInput);
      pushInputDiv.appendChild(pushInputUp);

      pushDiv.appendChild(pushInputDiv);

       
      pushButtonHeader.appendChild(pushDiv);
          
          }
          var tooltipElem = document.createElement('div') 
          tooltipElem.className = "dropdown1-content tooltip1" ;
          //tooltipElem.setAttribute("data-tip","Push level is the ammount of fuel (in liters) that wil be added to the default fuel consumption.");
         
          tooltipElem.textContent = "?";
          tooltipText = document.createElement("span");
          tooltipText.className= "tooltiptext";
          tooltipText.textContent = 'Each PL indicates the fuel amount (in liters) that will be added to the fuel consumption. Your fuel consuption is '+(eco[0]/track[0]).toFixed(3)+" L/KM. The PL selection does not change the stints push for the race";
          tooltipElem.appendChild(tooltipText);
          
          pushButtonHeader.appendChild(tooltipElem);


      row_name = pushButtonHeader;
      
      row_name.setAttribute("style","color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%;");
    }
    
    
    elem.appendChild(row_name);
    
    for(i=1 ; i<6 ; i++)
    {
      var stint = document.createElement("td");
      if(name=="Fuel")
      stint.textContent= stint_fuel(i);
     
      if(name=="Wear")
      {
       // console.log("placing at "+car);
        tyre = placement[car].previousElementSibling.childNodes[i].childNodes[0].value;
        laps = placement[car].childNodes[i].textContent;
        w = getWear(tyre,laps);
        
       
        stint.style.visibility = placement[car].childNodes[i].style.visibility;
        stint.textContent= w;
      }
      if(name=="Push")
      {

        var pushSelect = document.createElement("select");
            pushSelect.setAttribute("Style","margin-bottom:0px; margin: -10px;padding: 7px;");
            pushSelect.addEventListener("change",updateFuel);
       for(var j=5 ; j>0 ; j--)
        {
          var pushOption = document.createElement('option');
          pushOption.textContent = "PL"+j;
          
          if(j==3)
          pushOption.selected = true;

          pushOption.value = pushToUse[j-1];
          pushOption.className = "OPL"+j;
          pushSelect.appendChild(pushOption);
        }

        stint.appendChild(pushSelect);
        stint.style.visibility = placement[car].childNodes[i].style.visibility;
        //stint.textContent= "text";
      }

     
      try {
        elem.appendChild(stint);
      } catch (error) {
              console.log(error);

      }
      
    }

try {
 
  if(document.getElementById(id)==null)
  {
    //console.log("placing "+id+" at "+car);
    //console.log(document.getElementById(id));
    placement[car].parentElement.insertBefore(elem,placement[car].parentElement.childNodes[5]); 
  }
   
} catch (error) {
  console.log(error);
}

    //return elem;
  }

  function stint_fuel(stint_number){
    return (eco[0]*placement[0].childNodes[stint_number].textContent).toFixed(2);
  }
  

  //Order and timing is important.
  //First create the elements for 1 car
  //Then check if car 2 is present. Create elements if true
  create_elem("tyre wear","Wear",0)
  await create_elem("push","Push",0).then(()=> {
    if(placement.length>1){
      create_elem("tyre wear2","Wear",1);
      create_elem("push 2","Push",1);
    }
    
})
  
  //create_elem("push 2","Push",1);
}


function inject_estimated(){
  
  placement = document.getElementById("fuelLapsPrediction");
  if(placement.childElementCount<1){
    fuel= document.getElementsByClassName("igpNum m")[0].textContent;
    real = document.createElement("span");
    real.style.color = "darkcyan";
    real.style.position = "fixed";
    real.textContent= " ("+(fuel/eco[0]).toFixed(2)+")";
    placement.appendChild(real);
    //placement.textContent = ;
  }
  
}

async function league_multiplier()
{
  //extract league id from page
  league = document.querySelector("#mLeague").href;
  league_id= /(?<=id=).*/gm.exec(league)[0];
  //request league page
  league_info = await request("https://igpmanager.com/index.php?action=fetch&p=league&id="+league_id+"&csrfName=&csrfToken=");
  rules = JSON.parse(league_info).vars.rules;
  league_lenght = /(?<=chronometer<\/icon> ).\d+/gm.exec(rules)[0];

  //wear multiplier (testing)
  if(league_lenght==100) //correct
  return 1;
  if(league_lenght==75)
  return 1.33;
  if(league_lenght==50)
  return 1.5;
  if(league_lenght==25)
  return 3;
}

function add_mutation_observer(){

  //add eventlistener to the opened dialog and inject first estimate
  function addEvent()
  {
    change_fuel = document.getElementsByClassName("igpNum m")[0];
    change_fuel.addEventListener("click",inject_estimated);
    change_fuel.addEventListener("touchstart",inject_estimated);
    inject_estimated();

  }

  function removeObserver(observer){
    console.log(document.URL);
    if(document.URL!="https://igpmanager.com/app/p=race" && document.URL!="https://igpmanager.com/app/p=race&tab=strategy")
        {
          observer.disconnect();
          console.log("removed");
        }
  }

  const config = { attributes: true, attributeFilter : ['style'] };
  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {     
      if (mutation.type === 'attributes') {
        
       // console.log(mutation.target.style.visibility);
      if(mutation.target.style.visibility=="visible"){
        if(document.URL=="https://igpmanager.com/app/p=race")
        {
          addEvent();
          update_stint();
          updateFuel();
        }else if(document.URL=="https://igpmanager.com/app/p=race&tab=strategy")
        {
          addEvent();

        }else{
          //remove mutation observer when opening the dialog from a different page
          observer.disconnect();       
        }
      }else{
        update_stint();
        updateFuel();
        //page double refresh when changing tabs, wait for final page
        //remove mutation observer when user is not doing the strategy
        setTimeout(removeObserver,300,observer);
        
      }
      
      }
    }
  };
  
  change_laps = document.getElementById("modal-wrap");
  observer = new MutationObserver(callback); 
  observer.observe(change_laps, config);

}



async function main(){
 
  try {

    eco = await get_eco();
  
  multiplier = await league_multiplier();
  
  //add event listeners
  add_mutation_observer();
  document.getElementById("beginner-d1PitsWrap").addEventListener("touchstart",update_stint);
  document.getElementById("beginner-d1PitsWrap").addEventListener("click",update_stint);

  if(document.getElementsByClassName("fuel").length>1){
    document.querySelector("#d2strategy > div").addEventListener("touchstart",update_stint);
    document.querySelector("#d2strategy > div").addEventListener("click",update_stint);
  }
  
  
  
  inject_advanced_stint().then(()=> {
    inject_fuel_info();
})
 

  } catch (error) {
    console.log(error);
  }

}

function update_stint()
{
  
  let driverStrategy = document.getElementsByClassName("fuel");
  updateFuel();


// check if the manager is in a 2 cars league
  if(driverStrategy.length>1)
  updateWearText("tyre wear2");

  updateWearText("tyre wear");

  
function updateWearText(id)
{
  let carNumber = 0;
  if(id=="tyre wear2")
     carNumber=1;

  t_stint = document.getElementById(id);
  for(i=1 ; i<6 ;i++)
  t_stint.childNodes[i].textContent = (stint_wear(i,carNumber));
}

  
function stint_wear(stint_number,car){

  tyre = driverStrategy[car].previousElementSibling.childNodes[stint_number].childNodes[0].value;
  laps = driverStrategy[car].childNodes[stint_number].textContent;
  return getWear(tyre,laps);
}


}
function updateFuel()
    {
      
        f = document.getElementsByClassName("fuel");
     
        if(f.length==2)
          p = document.getElementById("push");
        
        if(f.length==1)
          p = document.getElementById("push");


      if(f.length==2)
      {
        p2 = document.getElementById("push 2");
        var totalFuel = 0;
        for(var i=1 ;i<6 ; i++)
        {
          if(f[1].childNodes[i].style.visibility=="visible")
          {
            var selectedPush = parseFloat(p2.childNodes[i].childNodes[0].value);
            var stintLaps = parseInt(f[1].childNodes[i].textContent);
            totalFuel += (((eco[0]/track[0])+selectedPush)*track[0])*stintLaps;
          }
          
        }

        try {
          document.getElementById("fuelEst2").textContent = "Fuel: "+totalFuel.toFixed(2);
        } catch (error) {
          return totalFuel.toFixed(2);
        }
        

      }
        
        var totalFuel = 0;
   
        for(var i=1 ;i<6 ; i++)
        {
          if(f[0].childNodes[i].style.visibility=="visible")
          {
            var selectedPush = parseFloat(p.childNodes[i].childNodes[0].value);
            var stintLaps = parseInt(f[0].childNodes[i].textContent);
            totalFuel += (((eco[0]/track[0])+selectedPush)*track[0])*stintLaps;
          }
          
        }
   try {
    
        document.getElementById("fuelEst").textContent = "Fuel: "+totalFuel.toFixed(2);
   } catch (error) {
    return totalFuel.toFixed(2);
   }
    }

async function inject_fuel_info() {
    
    elem = document.createElement("div");
    elem.setAttribute("style","color:white; font-family:RobotoCondensedBold; font-size:.9em;");
    elem.id = "fuelEst";
    //race_laps = parseInt(document.getElementById("raceLaps").textContent);
   
    if(document.getElementsByClassName("fuel").length>1)
    {
      
      elem2 = document.createElement("div");
      elem2.setAttribute("style","color:white; font-family:RobotoCondensedBold; font-size:.9em;");
      elem2.id = "fuelEst2";
      placement = document.getElementById("d2TotalLaps").parentElement; //location of the elem
      elem2.textContent = "Fuel: "+updateFuel();
      if(placement.childElementCount == 1)  
        placement.appendChild(elem2)
    }
    
    elem.textContent = "Fuel: "+updateFuel();
    placement = document.getElementById("d1TotalLaps").parentElement; //location of the elem

    if(placement.childElementCount == 1)  
        placement.appendChild(elem)
    

 }
 
//global variables
multiplier = 1;
track = circuit_info(); //return [0]length and [1]wear
 eco = [];

 main();
 

 window.onclick = function(event) {
  if(!document.getElementById('myDropdown').contains(event.target)&&!event.target.matches('.dropbtn1'))
   {
    

      var dropdowns = document.getElementsByClassName("dropdown1-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          savePush();
          openDropdown.classList.remove('show');
        }
      }
    }
  }

  function savePush(){
    var pl = [];
    pl.push(document.getElementById("PL1").value);
    pl.push(document.getElementById("PL2").value);
    pl.push(document.getElementById("PL3").value);
    pl.push(document.getElementById("PL4").value);
    pl.push(document.getElementById("PL5").value);

    chrome.storage.local.set({"pushLevels":pl}, function() { 
      
      });

      for(var j=0 ; j<5 ; j++)
      {
        option = document.getElementsByClassName("OPL"+(j+1));
        for(let item of option)
        {
          //console.log("updating: "+item.className+" with: "+(j));
          item.value = pl[j];
        }
          
        
      }
      updateFuel();
  }

  