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
    track = circuit_info();
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
      code= getTrackCode();
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
      
        const defaultPush = [-0.007,-0.004,0,0.01,0.02];
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
          pushInputLabel.setAttribute("style","font-size: 0.8rem; color:white;align-self:center;background-color:#96bf86;height:100%;display: flex;width:42px;justify-content: center;align-items: center;");

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
    track = circuit_info();
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

  
    if(document.getElementById("igpXvars")==null)
    {
    varsHolder = document.createElement("div");
    varsHolder.id="igpXvars";
    multiplier = await league_multiplier();
    eco = await get_eco();
    varsHolder.setAttribute("multiplier",multiplier);
    varsHolder.setAttribute("eco",eco)
    document.getElementById("stintDialog").append(varsHolder);
    //document.body.append(varsHolder);
    }
    else{
    vars = document.getElementById("igpXvars").attributes;
    eco = vars.eco.value.split(",");
    multiplier = vars.multiplier.value;

    }
    
  //add event listeners
  add_mutation_observer();
  document.getElementById("beginner-d1PitsWrap").addEventListener("touchstart",update_stint);
  document.getElementById("beginner-d1PitsWrap").addEventListener("click",update_stint);

  if(document.getElementsByClassName("fuel").length>1){
    document.querySelector("#d2strategy > div").addEventListener("touchstart",update_stint);
    document.querySelector("#d2strategy > div").addEventListener("click",update_stint);
  }

  await injectAdvancedStint().then(()=> {
    inject_fuel_info();
})

addMoreStints();
injectCircuitMap();
addSaveButton();
readGSheets();
addFuelSlider();


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

track = circuit_info();
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
    if(!document.getElementById('myDropdown2').contains(event.target)&&!event.target.matches('.sbutton'))
   {
      var dropdowns = document.getElementsByClassName("dropdown2-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show1')) {
          openDropdown.classList.remove('show1');
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
     var  addStint = document.createElement("div");
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

  }
  function hasExtraStint(pitNumber){
    var extraStints = 0;
    if(pitNumber<4)
    extraStints =-1;
    else if(pitNumber == 4)
    extraStints = 0;
    else if(pitNumber>4)
    extraStints = 1;
return extraStints
  }
function removeStints(minusDiv)
    {

     
    if(minusDiv.tagName!="DIV")
    {
      var pits = this.nextElementSibling.textContent.match(/\d+/)[0];
      minusDiv = this;
    }
    else
    pits = minusDiv.nextElementSibling.textContent.match(/\d+/)[0];
     
    var driver = minusDiv.closest("form");
    totalStintNumber = driver.getElementsByClassName("tyre")[0].querySelectorAll('td[style*="visibility: visible"]').length;
    
   //console.log("--------"+totalStintNumber);
      if(totalStintNumber<=5)
      {
        //console.log("removing style");
        minusDiv.nextElementSibling.nextElementSibling.setAttribute("style","background-color:#6c7880");
        minusDiv.nextElementSibling.nextElementSibling.className="plus";
        minusDiv.nextSibling.nextElementSibling.nextElementSibling.style.visibility="hidden";
      }
      if(totalStintNumber<=6)
      {
        minusDiv.nextSibling.nextElementSibling.nextElementSibling.style.visibility="hidden";
      }

      var extraStints =parseInt(minusDiv.parentElement.lastChild.childNodes[1].textContent);
          pitNumber = minusDiv.nextElementSibling.childNodes[0].textContent;
     


        extraStints = hasExtraStint(pitNumber);

     

      if(totalStintNumber>5){
        minusDiv.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan--;
        
        
        driver = minusDiv.parentElement.parentElement.parentElement;
        var strategyTable = driver.childNodes[3].childNodes[0];
        strategyTable.childNodes[0].lastChild.remove();
        strategyTable.childNodes[1].lastChild.remove();
        strategyTable.childNodes[3].lastChild.remove();
        strategyTable.childNodes[5].lastChild.remove();
        strategyTable.childNodes[6].lastChild.remove();

    
        minusDiv.parentElement.lastChild.childNodes[1].textContent = totalStintNumber-6;

        
        if((totalStintNumber-1) == 5)
        {
          minusDiv.className = "minus";
          minusDiv.setAttribute("style","background-color:#6c7880");

        }

      }

  }
  function injectExtraStints(plusDiv){
    return new Promise((resolve, reject) => {
     
      success =false;

      if(plusDiv.tagName!="DIV")
      {
        var pits = this.previousElementSibling.textContent.match(/\d+/)[0];
        plusDiv = this;
      }
      else
      pits = plusDiv.previousElementSibling.textContent.match(/\d+/)[0];
  
  
      var driver = plusDiv.closest("form");
      var pitRow = driver.getElementsByClassName("darkgrey")[0];
      numberOfExtraPits = hasExtraStint(pits);
      
      if(pits>=4 && plusDiv.style.backgroundColor=="firebrick" && pitRow.childElementCount<8)
      {
      
      var minus = plusDiv.nextElementSibling.parentElement.firstChild;
      minus.className= "minus disabled";
      minus.setAttribute("style","background-color: firebrick;opacity: 100!important;");
      plusDiv.nextElementSibling.setAttribute("style","visibility:visible");
  
      if(plusDiv.className == "plus disabled"){
  
        
        var strategyTable = driver.childNodes[3].childNodes[0];
  
        plusDiv.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan++;
  
      //clone last pit 
      
      var pitTh = pitRow.lastChild.cloneNode(true);
      var lastpit = parseInt(pitTh.textContent.match(/\d+/)[0]);
      
      plusDiv.nextElementSibling.childNodes[1].textContent = pitRow.childElementCount-5; 
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
      
      success=true;
      }
      }else if(pits==4)
      {
        plusDiv.setAttribute("style","background-color: firebrick;opacity: 100!important;");
        //plusDiv.nextElementSibling.lastChild.textContent = 0;
      }
      
  

      if (success) {
        resolve(true);
      } else {
        //reject(false);
      }

    });
    
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
async function saveStint()
{
  circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
  code = /[^-]+(?=">)/g.exec(circuit)[0];
  driverStrategy = this.closest("form");
  tyre = driverStrategy.getElementsByClassName("tyre")[0];
  fuel = driverStrategy.getElementsByClassName("fuel")[0];
  push = driverStrategy.querySelector("tr[id*=push]");
  tyreStrategy = tyre.querySelectorAll('td[style*="visibility: visible"]');
  fuelStrategy= fuel.querySelectorAll('td[style*="visibility: visible"]');
  pushStrategy =push.querySelectorAll('td[style*="visibility: visible"]');
    saveData = {track:code,laps:document.getElementById("raceLaps").textContent};
    for(var i=0; i< tyreStrategy.length; i++)
    {
      saveData[i] ={
        tyre:tyreStrategy[i].className,
        laps:fuelStrategy[i].textContent,
        push:pushStrategy[i].childNodes[0].selectedIndex};
    }
    s = hashCode(JSON.stringify(saveData));
    data = await chrome.storage.local.get("save");
   
    if(typeof data.save==="undefined")
    {
    chrome.storage.local.set({"save":{[code]:{[s]:saveData}}});
    }
    else
    {
      if(typeof data.save[code]==="undefined")
      {
         data.save[code] = {[s]:saveData};
      }
      else
          data.save[code][s] = saveData;

      chrome.storage.local.set({"save":data.save});
    }
    document.querySelectorAll(".lbutton").forEach((element) => {
      element.classList.remove("disabled");
    });
    list = document.getElementById("myDropdown2");
    list.classList.remove("show1");
    
    
}
function hashCode(string){
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
      var code = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+code;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
async function loadStint()
{
  document.getElementById("myDropdown2").classList.toggle("show1");
  //this.closest("div").classList.toggle("show1");
  code  = getTrackCode();
  data = await chrome.storage.local.get("save");
  s = data.save[code][this.parentElement.id];
  driverStrategy = this.closest("form");
  pitNum = driverStrategy.querySelectorAll("input[name='numPits']")[0];
  tyre = driverStrategy.getElementsByClassName("tyre")[0];
  fuel = driverStrategy.getElementsByClassName("fuel")[0];
  push = driverStrategy.querySelector("tr[id*=push]");
  wear = driverStrategy.querySelectorAll('tr[id*=tyre] >td');
  tyreStrategy = tyre.querySelectorAll('td');
  fuelStrategy= fuel.querySelectorAll('td');
  pushStrategy =push.querySelectorAll('td');
  pits= driverStrategy.querySelector("div > div.num.green");
  enabledStints = tyre.querySelectorAll('td[style*="visibility: visible"]').length;
  activeStints = tyre.childElementCount-1;
  //-2 because the save object has 2 extra elements
  stints = Object.keys(s).length-2;
  pitText = stints-1;


  pitNum.value = pitText;

  if((pitText)>4)
  pitText = 4;
  pits.childNodes[0].textContent = pitText;

  if(activeStints>5)
  {
    for (let i = 0; i < (enabledStints-stints); i++) {
      removeStints(pits.previousElementSibling);
    }
  }
  
  extraStintstoAdd = (activeStints-stints)


  if(activeStints<stints)
  {
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



    for (let i = 0; i < (5-enabledStints); i++) {
      pits.nextElementSibling.dispatchEvent(event);
      pits.nextElementSibling.dispatchEvent(event2);
      pits.nextElementSibling.setAttribute("style","background-color: firebrick;opacity: 100!important;");
    }
   
    for (let i = 0; i < (stints-5); i++) {
      done = await injectExtraStints(pits.nextElementSibling);
    }
  }
  tyre = driverStrategy.getElementsByClassName("tyre")[0];
  fuel = driverStrategy.getElementsByClassName("fuel")[0];
  push = driverStrategy.querySelector("tr[id*=push]");
  wear = driverStrategy.querySelectorAll('tr[id*=tyre] >td');
  tyreStrategy = tyre.querySelectorAll('td');
  fuelStrategy= fuel.querySelectorAll('td');
  pushStrategy =push.querySelectorAll('td');

  for(var i=stints ; i<5; i++)
  {
    tyreStrategy[i].style.visibility="hidden";
    fuelStrategy[i].style.visibility="hidden";
    pushStrategy[i].style.visibility="hidden";
    wear[i].style.visibility = "hidden"
  }

  for(var i=0; i< stints; i++)
    {
      try {
        
        tyreStrategy[i].className = s[i].tyre;
        tyreStrategy[i].childNodes[0].value = s[i].tyre.substring(3);
        tyreStrategy[i].setAttribute("data-tyre",s[i].tyre.substring(3));
        tyreStrategy[i].style.visibility = "visible";
        
        fuelStrategy[i].childNodes[0].textContent = s[i].laps;
        fuelStrategy[i].style.visibility = "visible";
        fuelStrategy[i].childNodes[1].value = Math.ceil((s[i].laps *eco[0]));
        fuelStrategy[i].childNodes[2].value = s[i].laps;
        
        pushStrategy[i].childNodes[0].selectedIndex = s[i].push;
        pushStrategy[i].style.visibility = "visible";
        
        wear[i].style.visibility = "visible";
      } catch (error) {

      }
      
    }

    if((stints-1)<4)
    {
      pits.nextElementSibling.setAttribute("style","background-color: #6c7880;opacity: 100!important;");
      pits.nextElementSibling.className = "plus";
    }
    if((stints-1)==1)
    {
      pits.previousElementSibling.className = "minus disabled";
    }
    if((stints-1)==4)
    {
      pits.nextElementSibling.setAttribute("style","background-color: firebrick;opacity: 100!important;");
      pits.nextElementSibling.className = "plus disabled";
      pits.previousElementSibling.className = "minus";
    }
    update_stint();
   
}
async function generateSaveList() {

  code = getTrackCode();
  data = await chrome.storage.local.get("save");
  if (typeof data.save[code] === "undefined") {
   //empty
  } else {
    if (Object.keys(data.save[code]).length == 0) {
      console.log("no save");
      document.querySelectorAll(".lbutton").forEach((element) => {
        element.classList.add("disabled");
      });
    } else {
      sList = document.querySelectorAll("#saveList");
      if (sList != null)
        sList.forEach((e) => {e.remove();});
      

      document.querySelectorAll(".lbutton").forEach((element) => {
        element.classList.remove("disabled");
      });
      
      list = document.querySelectorAll("#myDropdown2");
      list.forEach((e) => {
        sList = createSaveDataPreview(data.save[code]);
        e.appendChild(sList)});
    }

  }

}
async function addSaveButton()
{
  if(document.getElementById("save&load")==null)
  {
    function createSaveLoad()
  {
    containerDiv = document.createElement("div");
    containerDiv.id="save&load";
    
    containerDiv.setAttribute("style","position:relative; display: flex;");
    saveDiv = document.createElement("div");
    loadDiv = document.createElement("div");
    loadContainer = document.createElement("div");
    loadContainer.className = "dropdown2-content not-selectable";
    loadContainer.id="myDropdown2";
    
    saveDiv.className = "sbutton";
    loadDiv.className = "sbutton lbutton";
    saveDiv.textContent = "Save";
    loadDiv.textContent = "Load";
    containerDiv.append(loadContainer);
    saveDiv.addEventListener("click",saveStint);
    loadDiv.addEventListener("click",function(){
      generateSaveList();
      this.previousElementSibling.previousElementSibling.classList.toggle("show1");
     
    });
    containerDiv.appendChild(saveDiv);
    containerDiv.appendChild(loadDiv);
    generateSaveList();
    


 return containerDiv;
  }
  
  driverNumber = document.getElementsByClassName("fuel").length;
  if(driverNumber==2)
  {
    strategy = document.getElementById("d2strategy");
    placeHere = strategy.querySelectorAll("th")[0];
    placeHere.appendChild(createSaveLoad());
  }
  strategy =document.getElementById("d1strategy");
  placeHere = strategy.querySelectorAll("th")[0];
  placeHere.appendChild(createSaveLoad());
  }
  
  getTrackCode();
  data = await chrome.storage.local.get("save");

  lb =document.querySelectorAll('.lbutton');
   
  if(typeof data.save==="undefined")
  {
    lb.forEach((ele) => {
      ele.classList.add("disabled");
    });
    
  }
  else
  {
    if(typeof data.save[code]==="undefined")
    {
      lb.forEach((ele) => {
        ele.classList.add("disabled");
      });
    }
  
  }

}
function createSaveDataPreview(s)
{
  function createStint(a,k)
  {
    strategyContainer = document.createElement("tr");
    strategyContainer.setAttribute("style","background-color: #dfdfdf;");
    strategyContainer.id= k;
    deleteB = document.createElement("th");
    deleteB.textContent = "del";
    deleteB.setAttribute("style","background-color: #d66e67; font-size: 1.25rem;font-family: roboto ; color:white");
    deleteB.addEventListener("click",deleteSave);
    strategyContainer.appendChild(deleteB);
    
    for (const key in a) {
      if(!isNaN(key))
      {
      strategy = document.createElement("td");
      strategyL = document.createElement("td");
      strategyL.addEventListener("click",loadStint);
      strategy.addEventListener("click",loadStint);
      strategy.setAttribute("style","height:32px; width:32px;margin:1px; background-color: #dfdfdf;");
      strategyL.setAttribute("style","width:5px; font-size: 1.25rem;color: black;font-family: roboto;margin:1px");
      strategyL.textContent = a[key].laps;
      strategy.className = a[key].tyre;
      strategyContainer.appendChild(strategyL);
      strategyContainer.appendChild(strategy);
      } 
    }
    //console.log(strategyContainer);
    return strategyContainer;
  }
  saveList = document.createElement("tbody")
  saveList.id="saveList";
  

  for (const key in s) {

    saveList.appendChild(createStint(s[key],key));
  }

  saveList.setAttribute("style","height:max-content ;width: max-content;border-collapse: collapse;");
return saveList;

}
async function deleteSave()
{
  saveToDelete = this.parentElement.id;
  circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
  code = /[^-]+(?=">)/g.exec(circuit)[0];
  data = await chrome.storage.local.get("save");
  delete data.save[code][saveToDelete];
  chrome.storage.local.set({"save":data.save});
  document.getElementById(saveToDelete).remove();
  document.getElementById("myDropdown2");
  if(document.getElementById("saveList").childElementCount == 0)
  {
    document.querySelectorAll(".lbutton").forEach((element) => {
      element.className+=" disabled";
    });
  }
  
}
function getTrackCode()
{
  circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
  code = /[^-]+(?=">)/g.exec(circuit)[0];
  return code;
}
function sortTable() {

  n = this.cellIndex;

  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("importedTable");
  switching = true;
  //Set the sorting direction to ascending:
  dir = "asc"; 
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      var cmpX=isNaN(parseInt(x.innerHTML))?x.innerHTML.toLowerCase():parseInt(x.innerHTML);
                var cmpY=isNaN(parseInt(y.innerHTML))?y.innerHTML.toLowerCase():parseInt(y.innerHTML);
cmpX=(cmpX=='-')?0:cmpX;
cmpY=(cmpY=='-')?0:cmpY;
      /*check if the two rows should switch place,
      based on the direction, asc or desc:*/
      if (dir == "asc") {
        if (cmpX > cmpY) {
          shouldSwitch= true;
          break;
      }
      } else if (dir == "desc") {
        if (cmpX < cmpY) {
          shouldSwitch= true;
          break;
      }
      }
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      //Each time a switch is done, increase this count by 1:
      switchcount ++;      
    } else {
      /*If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again.*/
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
async function readGSheets()
{
if(document.getElementById("importedTable")==null)
{
  savedLink = await chrome.storage.local.get({"gLink":""});

  if(savedLink.gLink!="")
  {
t = await chrome.storage.local.get({"gTrack":"track"});
sName = await chrome.storage.local.get({"gLinkName":"Sheet1"});

idRegex =/spreadsheets\/d\/(.*)\/edit/;
link = idRegex.exec(savedLink.gLink)[1]; 
const sheetId = link;
const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
//console.log(sName);
const sheetName = sName.gLinkName;
const query = encodeURIComponent('Select *');
const url = `${base}&sheet=${sheetName}&tq=${query}`;
const data = [];
var output = document.createElement("table");//document.querySelector('.output')
output.setAttribute("style","width: 100%;table-layout: auto;text-align: center;")
output.id="importedTable";
init();
  async function init() {
   await fetch(url)
        .then(res => res.text())
        .then(async rep => {
            //Remove additional text and extract only JSON:
            const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
            //console.log(jsonData);
            const colz = [];
            const tr = document.createElement('tr');
            //Extract column labels
            jsonData.table.cols.forEach((heading) => {  
                if (heading.label) {
                    let column = heading.label;
                    if(column.toLowerCase()==t.gTrack)
                    {
                      column = column.toLowerCase();
                    }
                    colz.push(column);
                    const th = document.createElement('th');
                    th.setAttribute("style",'font-family: "RobotoCondensed","Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;cursor: pointer;background-color: #8f8f8f;color: #ffffff;border-radius: 5px;')
                    th.addEventListener("click",sortTable);
                    th.textContent = column;                              
                    tr.appendChild(th);
                   
                }
            })
            output.appendChild(tr);
            //extract row data:
            jsonData.table.rows.forEach((rowData) => {
                const row = {};
                colz.forEach((ele, ind) => {
                    row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                })
                data.push(row);
            })

           await processRows(data);
        })
        
       
     

        if(document.getElementById("importedTable")==null)
        {
          function removeColumn(table, columnName) {
            // Find the index of the column to remove
            let colIndex = -1;
            for (let i = 0; i < table.rows[0].cells.length; i++) {
              if (table.rows[0].cells[i].textContent === columnName) {
                colIndex = i;
                break;
              }
            }
            
            // If the column was found
            if (colIndex !== -1) {
              // Remove the cells from all rows
              for (let i = 0; i < table.rows.length; i++) {
                table.rows[i].deleteCell(colIndex);
              }
            }
          }
          
         
          document.querySelectorAll(".eight.columns.mOpt.aStrat")[0].append(output);
          removeColumn(output,t.gTrack);
        }


  }
  

  
        
}
 
  async function processRows(json) {
    //console.log(json);
  track = getTrackCode;
  json = await getCurrentTrack(json);
  
    json.forEach((row) => {
        const tr = document.createElement('tr');
        const keys = Object.keys(row);
    
        keys.forEach((key) => {
            const td = document.createElement('td');
            td.textContent = row[key];
            tr.appendChild(td);
        })
        output.appendChild(tr);
    })

}
}

}
async function getCurrentTrack(j){

  jTrack = [];
  var trackToSearch = getTrackCode();
  var trackDictionary  ={
    "au":["australia","au",1],//,//Australia
    "my":["malaysia","my",2],//,//Malaysia
    "cn":["china","cn",3],//,//China
    "bh":["bahrain","bh",4],//,//Bahrain
    "es":["spain","es",5],//,//Spain
    "mc":["monaco","mc",6],//,//Monaco
    "tr":["turkey","tr",7],//,//Turkey
    "de":["germany","de",9],//,//Germany
    "hu":["hungary",'hu',10],//,//Hungary
    "eu":["europe",'eu',11],//,//Europe
    "be":["belgium","be",12],//,//Belgium
    "it":["italy","it",13],//,//Italy
    "sg":["sg","singapore",14],//,//Singapore
    "jp":["japan","jp",15],//,//Japan
    "br":["brazil","br",16],//,//Brazil
    "ae":["abu dhabi","abudhabi",17,"ae"],//,//AbuDhabi
    "gb":["gb","gb 19","great britan",18],//,//Great Britain
    "fr":["france","fr",19],//,//France
    "at":["austria","at",20],//,//Austria
    "ca":["canaada","ca",21],//,//Canada
    "az":["azerbaijan","az",22],//,//Azerbaijan
    "mx":["mexico","mx",23],//,//Mexico
    "ru":["russia","ru",24],//,//Russia
    "us":["usa","us",25]////USA 

};

  j.forEach((ele) =>
  {
    try {
//console.log(ele);
      
      if(isNaN(ele[t.gTrack]))
        requestedTrack = ele[t.gTrack].toLowerCase();
      else
        requestedTrack = ele[t.gTrack];

      if(trackDictionary[trackToSearch].includes(requestedTrack))
            jTrack.push(ele);

    } catch (error) {
      console.log(error);
    }
  });
  
return jTrack;
}

function addFuelSlider(){
  advancedFuel = document.getElementsByName("advancedFuel");
  if(advancedFuel!=null)
  {
    advancedFuel.forEach(car => {
      
      if(car.previousElementSibling.childElementCount<4)
      createSlider(car);

    });
  }

  function createSlider(node){
    nodeText = node.previousElementSibling.childNodes[1]; 
    sliderContainer = document.createElement("div");
    sliderContainer.setAttribute("style","position:absolute;top: -1.7rem;display:none");
    slider = document.createElement("input");
    slider.className = "sliderX";
    slider.type= "range";
    slider.max = 200;
    slider.min = 0;
    slider.value = nodeText.textContent;
    slider.addEventListener("input",function(){this.parentElement.nextElementSibling.nextElementSibling.textContent = this.value;});
    slider.addEventListener("change",function(){this.parentElement.style.display = 'none';this.parentElement.parentElement.nextElementSibling.value = this.value;
    if(this.value == 0)
    {
      driverStrategyId = this.closest("form").id;
      document.getElementsByName("fuel1")[driverStrategyId[1]-1].value = 0
    }
  });
    sliderContainer.append(slider);
  
  
    nodeText.addEventListener("click", function () {
      slider= this.parentElement.childNodes[0];
      if (slider.style.display=== "none")
        slider.style.display= "block";
      else
        slider.style.display= "none";
  
    });
  nodeText.setAttribute("style","border-radius: 50%;background-color: #96bf86;color: #ffffff!important;width: 2rem;height: 2rem;cursor: pointer;");
  
  node.previousElementSibling.prepend(sliderContainer);
  
  }
}

track =circuit_info(); //return [0]length and [1]wear

main();
