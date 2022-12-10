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
function heightConversion(value) {
    if (value >= 190) return 0;
    if (value >= 185) return 2;
    if (value >= 180) return 4;
    if (value >= 175) return 6;
    if (value >= 170) return 8;
    if (value >= 165) return 10;
    return 10;
  }


async function getDrivers() {

  drivers = document.getElementsByClassName("staffImage");

  h1 = await requestDriverHeight(drivers[0].attributes[1].value);
  setup_value = heightConversion(h1);
  
  t = getTrack();
  setCar(t.suspension, t.ride + setup_value, t.wing, 1);
  setPitTime(t.pit);

  //get other driver if present

  if (drivers.length > 2) {
    h2 = await requestDriverHeight(drivers[1].attributes[1].value);
    setup_value = heightConversion(h2);

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
function getTrack(){

    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    code = /[^-]+(?=">)/g.exec(circuit)[0];
  
      t ={
        "be":{"ride":15,"wing":17,"suspension":"Neutral","pit":14},//Belgium
        "it":{"ride":15,"wing":1,"suspension":"Firm","pit":23},//Italy
        "sg":{"ride":25,"wing":32,"suspension":"Soft","pit":18},//Singapore
        "my":{"ride":15,"wing":10,"suspension":"Neutral","pit":18},//Malaysia
        "jp":{"ride":15,"wing":25,"suspension":"Soft","pit":21},//Japan
        "us":{"ride":1,"wing":12,"suspension":"Neutral","pit":17},//USA
        "mx":{"ride":5,"wing":15,"suspension":"Neutral","pit":22},//Mexico
        "br":{"ride":7,"wing":15,"suspension":"Neutral","pit":19},//Brazil
        "ae":{"ride":17,"wing":10,"suspension":"Neutral","pit":21},//AbuDhabi
        "bh":{"ride":7,"wing":5,"suspension":"Firm","pit":23},//Bahrain
        "eu":{"ride":15,"wing":25,"suspension":"Soft","pit":17},//Europe
        "de":{"ride":7,"wing":15,"suspension":"Neutral","pit":18},//Germany
        "es":{"ride":2,"wing":25,"suspension":"Soft","pit":25},//Spain
        "ru":{"ride":1,"wing":15,"suspension":"Neutral","pit":21},//Russia
        "tr":{"ride":17,"wing":15,"suspension":"Neutral","pit":18},//Turkey
        "au":{"ride":30,"wing":20,"suspension":"Neutral","pit":24},//Australia
        "at":{"ride":10,"wing":5,"suspension":"Firm","pit":26},//Austria
        "hu":{"ride":12,"wing":30,"suspension":"Soft","pit":16},//Hungary
        "gb":{"ride":10,"wing":5,"suspension":"Firm","pit":23},//Great Britain
        "ca":{"ride":10,"wing":1,"suspension":"Firm","pit":16},//Canada
        "az":{"ride":25,"wing":10,"suspension":"Neutral","pit":17},//Azerbaijan
        "mc":{"ride":35,"wing":40,"suspension":"Soft","pit":16},//Monaco
        "cn":{"ride":2,"wing":15,"suspension":"Neutral","pit":27},//China
        "fr":{"ride":25,"wing":15,"suspension":"Neutral","pit":21}//France
    }

    return t[code];
    

}


  
//code execution ==>
 
    if(document.getElementById("suggestedSetup")==null)
    getDrivers();

   







