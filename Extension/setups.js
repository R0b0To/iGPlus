
driver_number=1;
//Extract circuit name
function useRegex(input) {
    // extract circuit name
    let regex = /[^-]+(?=">)/g;
    return regex.exec(input)[0];
}

//How much ride hight needs to be increased
function height_Convertion(value){
    
    
if(value>=190)
    return 0;
if(value>=185)
    return 2;
if(value>=180)
    return 4;
if(value>=175)
    return 8;
if(value>=170)
    return 10;

    return 0;
   
}

function inject_button() {
    
    button = document.createElement("button");
    button.setAttribute("style","color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%; background-color:#689954");
    button.innerText= "update";
    button.id = 'update_button';
    button.addEventListener('click', update_button);
    button.addEventListener('touchstart', update_button);
    placement = document.getElementsByClassName("pic-name")[0].parentElement; //location of the button

 
    if(placement.childElementCount == 2)
    {  
        placement.insertBefore(button,placement.firstChild);
    }
   
 }
 async function update_button(){
            
            url = [];
            drivers = document.getElementsByClassName("staffImage");
            url.push("https://igpmanager.com/index.php?action=fetch&d=driver&id="+drivers[0].attributes[1].value+"&csrfName=&csrfToken=");
            result = await request(url[0]);
            result = JSON.parse(result);
            driver1_height = /[0-9.]+/gm.exec(result.vars.sHeight)[0];
            setup_value = height_Convertion(driver1_height);
            console.log(driver1_height);
        
            //get other driver if present
            if(drivers.length>2){
            driver_number=2;
            url.push("https://igpmanager.com/index.php?action=fetch&d=driver&id="+drivers[1].attributes[1].value+"&csrfName=&csrfToken=");
            result = await request(url[1]);
            result = JSON.parse(result);
            
            driver2_height = /[0-9.]+/gm.exec(result.vars.sHeight)[0]*100;
            setup_value2 = height_Convertion(driver2_height);
    
            circuit_setup(setup_value2,2);
        
            chrome.storage.local.set({'driver2h':setup_value2}, function() { });   
            }
            circuit_setup(setup_value,1);
            chrome.storage.local.set({'driver1h':setup_value}, function() { });   
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
         // console.log(temp.children);
        temp.insertBefore(x, temp.childNodes[0]);
    }
    return 
}

//Inject car setup suggestion
function setCar(suspen,car_height, value_2,n){

    if(driver_number==2)
    {
        if(n==2)
            n=1;
        else if(n==1)
            n=2;
    }
    ride_height =  document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(2)");
    
    if(ride_height.childElementCount == 2){  
      x = document.createElement("td");
      x.setAttribute("style","text-align:center; background:#f0f1f2; color:#477337; font-size:20px; font-family:RobotoCondensedBold;");
      height= document.createTextNode(car_height);
      x.appendChild(height);
      ride_height.insertBefore(x, ride_height.childNodes[0]);
    }
    else{
        new_ride_heigth = document.querySelector("#d1setup > table.acp.linkFill.pad > tbody > tr:nth-child(2) > td:nth-child(1)")
        new_ride_heigth.innerHTML= car_height;
    }   
     
    
    wing = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(3)");
    if(wing.childElementCount == 2){
    x = document.createElement("td");
    x.setAttribute("style","text-align:center; background:#f0f1f2; color:#477337; font-size:20px; font-family:RobotoCondensedBold;");
    wing_height= document.createTextNode(value_2);
    x.appendChild(wing_height);
     wing.insertBefore(x, wing.childNodes[0]);
    } 

    suspension = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(1)");
    if(suspension.childElementCount == 2)
    {
    x = document.createElement("td");
    x.setAttribute("style","text-align:center; background:#f0f1f2; font-size:14.44px; font-family:RobotoCondensedBold;");
    suspen_value = document.createTextNode(suspen);
    x.appendChild(suspen_value);
    suspension.insertBefore(x, suspension.childNodes[0]);
    }
    
}

//Fixed circuit setup
function circuit_setup(height,n){

    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    switch(useRegex(circuit)) {
        case "be"://Belgium
            setCar("Neutral",15+height,17,n);
            setPitTime(14,n);
        break;
        case "it":// Italy;
            setCar("Firm",15+height,1,n);
            setPitTime(23,n);
        break;
        case "sg": //singapore
            setCar("Soft",25+height,32,n);
            setPitTime(18,n);
        break;
        case "my" : //malaysia
            setCar("Neutral",15+height,10,n);
            setPitTime(18,n);
        break;
        case "jp": //japan
            setCar("Soft",15+height,25,n);
            setPitTime(21,n);
        break;
        case "us": //usa
            setCar("Neutral",1+height,12,n);
            setPitTime(17,n);
            break;
        case "mx": //mexico
            setCar("Neutral",5+height,15,n);
            setPitTime(26,n);
        break;
        case "br": //brazil
            setCar("Neutral",7+height,15,n);
            setPitTime(19,n);
        break;
        case "ae": //abuda
            setCar("Neutral",17+height,10,n);
            setPitTime(21,n);
        break;
        case "bh": //bahra
            setCar("Firm",7+height,5,n);
            setPitTime(23,n);
        break;
        case "eu": //europe
            setCar("Soft",15+height,25,n);
            setPitTime(17,n);
        break;
         case "de": //germany
            setCar("Neutral",7+height,15,n);
            setPitTime(18,n);
        break;
        case "es": //spain
            setCar("Soft",2+height,25,n);
            setPitTime(25,n);
        break;
        case "ru": //russia
            setCar("Neutral",1+height,15,n);
            setPitTime(21,n);
        break;
        case "tr": //turkey
            setCar("Neutral",17+height,15,n);
            setPitTime(18,n);
        break;
        case "au": //australia
            setCar("Neutral",30+height,20,n);
            setPitTime(24,n);
        break;
        case "at": //austria
            setCar("Firm",10+height,5,n);
            setPitTime(26,n);
        break;
        case "hu": //hungary
            setCar("Soft",12+height,30,n);
            setPitTime(16,n);
        break;
        case "gb": //gran bre
            setCar("Firm",10+height,5,n);
            setPitTime(23,n);
        break;
        case "ca": //canada
            setCar("Firm",10+height,1,n);
            setPitTime(16,n);
        break;
        case "az": //azerb
            setCar("Neutral",25+height,10,n);
            setPitTime(23,n);
        break;
        case "mc": //monaco
            setCar("Soft",35+height,40,n);
            setPitTime(16,n);
        break;
        case "cn": //china
            setCar("Neutral",2+height,15,n);
            setPitTime(21,n);
        break;
        case "fr": //france
            setCar("Neutral",25+height,15,n);
            setPitTime(18,n);
        break;
        default:
          // code block
      }
    
}

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


  async function get_drivers_id()
  {
    
    drivers = document.getElementsByClassName("staffImage");

    chrome.storage.local.get(["driver1h","driver2h"], async function(data) {
        
        if(data.driver1h==null)
        {

            update_button();  
     
        }else
        {
            if(drivers.length>2)
            {
                circuit_setup(data.driver2h,2);       
            }
                circuit_setup(data.driver1h,1);
        }

        
    });

       
    }


  
//code execution ==>
    inject_button();
    get_drivers_id();

   







