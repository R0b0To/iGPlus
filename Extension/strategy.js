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
        }else if(document.URL=="https://igpmanager.com/app/p=race&tab=strategy")
        {
          addEvent();
        }else{
          //remove mutation observer when opening the dialog from a different page
          observer.disconnect();       
        }
      }else{
        update_stint();
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



  