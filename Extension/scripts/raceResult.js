
function toMs(timeString)
    {
      const [minStr, secStr, msStr] = timeString.split(/[:.]/);
      const time = {
        msInMin: parseInt(minStr) * 60000,
        msInSec: parseInt(secStr) * 1000,
        ms: parseInt(msStr)
      };
      return time.msInMin + time.msInSec + time.ms;
    }
/* rename the pit stop text with the time loss included*/
function pit(){    
  
  // 'pitTime' is a class added by the script. Used to detect whether the function has already been executed
  if(document.getElementsByClassName('pitTime').length == 0)
  {
    const table = document.getElementById('csvRaceResult');
    table.classList.add('pitTime'); 
    const pits = Array.from(document.querySelectorAll('.pit')).slice(1);
    const pitTimes = [];
    pits.forEach(pitLap =>{
      try {
      const a  = pitLap.previousElementSibling.childNodes[1].textContent;
      const b = pitLap.nextElementSibling.childNodes[1].textContent;
      const c  = pitLap.previousElementSibling.previousElementSibling.childNodes[1].textContent;
      const d = pitLap.nextElementSibling.nextElementSibling.childNodes[1].textContent;
      const pitTime = toMs(a) + toMs(b) - toMs(c) - toMs(d);
      pitLap.childNodes[0].textContent += ' ' + (pitTime / 1000);
      pitTimes.push(pitTime / 1000);
      } catch (error) {
        //doing consecutive pitstops or last laps
        pitTimes.push(-1);
      } 
    });
    
    const sum = pitTimes.reduce((a, b) => a + b, 0);
    const avg = (sum / pitTimes.length) || 0;
    //console.log('average is: ' + avg); //TODO display in the page?
  }
}

// TODO move to separate retry module?
(async () => {
  try {
    await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads
    pit();
  } catch (err) {
    console.log('page not loaded');
  }
})();

