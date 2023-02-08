function addTable(){
    chrome.storage.local.get({
        language: 'eng',
      }, function(items) {
        try {
            if(document.getElementById('statsTable')==null){
        table = document.createElement('table');
        table.id = "statsTable";
        table.className = "acp hoverCopy";
        table.setAttribute("style","float: left;width: 19%;margin-right: 1px;");
        header =document.createElement('thead');
        header.className="hoverCopyTh";
        header.append(createTh(lang[items.language].yourValuesText));header.append(createTh(lang[items.language].bestValuesText));header.append(createTh(lang[items.language].gapValuesText));
        table.append(header);
        body = document.createElement('tbody');
        gameTable = document.getElementById("carResearch");
        gameTable.setAttribute("style","width:80%");
        ratings = gameTable.querySelectorAll(".ratingBar")

        ratings.forEach(bar => {
            (function createRow(){
                row = document.createElement("tr");
                row.className = "hoverCopyTr";
                b =/(\d+)/.exec(bar.querySelectorAll('img')[0].style.left)[0]*2;
                y =/(\d+)/.exec(bar.querySelectorAll('div')[0].style.width)[0]*2;
                g = b-y;
                row.append(createTd(y));row.append(createTd(b));row.append(createTd(g));
                body.append(row);
            })();        
        });
        table.append(body);
        try {
            realAttr =  sortArray(document.getElementById("overview").querySelectorAll("[class*=block]"));
            body.rows[0].childNodes[0].textContent
            for(var i=0; i<8; i++)
            {
                sponsorValue = realAttr[i].textContent - body.rows[i].childNodes[0].textContent;
                body.rows[i].childNodes[0].append(realCarDiff(sponsorValue))
            }
        } catch (error) {
            
        }
        gameTable.parentElement.insertBefore(table, gameTable);
            }
      researchPower = document.getElementById('checkboxTotal');
      observer.observe(researchPower, { characterData: false, attributes: false, childList: true, subtree: false });
      weightedResearch();

        } catch (error) {
            setTimeout(addTable,500);
        }
      });
      
}
addTable();
  function createTd(text){
    ele =document.createElement('td');    
    ele.textContent = text;
    ele.addEventListener('click',copyColumn);
    ele.className = "hoverCopyTd"
    ele.setAttribute('style','height:32px;text-align: center;');
    return ele;
  }
  function createTh(text){
    ele =document.createElement('th');
    ele.textContent = text;
    ele.setAttribute('style','height:32px;text-align: center;');
    return ele;
  }
  function sortArray(a){return [a[0],a[2],a[4],a[6],a[1],a[3],a[5],a[7]];}
  function realCarDiff(val){
    if(val!=0)
    {
        sponsorSpan = document.createElement("span");
        sponsorSpan.setAttribute("style","font-size: x-small; position:absolute;");
        if(val>0)
        {
        sponsorSpan.style.color = "green";
        sponsorSpan.textContent = ' +'+val;
        }
        else{
           sponsorSpan.style.color = "red";
           sponsorSpan.textContent =  val;  
        }    
        return sponsorSpan;
    } 
    else
    return ""
  }
  function copyColumn()
{
    columnIndex = this.cellIndex;
    table = this.closest("tbody");
    cvs = "";
    for (let item of table.rows) {
        cvs+=`${item.childNodes[columnIndex].childNodes[0].textContent}\n`;
    }
    navigator.clipboard.writeText(cvs).then(() => {
        console.log("text copied");
    }, () => { });
}


function weightedResearch (){
   
    try {
       rPower = document.getElementById('checkboxTotal').textContent.slice(0,-1)/100;
    table = document.getElementById('statsTable');
    tableMap = {'acc':0,'bra':1,'han':5,'dow':3}
    //'fe':4,'col':2,'te':7,'rel':6};
    if(table!=null){
    function getStats(t,index)
    { 
      value =  parseInt(t.rows[index].childNodes[0].childNodes[0].textContent);
      gap =  parseInt(t.rows[index].childNodes[2].childNodes[0].textContent);
        return {'value':value,'gap':gap};
    }
    carDesign ={};
    Object.keys(tableMap).forEach(key =>{
        design = getStats(table,tableMap[key]);
        carDesign[key] =weightResult(design.value,design.gap,rPower,key);
    });
    //console.log(carDesign);
    function weightResult(currentS,gap,rPower,code){
        weight ={
            'acc':1,
            'bra':0.5,
            'han':0.8,
            'dow':0.3,
            'fe':0.1,
            'te':0.1,
            'col':0.01,
            'rel':0.01
        }
        return (2.23 + 4.23 * Math.log (currentS + (gap * rPower)) - (2.23 + 4.23 * Math.log (currentS))) * weight[code];
    }
    

    bestWResearch = Math.max(...Object.values(carDesign));
     table.querySelectorAll('.hoverCopyTr').forEach(row => {row.style.background='transparent';});
    if(bestWResearch>0){
        bestKey = Object.keys(carDesign).filter(key => carDesign[key] === bestWResearch );
        bestKey.forEach(key=> {
            table.rows[tableMap[key]].style.background = "#ADD8E6";
        });   
    }
    }else{
       setTimeout(weightedResearch,200); 
    } 
    } catch (error) {
        
    }
    
    
    
}

var observer = new MutationObserver(function(mutations) {
    weightedResearch();
}); 

