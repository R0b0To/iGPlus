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

//How much ride hight needs to be increased
function heightConversion(value,tier) {


scale = {
  190:{3:-10,2:-5,1:-2},
  185:{3:-8,2:-4,1:-1},
  180:{3:-6,2:-3,1:-1},
  175:{3:-4,2:-2,1:0},
  170:{3:-2,2:-1,1:0},
  165:{3:0,2:0,1:0}
}


    if (value >= 190) return scale[190][tier];
    if (value >= 185) return scale[185][tier];
    if (value >= 180) return scale[180][tier];
    if (value >= 175) return scale[175][tier];
    if (value >= 170) return scale[170][tier];
    if (value >= 165) return scale[165][tier];
    return 0;

  }


async function getDrivers() {

  drivers = document.getElementsByClassName("staffImage");
  tier = await findTier();

  t = await getTrack(tier);

  h1 = await requestDriverHeight(drivers[0].attributes[1].value);
  setup_value = heightConversion(h1,tier);


  setCar(t.suspension, t.ride + setup_value, t.wing, 1);
  //setPitTime(t.pit);

  //get other driver if present

  if (drivers.length > 2) {
    h2 = await requestDriverHeight(drivers[1].attributes[1].value);
    setup_value = heightConversion(h2,tier);

    setCar(t.suspension, t.ride + setup_value, t.wing, 2);
    //setPitTime(t.pit); 
    
  }

}

function toCentimeters(height) {
  // Set up an object containing the conversion factors for feet and inches to centimeters
  const units = {
    "ft": 30.48,
    "in": 2.54,
    "cm": 100
  };

  // Check if the height value is in feet and inches or in centimeters
  let valueInCentimeters;
  if (height[1] == "'") {
    // If the height is in feet and inches, split the value into feet and inches
    const feetInches = height.split(' ');
    // Convert the feet and inches to centimeters and add them together
    valueInCentimeters = (parseInt(feetInches[0]) * units["ft"]) + (parseInt(feetInches[1]) * units["in"]);
  } else if (height[1] == ".") {
    // If the height is in meters
    valueInCentimeters = height.slice(0, -1)* units["cm"];
  } else {
    // If the height is in cm
    valueInCentimeters = height.slice(0, -2) ;
  }

  return valueInCentimeters;
}


 async function requestDriverHeight(id) {
     const url = `https://igpmanager.com/index.php?action=fetch&d=driver&id=${id}&csrfName=&csrfToken=`;
     const result = await request(url);
  
    const height = JSON.parse(result).vars.sHeight; 
    const valueInCentimeters = toCentimeters(height);

     return valueInCentimeters;
   }
 //inject pit time
function setPitTime(time){
    temp =  document.querySelector("#d1setup > div.pWeather.text-right.green");
    x = document.createElement("span");     
    pitTime = document.createTextNode("Pit time: " + time + " ");
    x.style.margin = "20px";
    x.appendChild(pitTime);
    
    if(temp.childElementCount == 3)
    {
        temp.insertBefore(x, temp.childNodes[0]);
    }

}

 /**
 * Inject html elements into setup page
 * @param {string} s The suspension setup value.
 * @param {number} r The ride heigth setup value.
 * @param {number} w The wing setup value.
 * @param {number} n The driver number.
 */
function setCar(s,r,w,n){

    // ride element
    ride_height =  document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(2)");
    if(ride_height.childElementCount == 2){  
      x = document.createElement("td");
      x.setAttribute("style","text-align:center; background:#f0f1f2; color:#477337; font-size:20px; font-family:RobotoCondensedBold;");
      height= document.createTextNode(r);
      x.appendChild(height);
      ride_height.insertBefore(x, ride_height.childNodes[0]);
    }
    else{
        new_ride_heigth = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(2) > td:nth-child(1)")
        new_ride_heigth.textContent= r;
    }   
     
    // wing element
    wing = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(3)");
    if(wing.childElementCount == 2){
    x = document.createElement("td");
    x.setAttribute("style","text-align:center; background:#f0f1f2; color:#477337; font-size:20px; font-family:RobotoCondensedBold;");
    wing_height= document.createTextNode(w);
    x.appendChild(wing_height);
     wing.insertBefore(x, wing.childNodes[0]);
    } 

    // suspension element
    suspension = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(1)");
    suspension.id ="suggestedSetup";
    if(suspension.childElementCount == 2)
    {
    x = document.createElement("td");
    x.setAttribute("style","text-align:center; background:#f0f1f2; font-size:14.44px; font-family:RobotoCondensedBold;");
    suspen_value = document.createTextNode(s);
    x.appendChild(suspen_value);
    suspension.insertBefore(x, suspension.childNodes[0]);
    }
    
}

//Fixed circuit setup
function getTrack(tier){

    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    code = /[^-]+(?=">)/g.exec(circuit)[0];
    susOption = document.querySelectorAll('.rotateThis')[0];
    soft = susOption.childNodes[1].textContent;
    neutral = susOption.childNodes[1].textContent;
    firm = susOption.childNodes[2].textContent;



  
    if(tier==3)
      t ={
        "be":{"ride":25,"wing":17,"suspension":neutral,"pit":14},//Belgium
        "it":{"ride":25,"wing":1,"suspension":firm,"pit":23},//Italy
        "sg":{"ride":35,"wing":32,"suspension":soft,"pit":18},//Singapore
        "my":{"ride":25,"wing":10,"suspension":neutral,"pit":18},//Malaysia
        "jp":{"ride":25,"wing":25,"suspension":soft,"pit":21},//Japan
        "us":{"ride":10,"wing":12,"suspension":neutral,"pit":17},//USA
        "mx":{"ride":15,"wing":15,"suspension":neutral,"pit":22},//Mexico
        "br":{"ride":17,"wing":15,"suspension":neutral,"pit":19},//Brazil
        "ae":{"ride":27,"wing":10,"suspension":neutral,"pit":21},//AbuDhabi
        "bh":{"ride":17,"wing":5,"suspension":firm,"pit":23},//Bahrain
        "eu":{"ride":25,"wing":25,"suspension":soft,"pit":17},//Europe
        "de":{"ride":17,"wing":15,"suspension":neutral,"pit":18},//Germany
        "es":{"ride":12,"wing":25,"suspension":soft,"pit":25},//Spain
        "ru":{"ride":10,"wing":15,"suspension":neutral,"pit":21},//Russia
        "tr":{"ride":27,"wing":15,"suspension":neutral,"pit":18},//Turkey
        "au":{"ride":40,"wing":20,"suspension":neutral,"pit":24},//Australia
        "at":{"ride":20,"wing":5,"suspension":firm,"pit":26},//Austria
        "hu":{"ride":22,"wing":30,"suspension":soft,"pit":16},//Hungary
        "gb":{"ride":20,"wing":5,"suspension":firm,"pit":23},//Great Britain
        "ca":{"ride":20,"wing":1,"suspension":firm,"pit":16},//Canada
        "az":{"ride":35,"wing":10,"suspension":neutral,"pit":17},//Azerbaijan
        "mc":{"ride":45,"wing":40,"suspension":soft,"pit":16},//Monaco
        "cn":{"ride":12,"wing":15,"suspension":neutral,"pit":27},//China
        "fr":{"ride":35,"wing":15,"suspension":neutral,"pit":21}//France
    }
    if(tier==2)
    t ={
      "be":{"ride":13,"wing":9,"suspension":neutral,"pit":14},//Belgium
      "it":{"ride":13,"wing":1,"suspension":firm,"pit":23},//Italy
      "sg":{"ride":18,"wing":16,"suspension":soft,"pit":18},//Singapore
      "my":{"ride":13,"wing":5,"suspension":neutral,"pit":18},//Malaysia
      "jp":{"ride":13,"wing":13,"suspension":soft,"pit":21},//Japan
      "us":{"ride":5,"wing":6,"suspension":neutral,"pit":17},//USA
      "mx":{"ride":8,"wing":8,"suspension":neutral,"pit":22},//Mexico
      "br":{"ride":9,"wing":8,"suspension":neutral,"pit":19},//Brazil
      "ae":{"ride":14,"wing":5,"suspension":neutral,"pit":21},//AbuDhabi
      "bh":{"ride":9,"wing":3,"suspension":firm,"pit":23},//Bahrain
      "eu":{"ride":13,"wing":13,"suspension":soft,"pit":17},//Europe
      "de":{"ride":9,"wing":8,"suspension":neutral,"pit":18},//Germany
      "es":{"ride":6,"wing":13,"suspension":soft,"pit":25},//Spain
      "ru":{"ride":5,"wing":8,"suspension":neutral,"pit":21},//Russia
      "tr":{"ride":14,"wing":8,"suspension":neutral,"pit":18},//Turkey
      "au":{"ride":20,"wing":10,"suspension":neutral,"pit":24},//Australia
      "at":{"ride":10,"wing":3,"suspension":firm,"pit":26},//Austria
      "hu":{"ride":11,"wing":15,"suspension":soft,"pit":16},//Hungary
      "gb":{"ride":10,"wing":3,"suspension":firm,"pit":23},//Great Britain
      "ca":{"ride":10,"wing":1,"suspension":firm,"pit":16},//Canada
      "az":{"ride":18,"wing":5,"suspension":neutral,"pit":17},//Azerbaijan
      "mc":{"ride":23,"wing":20,"suspension":soft,"pit":16},//Monaco
      "cn":{"ride":6,"wing":8,"suspension":neutral,"pit":27},//China
      "fr":{"ride":18,"wing":8,"suspension":neutral,"pit":21}//France
  }
    if(tier==1)
  t ={
    "be":{"ride":5,"wing":4,"suspension":neutral,"pit":14},//Belgium
    "it":{"ride":5,"wing":1,"suspension":firm,"pit":23},//Italy
    "sg":{"ride":7,"wing":7,"suspension":soft,"pit":18},//Singapore
    "my":{"ride":5,"wing":2,"suspension":neutral,"pit":18},//Malaysia
    "jp":{"ride":5,"wing":5,"suspension":soft,"pit":21},//Japan
    "us":{"ride":1,"wing":2,"suspension":neutral,"pit":17},//USA
    "mx":{"ride":3,"wing":3,"suspension":neutral,"pit":22},//Mexico
    "br":{"ride":3,"wing":3,"suspension":neutral,"pit":19},//Brazil
    "ae":{"ride":5,"wing":2,"suspension":neutral,"pit":21},//AbuDhabi
    "bh":{"ride":3,"wing":1,"suspension":firm,"pit":23},//Bahrain
    "eu":{"ride":5,"wing":5,"suspension":soft,"pit":17},//Europe
    "de":{"ride":3,"wing":3,"suspension":neutral,"pit":18},//Germany
    "es":{"ride":2,"wing":5,"suspension":soft,"pit":25},//Spain
    "ru":{"ride":2,"wing":3,"suspension":neutral,"pit":21},//Russia
    "tr":{"ride":5,"wing":3,"suspension":neutral,"pit":18},//Turkey
    "au":{"ride":8,"wing":4,"suspension":neutral,"pit":24},//Australia
    "at":{"ride":4,"wing":1,"suspension":firm,"pit":26},//Austria
    "hu":{"ride":4,"wing":6,"suspension":soft,"pit":16},//Hungary
    "gb":{"ride":4,"wing":2,"suspension":firm,"pit":23},//Great Britain
    "ca":{"ride":4,"wing":1,"suspension":firm,"pit":16},//Canada
    "az":{"ride":7,"wing":2,"suspension":neutral,"pit":17},//Azerbaijan
    "mc":{"ride":9,"wing":8,"suspension":soft,"pit":16},//Monaco
    "cn":{"ride":2,"wing":3,"suspension":neutral,"pit":27},//China
    "fr":{"ride":7,"wing":3,"suspension":neutral,"pit":21}//France
}

    return t[code];
    

}

async function findTier()
{
  leagueUrl = document.getElementById("mLeague").href;
  leagueId = /id=(.*)/.exec(leagueUrl)[1];
  url= `https://igpmanager.com/index.php?action=fetch&p=league&id=${leagueId}&csrfName=&csrfToken=`;
  
  managerStandings = await fetch(url)
    .then(response => response.json())
    .then(data => {
      standings = {
        'tier1':data.vars.standings1,
        'tier2':data.vars.standings2,
        'tier3':data.vars.standings2,
      }
      return standings})
    .catch(error => console.error(error))

    if(managerStandings.tier1.search("myTeam")!=-1)
      return (1);
    if(managerStandings.tier2.search("myTeam")!=-1)
      return (2);
    if(managerStandings.tier3.search("myTeam")!=-1);
      return (3);

}
//code execution ==>
   
    if(document.getElementById("suggestedSetup")==null)
      getDrivers()

    
   







