

(function addTrackInfo(){
    try {
    searchBtn = document.getElementsByClassName('btn pointer')[0];
    searchBtn.addEventListener('click',loadTrack);
    } catch (error) {
        setTimeout(addTrackInfo,500);
    }
    
})();
function loadTrack(e)
{
    selectedTrack = document.getElementsByClassName('historyFilterTrack')[0];
    console.log(selectedTrack.value);
    image = document.createElement('img');
    code = selectedTrack.value;
    
    tableDiv = document.getElementById(`history`);

   // console.log(code);
    if(code!=0){
    image.src= chrome.runtime.getURL(`images/circuits/${t[code]}.png`);
    image.setAttribute("style","width:90%");
    image.id = 'trackMap';


        if(document.getElementById(`trackMap`)==null)
     {
       tableDiv.prepend(image); 
     }
     else
        {
        document.getElementById(`trackMap`).src = image.src;
        }
    }else{
        //this is not a circuit
    }
   
    
}

t = {
    1	:	"au",
    2	:	"my",
    3	:	"cn",
    4	:	"bh",
    5	:	"es",
    6	:	"mc",
    7	:	"tr",
    8	:	"gb9",
    9	:	"de",
    10	:	"hu",
    11	:	"eu",
    12	:	"be",
    13	:	"it",
    14	:	"sg",
    15	:	"jp",
    16	:	"br",
    17	:	"ae",
    18	:	"gb",
    19	:	"fr",
    20	:	"at",
    21	:	"ca",
    22	:	"az",
    23	:	"mx",
    24	:	"ru",
    25	:	"us",
            }