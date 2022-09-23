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
function height_Convertion(value){   
    console.log(value);
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
if(value>=165)
    return 12;

    return 0;
   
}

//update button injection
function inject_button() {
    
    button = document.createElement("button");
    button.setAttribute("style","color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%; background-color:#689954");
    button.textContent= "update";
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

            drivers = document.getElementsByClassName("staffImage");
            url = "https://igpmanager.com/index.php?action=fetch&d=driver&id="+drivers[0].attributes[1].value+"&csrfName=&csrfToken=";
            result = await request(url[0]);
            result = JSON.parse(result);
            driver1_height = /[0-9.]+/gm.exec(result.vars.sHeight)[0];
            setup_value = height_Convertion(driver1_height);
           
            t = getTrack();
            //get other driver if present
            if(drivers.length>2){
                driver_number=2;
                url ="https://igpmanager.com/index.php?action=fetch&d=driver&id="+drivers[1].attributes[1].value+"&csrfName=&csrfToken=";
                result = await request(url);
                result = JSON.parse(result);
            
                driver2_height = /[0-9.]+/gm.exec(result.vars.sHeight)[0]*100;
                setup_value2 = height_Convertion(driver2_height);
    
                setCar(t.suspension,t.ride+setup_value2,t.wing,2);
                //setPitTime(t.pit); 
        
                chrome.storage.local.set({'driver2h':setup_value2}, function() { });   
            }
            console.log(t.ride+setup_value);
                setCar(t.suspension,t.ride+setup_value,t.wing,1);
                setPitTime(t.pit); 
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
        temp.insertBefore(x, temp.childNodes[0]);
    }

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

    // ride element
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
        new_ride_heigth.textContent= car_height;
    }   
     
    // wing element
    wing = document.querySelector("#d"+n+"setup > table.acp.linkFill.pad > tbody > tr:nth-child(3)");
    if(wing.childElementCount == 2){
    x = document.createElement("td");
    x.setAttribute("style","text-align:center; background:#f0f1f2; color:#477337; font-size:20px; font-family:RobotoCondensedBold;");
    wing_height= document.createTextNode(value_2);
    x.appendChild(wing_height);
     wing.insertBefore(x, wing.childNodes[0]);
    } 

    // suspension element
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
        "mx":{"ride":5,"wing":15,"suspension":"Neutral","pit":26},//Mexico
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
        "az":{"ride":25,"wing":10,"suspension":"Neutral","pit":23},//Azerbaijan
        "mc":{"ride":35,"wing":40,"suspension":"Soft","pit":16},//Monaco
        "cn":{"ride":2,"wing":15,"suspension":"Neutral","pit":27},//China
        "fr":{"ride":25,"wing":15,"suspension":"Neutral","pit":18}//France
    }

    return t[code];
    

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
            t = getTrack(); 
            if(drivers.length>2)
            {
                driver_number = 2;
                setCar(t.suspension,t.ride+data.driver2h,t.wing,2);
                     
            }

                setCar(t.suspension,t.ride+data.driver1h,t.wing,1);
                setPitTime(t.pit);
        }

        
    });

       
    }


  
//code execution ==>
    driver_number=1;
    inject_button();
    get_drivers_id();

   







