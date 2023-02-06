var observer = new MutationObserver(function(mutations) {
    //each time a mutation is detected an attempt at launching the main function will be made. Until the mutation is stable this will keep reseting the timer
    clearInterval(myInterval);
    myInterval = setInterval(timeToFullHeath, 100);
      
});

function observeHealth()
{
    table = document.getElementById("trainTable");
    drivers = table.querySelectorAll(".green >div");
    statusD = false;
    drivers.forEach(driver => {
        health = driver.style.width.slice(0,-1);
        //this observer will observe mutations on the width of the health indicator
        observer.observe(driver, { attributes : true, attributeFilter : ['style'] });
        if(health<100)
        statusD = true;
    });
}
function timeToFullHeath(){

    clearInterval(myInterval);
    if(statusD)
    addHeader()
drivers.forEach(driver => {
        health = driver.style.width.slice(0,-1);
        hoursToFull = (100 -health)/5;
        date = new Date();
        fullDate = new Date(date.getTime()+(3600000*hoursToFull))
        dateString =  `~${("0" + fullDate.getHours()).slice(-2)}:${("0" +fullDate.getMinutes()).slice(-2)}`;
        if(driver.closest('tr').cells.length<7){
        dateTd = document.createElement("td");
        dateTd.id = "dateTd";
        if(statusD && health<100)
            {      
                dateTd.textContent = dateString;
                driver.closest("td").parentElement.insertBefore(dateTd,driver.closest("td"));
                
            }
            else if(statusD){
                driver.closest("td").parentElement.insertBefore(dateTd,driver.closest("td"));
            }
   
        }
        else if(health==100){
           driver.closest('td').previousElementSibling.textContent = ``;
        }
        else{
            driver.closest('td').previousElementSibling.textContent = dateString;
        }  
});
}
function addHeader(){
    if(document.getElementById("dateHeader")==null)
    {
        header = document.createElement("th");
        header.style.width = '10%';
        header.id = "dateHeader";
        header.innerHTML =`<svg style="height: 32px;"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M216.1 408.1C207.6 418.3 192.4 418.3 183 408.1L119 344.1C109.7 335.6 109.7 320.4 119 311C128.4 301.7 143.6 301.7 152.1 311L200 358.1L295 263C304.4 253.7 319.6 253.7 328.1 263C338.3 272.4 338.3 287.6 328.1 296.1L216.1 408.1zM128 0C141.3 0 152 10.75 152 24V64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0zM400 192H48V448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192z"/></svg>`;
        table.tHead.rows[0].insertBefore(header,table.tHead.rows[0].cells[4]);
    }   
}


observeHealth();
var myInterval;
timeToFullHeath();