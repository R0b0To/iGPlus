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

async function get_eco()
  {
    url = "https://igpmanager.com/index.php?action=fetch&p=cars&csrfName=&csrfToken=";
    response = await request(url);
    eco_vars = JSON.parse(response);
    fuel_eco = eco_vars.vars.fuel_economyBar;
    tyre_eco = eco_vars.vars.tyre_economyBar;

    fuel_lap = fuel_calc(fuel_eco)*circuit_info()[0];
 
    
    eco = [fuel_lap, tyre_eco];
    return eco;
    
}
  
function circuit_info(){
    
    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    track = /[^-]+(?=">)/g.exec(circuit)[0];

    switch(track) {
        case "be"://Belgium
        length= 7.041;
        wear=60;
        break;
        case "it":// Italy;
        length= 5.401;
        wear=35;
        break;
        case "sg": //singapore
        length= 5.049;
        wear=45;
        break;
        case "my" : //malaysia
        length= 5.536;
        wear=85;
        break;
        case "jp": //japan
        length= 5.058;
        wear=70;
        break;
        case "us": //usa
        length= 4.602;
        wear=65;
        break;
        case "mx": //mexico
        length= 4.308;
        wear=60;
        break;
        case "br": //brazil
        length= 3.971;
        wear=60;
        break;
        case "ae": //abuda
        length= 5.41;
        wear= 50;
        break;
        case "bh": //bahra
        length= 4.726;
        wear= 60 ; 
        break;
        case "eu": //europe
        length= 5.59;
        wear= 45  ;
        break;
        case "de": //germany
        length= 4.179;
        wear= 50  ;
        break;
        case "es": //spain
        length= 4.457;
        wear= 85  ;
        break;
        case "ru": //russia
        length= 6.077;
        wear= 50;
        break;
        case "tr": //turkey
        length= 5.162;
        wear= 90 ;
        break;
        case "au": //australia
        length= 5.301;
        wear= 40 ;
        break;
        case "at": //austria
        length= 4.044;
        wear=  60 ;
        break;
        case "hu": //hungary
        length= 3.498;
        wear=  30 ;
        break;
        case "gb": //gran bre
        length= 5.751;
        wear=  65;
        break;
        case "ca": //canada
        length= 4.341;
        wear=  45 ;
        break;
        case "az": //azerb
        length= 6.049;
        wear=  45 ;
        break;
        case "mc": //monaco
        length= 4.015;
        wear=  20 ;
        break;
        case "cn": //china
        length=  5.442;
        wear= 80;
        break;
        case "fr": //france
        length= 5.881;
        wear= 80 ; 
        break;
        default:
          // code block
      }

     info = [length,wear];
     return info;
}

function fuel_calc(f){
fuel_km = ((f** -0.085)*0.671);
return fuel_km;
}


function wear_calc(tyre,laps){
  track = circuit_info();

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
    row_name.innerHTML=name;
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
        laps = placement[car].childNodes[i].innerText;
        w = wear_calc(tyre,laps);
        stint = document.createElement("td");
        
        stint.style.visibility = placement[car].childNodes[i].style.visibility;
        stint.innerHTML=Math.floor(w*100)/100;
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
    return Math.floor((eco[0]*placement[0].childNodes[stint_number].innerText)*100)/100;
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
  fuel= document.getElementsByClassName("igpNum m")[0].innerText;
  //console.log("changing");
  //console.log("estimated: "+fuel/f);
  placement.textContent = Math.floor(fuel/eco[0]*100)/100;
  

}

async function league_multiplier()
{
  league = document.querySelector("#mLeague").href;
  league_id= /(?<=id=).*/gm.exec(league)[0];
  league_info = await request("https://igpmanager.com/index.php?action=fetch&p=league&id="+league_id+"&csrfName=&csrfToken=");
  league_info = league_info.replace(/\\/g,"");
  league_lenght = /(?<=chronometer<\/icon> ).\d+/gm.exec(league_info)[0];

  if(league_lenght==100)
  return 1;
  if(league_lenght==75)
  return 1.33;
  if(league_lenght==50)
  return 1.75;
  if(league_lenght==25)
  return 3;
}

function add_mutation_observer(){

  const config = { attributes: true, attributeFilter : ['style'] };
  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        //console.log(document.URL);
        if(document.URL=="https://igpmanager.com/app/p=race&tab=strategy")
        {
          change_fuel = document.getElementsByClassName("igpNum m")[0];
          change_fuel.addEventListener("click",inject_estimated);
          inject_estimated();
        }
        if(document.URL=="https://igpmanager.com/app/p=race")
        {
          change_fuel = document.getElementsByClassName("igpNum m")[0];
          change_fuel.addEventListener("click",inject_estimated);
          inject_estimated();
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
  
  //get tyre and fuel economy points and league lenght
  eco= await get_eco();
  multiplier = await league_multiplier();
  
  //add event listeners
  add_mutation_observer();
  document.getElementById("beginner-d1PitsWrap").addEventListener("click",update_stint);
  if(document.getElementsByClassName("fuel").length>1)
  document.querySelector("#d2strategy > div").addEventListener("click",update_stint);
  
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
    laps = placement[car].childNodes[stint_number].innerText;
    return wear_calc(tyre,laps);
  }

  if(placement.length>1)
{

  t_stint = document.getElementById("tyre wear2");
  for(i=1 ; i<6 ;i++)
    t_stint.childNodes[i].innerText = Math.floor(stint_wear(i,1)*100)/100;
  
}
  t_stint = document.getElementById("tyre wear");
  for(i=1 ; i<6 ;i++)
    t_stint.childNodes[i].innerText = Math.floor(stint_wear(i,0)*100)/100;
  


}

async function inject_fuel_info() {
    
    elem = document.createElement("div");
    elem.style.color = 'white';
    
    elem.style.fontFamily="RobotoCondensedBold";
    elem.style.fontSize =".9em";
    
    race_laps = parseInt(document.getElementById("raceLaps").innerHTML);
    elem.innerHTML = "Fuel: "+Math.floor(eco[0]*1000)/1000*race_laps;
    placement = document.getElementById("d1TotalLaps").parentElement; //location of the elem

    if(placement.childElementCount == 1)  
        placement.appendChild(elem)
    

 }


 multiplier = 1;
 league_lenght = 100;
 league_info = 0;
 eco = [0,0];
  main();



  