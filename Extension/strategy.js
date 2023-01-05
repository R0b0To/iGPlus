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

  switch (true) {
   /* case f >= 180:
    case f >= 160:
    case f >= 140:
    case f >= 120:
      return ((f ** -0.089) * 0.679);*/
    case f >= 100:
      return ((f ** -0.0792) * 0.652);
    case f >= 80:
      return ((f ** -0.0819) * 0.66);
    case f >= 60:
      return ((f ** -0.0827) * 0.662);
    case f >= 40:
      return ((f ** -0.0866) * 0.673); //very good
    case f >= 20:
      return ((f ** -0.0889) * 0.678);
    default:
      return ((f ** -0.0971) * 0.696);
  }   }

async function get_eco()
  {
    //request car design
    url = "https://igpmanager.com/index.php?action=fetch&p=cars&csrfName=&csrfToken=";
    response = await request(url);
    car_design = JSON.parse(response);
    fuel_eco = car_design.vars.fuel_economyBar;
    tyre_eco = car_design.vars.tyre_economyBar;
    fuel_lap = fuel_calc(fuel_eco)*track[0];
    eco = [fuel_lap, tyre_eco,fuel_eco];
    return eco;   
}
  
function circuit_info(){
    try {
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
    } catch (error) {
      
    }
   

   

     
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
  
  
  const tyreWearFactors = {
    SS: 2.03,
    S: 1.338,
    M: 1,
    H: 0.824
  };

 const tyreWear  = tyreWearFactors[tyre] || 0.5;
 const t = (1.43 * eco[1] ** -0.0778) * (0.00364 * track[1] + 0.354) * track[0] * 1.384612 * multiplier * tyreWear;

//calculate stint wear
stint = Math.exp(1)**((-t/100*1.18)*laps)*100;
stint2 = (1-(1*((t)+(0.0212*laps-0.00926)*track[0])/100));
for(j=1 ; j<laps ; j++)
{
  stint2 *= (1-(1*((t)+(0.0212*j-0.00926)*track[0])/100));
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


async function injectAdvancedStint(){

  placement = document.getElementsByClassName("fuel");


  async function create_elem(id,name,car){
    
   
    elem = document.createElement("tr");
    elem.id = id;
    row_name = document.createElement("th");
    row_name.textContent=name;
    row_name.style.fontSize =".8em";
    
    if(name=="Push" && car==0){
      
        const defaultPush = [-0.007,-0.002,0,0.002,0.007];
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
         
          pushButton.textContent = lang[language.language].pushText;
          pushButton.addEventListener("click",openPushMenu)

          pushButtonHeader.appendChild(pushButton);

          var pushDiv = document.createElement('div');
          pushDiv.className = "dropdown1-content not-selectable";
          pushDiv.id="myDropdown";

  

        function createPushElement(i,value,step)
        {
          var pushInputDiv = document.createElement("div");
          pushInputDiv.className = "number-input";

      var pushInputLabel = document.createElement('div');
          pushInputLabel.textContent = i;
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
          pushInput.step = step;"0.001";
          pushInput.setAttribute("style","margin: 9px;");

          if(i=="FE")
          pushInput.value = value;
          else
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

      return pushInputDiv;
        }
        fuelEco = createPushElement("FE",eco[2],1);
        pushDiv.appendChild(fuelEco);
          for(var i=5; i>0 ;i--)
          {
          
      p = createPushElement(i,"",0.001);

      pushDiv.appendChild(p);

       
      pushButtonHeader.appendChild(pushDiv);
          
          }
          var tooltipElem = document.createElement('div') 
          tooltipElem.className = "dropdown1-content tooltip1" ;
          //tooltipElem.setAttribute("data-tip","Push level is the ammount of fuel (in liters) that wil be added to the default fuel consumption.");
         
          tooltipElem.textContent = "?";
          tooltipText = document.createElement("span");
          tooltipText.className= "tooltiptext";
          tooltipText.textContent = lang[language.language].pushDescriptionPart1+(eco[0]/track[0]).toFixed(3)+" L/KM. "+lang[language.language].pushDescriptionPart2;
          tooltipElem.appendChild(tooltipText);
          
          pushButtonHeader.appendChild(tooltipElem);


      row_name = pushButtonHeader;
      
      row_name.setAttribute("style","color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%;");
    }
    
    
    elem.appendChild(row_name);
    
    for(var i=1 ; i<placement[car].childElementCount ; i++)
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
       for(var j=5 ; j>0 ; j--) //5 push options
        {
          var pushOption = document.createElement('option');
          pushOption.textContent = "PL"+j;
          
          if(j==3)
          pushOption.selected = true; //pre select middle push

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
var  stintId = document.getElementsByName("stintId");
var strategyCar = document.getElementsByName("dNum")[0].value;
  placement = document.getElementById("fuelLapsPrediction");
  if(placement.childElementCount<1){
    fuel= parseInt(document.getElementsByClassName("igpNum m")[0].textContent);
    real = document.createElement("span");
    real.style.color = "darkcyan";
    real.style.position = "fixed";

    if(strategyCar==1)
   var p=document.getElementById("push");
   else
   var p=document.getElementById("push 2");

   var selectedPush=parseFloat( p.childNodes[stintId[0].value].childNodes[0].value);
  
    feOverwrite = document.getElementById("PLFE").value;
    real.textContent= " ("+(fuel/(((fuel_calc(feOverwrite))+selectedPush)*track[0])).toFixed(3)+")";
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
  // Extract league length from rules
  league_length = /(?<=chronometer<\/icon> ).\d+/gm.exec(rules)[0];

  const multipliers = {
    100: 1,
    75: 1.33,
    50: 1.5,
    25: 3
  };
  return multipliers[league_length] || 1;
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
    //console.log(document.URL);
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
    language = await chrome.storage.local.get({language: 'eng'});
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
  
  
  
  injectAdvancedStint().then(()=> {
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
  for(i=1 ; i<t_stint.childElementCount ;i++){
    t_stint.childNodes[i].textContent = (stint_wear(i,carNumber));
  }
  
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
        var totalLaps = 0;
        for(var i=1 ;i<p2.childElementCount ; i++)
        {
          if(f[1].childNodes[i].style.visibility=="visible")
          {
            var selectedPush = parseFloat(p2.childNodes[i].childNodes[0].value);
            var stintLaps = parseInt(f[1].childNodes[i].textContent); //laps of each stint
            totalLaps+=stintLaps;
            feOverwrite = document.getElementById("PLFE").value;
            totalFuel += (((fuel_calc(feOverwrite))+selectedPush)*track[0])*stintLaps;
          }
          
        }

        try {
          document.getElementById("d2TotalLaps").textContent = totalLaps;
          document.getElementById("fuelEst2").textContent = "Fuel: "+totalFuel.toFixed(2);
        } catch (error) {
          return totalFuel.toFixed(2);
        }
        

      }
        
        var totalFuel = 0;
        var totalLaps = 0;
   
        for(var i=1 ;i<p.childElementCount ; i++)
        {
          if(f[0].childNodes[i].style.visibility=="visible")
          {
            var selectedPush = parseFloat(p.childNodes[i].childNodes[0].value);
            var stintLaps = parseInt(f[0].childNodes[i].textContent);
            totalLaps += stintLaps;
            feOverwrite = document.getElementById("PLFE").value;
            totalFuel += (((fuel_calc(feOverwrite))+selectedPush)*track[0])*stintLaps;
          }
          
        }
   try {
        document.getElementById("d1TotalLaps").textContent = totalLaps;
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
language = "eng";
 main();
 

 window.onclick = function(event) {
  try {
    if(!document.getElementById('myDropdown').contains(event.target)&&!event.target.matches('.dropbtn1')&&!event.target.matches('.tooltip1')&&!event.target.matches('.tooltiptext'))
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
  } catch (error) {
    
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

      // update the selections options with the new pushes
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

  addMoreStints();
  
  function addMoreStints()
  {
      var carNumber = document.getElementsByClassName("fuel").length;


      if(carNumber==2)
      addExtraStintButton(2);

      addExtraStintButton(1);

//add an event listener to plus button and a counter next to it
//id is used for handling 2 cars strategies
    function addExtraStintButton(id)
    {

      if(document.getElementById("extra "+id)==null){
      addStint = document.createElement("div");
      addStint.textContent = "+";
      var stintCounter = document.createElement("div");
      stintCounter.textContent = -1;
      addStint.appendChild(stintCounter);
      addStint.id="extra "+id;
      addStint.setAttribute("style","left: 140px;position: relative; visibility:hidden");
     
      
      carPits = document.getElementById("d"+id+"strategy").childNodes[2];

      var stops = parseInt(carPits.textContent.match(/\d+/)[0]);
        if(stops>3)
        {
          stintCounter.textContent=0;
          carPits.childNodes[0].childNodes[2].setAttribute("style","background-color: firebrick;opacity: 100!important;");
        }
        

      carPits.childNodes[0].childNodes[2].addEventListener("touchstart",injectExtraStints);
      carPits.childNodes[0].childNodes[2].addEventListener("click",injectExtraStints);

      carPits.childNodes[0].childNodes[0].addEventListener("click",removeStints);
      carPits.childNodes[0].childNodes[0].addEventListener("touchstart",removeStints);
      carPits.childNodes[0].appendChild(addStint)
      }
   

    }

    

    function removeStints()
    {
      //console.log('pressed minus with '+this.nextElementSibling.textContent[0]);
      var pits = this.nextElementSibling.textContent.match(/\d+/)[0];

      if(pits==3)
      {
        //console.log("removing style");
        this.nextElementSibling.nextElementSibling.setAttribute("style","background-color:#6c7880");
      }

      var extraStints =parseInt(this.parentElement.lastChild.childNodes[1].textContent);
      if(extraStints>=1){
        extraStints--;
        this.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan--;
        if(extraStints==0)
        {
          //console.log("hiding");
          this.nextSibling.nextElementSibling.nextElementSibling.style.visibility="hidden";
        }
        
          var pits = this.nextElementSibling.textContent.match(/\d+/)[0];
          pits--;
          this.nextElementSibling.textContent.replace(/[0-9]/g, pits);
  
        driver = this.parentElement.parentElement.parentElement;
        var strategyTable = driver.childNodes[3].childNodes[0];
        strategyTable.childNodes[0].lastChild.remove();
        strategyTable.childNodes[1].lastChild.remove();
        strategyTable.childNodes[3].lastChild.remove();
        strategyTable.childNodes[5].lastChild.remove();
        strategyTable.childNodes[6].lastChild.remove();

      
     
      this.parentElement.lastChild.childNodes[1].textContent = extraStints;
      
      if(extraStints==0)
      {
        this.className = "minus";
        this.setAttribute("style","background-color:#6c7880")
      }

      
      }
      else if(extraStints==0)
      this.parentElement.lastChild.childNodes[1].textContent=-1;
      




    }


  }

  function injectExtraStints(){

    var pits = this.previousElementSibling.textContent.match(/\d+/)[0];

    if(pits>=4 && parseInt(this.nextElementSibling.lastChild.textContent)>-1)
    {

    numberOfExtraPits = parseInt(this.nextElementSibling.lastChild.textContent);

    var minus = this.nextElementSibling.parentElement.firstChild;
    minus.className= "minus disabled";
    minus.setAttribute("style","background-color: firebrick;opacity: 100!important;");
    this.nextElementSibling.setAttribute("style","visibility:visible");
    if(numberOfExtraPits<2 && numberOfExtraPits>-1){

    this.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan++;

    this.nextElementSibling.childNodes[1].textContent = numberOfExtraPits+1; 
    var driver = this.nextElementSibling.parentElement.parentElement.parentElement;
    var strategyTable = driver.childNodes[3].childNodes[0];
    //clone last pit 
    var pitRow = strategyTable.childNodes[0];
    var pitTh = pitRow.lastChild.cloneNode(true);
    var lastpit = parseInt(pitTh.textContent.match(/\d+/)[0]);
    lastpit++;
    pitTh.textContent = pitTh.textContent.replace(/[0-9]/g, lastpit);
    pitRow.appendChild(pitTh);

    //clone last tyre 
    var tyreRow= strategyTable.childNodes[1];
    var clonedTyre = tyreRow.lastChild.cloneNode(true);
    clonedTyre.childNodes[0].name = "tyre"+(parseInt(clonedTyre.childNodes[0].name.match(/\d+/)[0])+1);
    clonedTyre.addEventListener("click",openTyreDialog);
    tyreRow.appendChild(clonedTyre);
    //clone last lap
    var lapsRow = strategyTable.childNodes[3];
    var clonedLap = lapsRow.lastChild.cloneNode(true);
    clonedLap.childNodes[1].name = "fuel"+(parseInt(clonedLap.childNodes[1].name.match(/\d+/)[0])+1);
    clonedLap.childNodes[2].name = "laps"+(parseInt(clonedLap.childNodes[2].name.match(/\d+/)[0])+1);
    lapsRow.appendChild(clonedLap);
     //clone last push 
    var pushRow = strategyTable.childNodes[5];
    var clonedPush = pushRow.lastChild.cloneNode(true);
    clonedPush.addEventListener("change",updateFuel)
    pushRow.appendChild(clonedPush);
    //clone last wear 
    var wearRow = strategyTable.childNodes[6];
    var clonedWear = wearRow.lastChild.cloneNode(true);
    wearRow.appendChild(clonedWear);
    }
    }else if(pits==4 && parseInt(this.nextElementSibling.lastChild.textContent)==-1)
    {
      this.setAttribute("style","background-color: firebrick;opacity: 100!important;");
      this.nextElementSibling.lastChild.textContent = 0;
    }


    
  }


  function openTyreDialog(){

  var tyre = this.className;
  var stintId = this.lastChild.name.match(/\d+/)[0];
  var fuelL = this.parentElement.parentElement.childNodes[3].childNodes[stintId].childNodes[1].value;
  var laps = this.parentElement.parentElement.childNodes[3].childNodes[stintId].textContent;
  this.parentElement.childNodes[2].click();
  var tyreD = document.getElementById("tyreSelect").childNodes[0].childNodes[0];
  document.getElementsByName("stintId")[0].value = stintId; 
  var dialog = document.getElementById("stintDialog");
  dialog.childNodes[0].childNodes[0].textContent = "Pit "+(stintId-1); // name of dialog stint

  if(document.getElementById("fuelLapsPrediction").parentElement.parentElement.className==" hide")
    document.getElementById("tyreSelect").childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[1].textContent = laps;
  else
    document.getElementById("tyreSelect").childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[1].textContent = fuelL;


    var event = new MouseEvent('mousedown', {
      'view': window,
      'bubbles': true,
      'cancelable': true,
  
  });
  var event2 = new MouseEvent('mouseup', {
    'view': window,
    'bubbles': true,
    'cancelable': true,

});
//simulate changing fuel to update values
    dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[0].dispatchEvent(event);
    dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[0].dispatchEvent(event2);
    dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[2].dispatchEvent(event);
    dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[2].dispatchEvent(event2);

for(var i=0 ; i<6 ; i++)
{
  if(tyreD.childNodes[i].id!=tyre)
  {
    tyreD.childNodes[i].className = "inactive";
  }else
  tyreD.childNodes[i].className = "";
}



  }

  function injectCircuitMap(){

    if(document.getElementById("customMap")==null)
    {
    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    code = /[^-]+(?=">)/g.exec(circuit)[0];
    target = document.getElementById("stintDialog");
    circuit = document.createElement("img");
    circuit.id = "customMap";
    
    circuit.src= chrome.runtime.getURL('images/circuits/'+code+'.png');
    circuit.setAttribute("style","width:100%;");
    target.parentNode.insertBefore(circuit, target.nextSibling);

    }
  }

  injectCircuitMap();