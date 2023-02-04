function pit(){
  if(document.getElementsByClassName("pitTime").length==0)
  {
    try {
    table = document.getElementById("csvRaceResult");
    table.classList.add("pitTime");
    pitTimes = [];
    for (i = 2; i <= table.tBodies[0].rows.length; i++) {
        if (isNaN(table.rows[i].childNodes[0].textContent)) { 
            a = table.rows[i-1].childNodes[1].textContent;
            b = table.rows[i+1].childNodes[1].textContent;
            c = table.rows[i-2].childNodes[1].textContent;
            d = table.rows[i+2].childNodes[1].textContent;
            pitTime = toMs(a) + toMs(b) -toMs(c) - toMs(d);
            table.rows[i].childNodes[0].textContent+=" "+(pitTime/1000);
            //console.log(table.rows[i].childNodes[0].textContent);
            pitTimes.push(pitTime/1000);
        }
      }
      function toMs(timeString)
      {
        time = timeString.split(":");
        m = parseInt(time[0])*60000;
        secondAndMs = time[1].split(".");
        return m + (parseInt(secondAndMs[0])*1000) + (parseInt(secondAndMs[1]));
      }
      sum = pitTimes.reduce((a, b) => a + b, 0);
      avg = (sum / pitTimes.length) || 0;
      console.log("average is: "+avg);
    } catch (error) {
      setTimeout(pit,500);
    }
   
  }
   
    }

    pit();
    