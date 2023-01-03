
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get({
      language: 'eng',
    }, function(items) {
      document.getElementById("yourValuesId").childNodes[0].textContent = lang[items.language].yourValuesText;
      document.getElementById("bestValuesId").childNodes[0].textContent = lang[items.language].bestValuesText;
      document.getElementById("valuesGapId").childNodes[0].textContent = lang[items.language].gapText;
    });
  }

function createLabelElement()
{
    var htmlElement = document.createElement("th");
    var textLabel = document.createElement("div");
    var copyIcon = document.createElement("div");
    var copyMessage = document.createElement("div");
    copyMessage.textContent="Copied to Clipboard";
    copyMessage.setAttribute("style","display:none; position:absolute; background:#141414; color:white; border-radius:8px; padding:5px; top:-10%; font-size:50%;z-index: 99;");
    copyIcon.className = "fa fa-clipboard";
    copyIcon.setAttribute("style"," justify-content: center; padding:6px; border-radius:8px; background:#a1c590; cursor: pointer;");
    copyIcon.addEventListener("click",copyAbove);
    copyIcon.appendChild(copyMessage);
    htmlElement.appendChild(textLabel);
    htmlElement.appendChild(copyIcon);
    htmlElement.setAttribute("style","width:4%;position:relative;");
    return htmlElement;
}
function copyAbove()
{
    this.childNodes[0].style.display="block";
    col = this.parentElement.cellIndex;
    rows = this.parentElement.parentElement.parentElement.parentElement.childNodes[1];
    var value="";
    for(var i=0; i<rows.childElementCount; i++)
    { 
        value += rows.childNodes[i].childNodes[col].textContent+"\n";
    }
    navigator.clipboard.writeText(value).then(() => {
        //clipboard successfully set
    }, () => {
        //clipboard write failed, use fallback
    });
    setTimeout(() => this.childNodes[0].style.display="none", 500);
}

function inject_attributes_details(){
    if(document.getElementById("valuesGapId")!=null)
    return;
try {
    title = document.querySelector("#carResearch > thead > tr");
    
    if(document.getElementById("awesomeId")==null){
    fontIcons = document.createElement('link');
    fontIcons.rel = "stylesheet";
    fontIcons.id = "awesomeId";
    fontIcons.href= "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" ;
    document.head.appendChild(fontIcons);

    }
 

    yourValues = createLabelElement();
    yourValues.style.width = "8%";
    bestValues = createLabelElement();
    values_gap = createLabelElement();

    
    yourValues.id="yourValuesId";
    bestValues.id="bestValuesId";
    values_gap.id="valuesGapId";
    
    
    title.insertBefore(yourValues, title.childNodes[0]);
    title.insertBefore(bestValues, title.childNodes[1]);
    title.insertBefore(values_gap, title.childNodes[2]);


table = document.querySelector("#carResearch > tbody");

try {
    myAttr = document.getElementById("overview").childNodes[0].childNodes[0].childNodes[0];
} catch (error) {
    myAttr = null;
}


for(i=0; i<8 ; i++)
  {
    attribute= table.rows[i];
    var yourTeam = document.createElement("th");
    bestTeam =  document.createElement("th");
    gap_area = document.createElement("th");
    
    value = getAttributeValue(i);
 
    if(myAttr!=null)
    {
        if(i<4)
    myAttrValue = myAttr.rows[i].childNodes[0].childNodes[2].textContent;
    else
    myAttrValue = myAttr.rows[i-4].childNodes[1].childNodes[2].textContent;

    sponsorValue = parseInt(myAttrValue-value[1]);
     yourTeam.textContent = value[1];
    if(sponsorValue!=0)
    {
        sponsorSpan = document.createElement("span");
        sponsorSpan.setAttribute("style"," position:relative;");
        sponsorSpan.textContent = " "+sponsorValue;
        if(sponsorValue>0)
        {
        sponsorSpan.style.color = "green";
        sponsorSpan.textContent = ' +'+sponsorValue;
        }
        else
        sponsorSpan.style.color = "red";

        console.log(sponsorSpan);
        yourTeam.appendChild(sponsorSpan);
       
        
    } 
    }
    else
    yourTeam.textContent = value[1];
   
   
    
    bestTeam.textContent = value[0];
    gap_area.textContent = value[0]-value[1];

    attribute.insertBefore(yourTeam, attribute.childNodes[0]);
    attribute.insertBefore(bestTeam, attribute.childNodes[1]);
    attribute.insertBefore(gap_area, attribute.childNodes[2]);
  }
  restore_options();
 
} catch (error) {
    console.log(error);
    setTimeout(() => {
        inject_attributes_details();
    }, 200);
}

    
}

function getAttributeValue(attr){

    const useRegex = (input) => {
        const regex = /[0-9]+%/g;
        return regex.exec(input)[0];
    };
    
    const  bestAttr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child("+(attr+1)+") > td:nth-child(3) > div > img:nth-child(1)").style.left))*2;
    const myAttr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child("+(attr+1)+") > td:nth-child(3) > div > div").style.width))*2;
            return [bestAttr,myAttr];

}


 

inject_attributes_details();




