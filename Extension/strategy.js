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
      "be":{"length":7.041,"wear":60},//Belgium
      "it":{"length":5.401,"wear":35},//Italy
      "sg":{"length":5.049,"wear":45},//Singapore
      "my":{"length":5.536,"wear":85},//Malaysia
      "jp":{"length":5.058,"wear":70},//Japan
      "us":{"length":4.602,"wear":65},//USA
      "mx":{"length":4.308,"wear":60},//Mexico
      "br":{"length":3.971,"wear":60},//Brazil
      "ae":{"length":5.41 ,"wear":50},//AbuDhabi
      "bh":{"length":4.726,"wear":60},//Bahrain
      "eu":{"length":5.59 ,"wear":45},//Europe
      "de":{"length":4.179,"wear":50},//Germany
      "es":{"length":4.457,"wear":85},//Spain
      "ru":{"length":6.077,"wear":50},//Russia
      "tr":{"length":5.162,"wear":90},//Turkey
      "au":{"length":5.301,"wear":40},//Australia
      "at":{"length":4.044,"wear":60},//Austria
      "hu":{"length":3.498,"wear":30},//Hungary
      "gb":{"length":5.751,"wear":65},//Great Britain
      "ca":{"length":4.341,"wear":45},//Canada
      "az":{"length":6.049,"wear":45},//Azerbaijan
      "mc":{"length":4.015,"wear":20},//Monaco
      "cn":{"length": 5.442,"wear":80},//China
      "fr":{"length":5.881,"wear":80},//France
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
    t=medium_wear;
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

average = (stint+stint2)/2;
return average;

}

function inject_advanced_stint(){

  placement = document.getElementsByClassName("fuel");

  
  parent = placement[0].parentElement;
 
  
  function create_elem(id,name,car){
    elem = document.createElement("tr");
    elem.id = id;
    row_name = document.createElement("th");
    row_name.textContent=name;
    row_name.style.fontSize =".8em";
    
    elem.appendChild(row_name);
    
    for(i=1 ; i<6 ; i++)
    {
      stint = document.createElement("td");
      if(name=="Fuel")
      stint.textContent= stint_fuel(i);
      if(name=="Wear")
      {
        tyre = placement[car].previousElementSibling.childNodes[i].childNodes[0].value;
        laps = placement[car].childNodes[i].textContent;
        w = getWear(tyre,laps);
        stint = document.createElement("td");
        
        stint.style.visibility = placement[car].childNodes[i].style.visibility;
        stint.textContent= w.toFixed(2);
      }
     
      try {
        elem.appendChild(stint);
      } catch (error) {
              console.log(error);

      }
      
    }
    return elem;
  }

  function stint_fuel(stint_number){
    return (eco[0]*placement[0].childNodes[stint_number].textContent).toFixed(2);
  }
  
  if(placement.length>1)
  {
    el = create_elem("tyre wear2","Wear",1);
    if(placement[1].parentElement.childElementCount == 4)
      placement[1].parentElement.insertBefore(el,placement[1].parentElement.childNodes[5]); 
  }
  
  el = create_elem("tyre wear","Wear",0);
  if(placement[0].parentElement.childElementCount == 4)
    placement[0].parentElement.insertBefore(el,placement[0].parentElement.childNodes[5]); 
  

  
}

function inject_estimated(){
  placement = document.getElementById("fuelLapsPrediction");
  fuel= document.getElementsByClassName("igpNum m")[0].textContent;
  placement.textContent = (fuel/eco[0]).toFixed(2);
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

  function addEvent()
  {
    change_fuel = document.getElementsByClassName("igpNum m")[0];
    change_fuel.addEventListener("click",inject_estimated);
    change_fuel.addEventListener("touchstart",inject_estimated);
    inject_estimated();
  }

  const config = { attributes: true, attributeFilter : ['style'] };
  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        

        if(document.URL=="https://igpmanager.com/app/p=race&tab=strategy")
        {
          addEvent();
        }
        if(document.URL=="https://igpmanager.com/app/p=race")
        {
          addEvent();
          update_stint();
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
  
  
  inject_fuel_info();
  inject_advanced_stint();

  } catch (error) {
    console.log(error);
  }

}

function update_stint()
{

  placement = document.getElementsByClassName("fuel");

  
  function stint_wear(stint_number,car){

    tyre = placement[car].previousElementSibling.childNodes[stint_number].childNodes[0].value;
    laps = placement[car].childNodes[stint_number].textContent;
    return getWear(tyre,laps);
  }
  

  if(placement.length>1)
{
  
  t_stint = document.getElementById("tyre wear2");
  for(i=1 ; i<6 ;i++)
    t_stint.childNodes[i].textContent = (stint_wear(i,1)).toFixed(2);
  
}
  t_stint = document.getElementById("tyre wear");
  for(i=1 ; i<6 ;i++)
    t_stint.childNodes[i].textContent = (stint_wear(i,0)).toFixed(2);
  


}

async function inject_fuel_info() {
    
    elem = document.createElement("div");
    elem.setAttribute("style","color:white; font-family:RobotoCondensedBold; font-size:.9em;");
    race_laps = parseInt(document.getElementById("raceLaps").textContent);



    elem.textContent = "Fuel: "+(eco[0]*race_laps).toFixed(2);
    placement = document.getElementById("d1TotalLaps").parentElement; //location of the elem

    if(placement.childElementCount == 1)  
        placement.appendChild(elem)
    

 }

//global variables
 multiplier = 1;
 track = circuit_info(); //return [0]length and [1]wear
 eco = [];
 main();



  