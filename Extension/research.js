function addTable(){
    chrome.storage.local.get({
        language: 'eng',
      }, function(items) {
        try {
            if(document.getElementById('statsTable')==null){
        table = document.createElement('table');
        table.id = "statsTable";
        table.className = "acp hoverCopy";
        table.setAttribute("style","float: left;width:auto;margin-right: 1px;");
        header =document.createElement('thead');
        header.className="hoverCopyTh";
        header.style.width = '20%';
        header.append(createTh(`<svg style='width:20px'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>`));
        header.append(createTh(`<svg style='width:28.5px'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z"/></svg>`));
        header.append(createTh(`<svg style='width:32px'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M32 64c17.7 0 32 14.3 32 32l0 320c0 17.7-14.3 32-32 32s-32-14.3-32-32V96C0 78.3 14.3 64 32 64zm214.6 73.4c12.5 12.5 12.5 32.8 0 45.3L205.3 224l229.5 0-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3l-96 96c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L434.7 288l-229.5 0 41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0zM640 96V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96c0-17.7 14.3-32 32-32s32 14.3 32 32z"/></svg>`));
        header.append(createTh(`<svg style='width:22px' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>`));
        table.append(header);
        body = document.createElement('tbody');
        gameTable = document.getElementById("carResearch");
        gameTable.setAttribute("style","width: calc(100% - 164px);width:-webkit-fill-available;");
        gameTable.tHead.rows[0].cells[2].className = 'ratings';
        ratings = gameTable.querySelectorAll(".ratingBar")
        researchPower =document.getElementById('checkboxTotal')
        rPower = parseFloat(researchPower.textContent.slice(0,-1)/100);
        ratings.forEach(bar => {
            (function createRow(){
                bar.parentElement.className = 'ratings'; 
                row = document.createElement("tr");
                row.className = "hoverCopyTr";
                b =/(\d+)/.exec(bar.querySelectorAll('img')[0].style.left)[0]*2;
                y =/(\d+)/.exec(bar.querySelectorAll('div')[0].style.width)[0]*2;
                
                g = b-y;
                var check =bar.parentElement.parentElement.cells[1].childNodes[0].checked;
                if(check)
                {
                 var gain = Math.ceil(g*rPower);   
                }
                else
                gain = "";

                row.append(createTd(y));
                row.append(createTd(b));
                row.append(createTd(g));

                gainRow = createTd(gain);
                gainRow.classList.remove('hoverCopyTd');
                row.append(gainRow);
                body.append(row);
            })();        
        });
        table.append(body);
        try {
            realAttr =  sortArray(document.getElementById("overview").querySelectorAll("[class*=block]"));
            //body.rows[0].childNodes[0].textContent;
            for(var i=0; i<8; i++)
            {
                sponsorValue = realAttr[i].textContent - body.rows[i].childNodes[0].textContent;
                body.rows[i].childNodes[0].append(realCarDiff(sponsorValue))
            }
        } catch (error) {
            console.log(error);
        }
        gameTable.parentElement.insertBefore(table, gameTable);
        helpmark = document.createElement('td');
      helpmark = askHelpButton('The highlighted row denotes the recommended research, determined through a weighted system.');
      tfoot = document.createElement('tfoot');
      tfoot.setAttribute('style','background:#e3e4e5;z-index: 2;position: relative;');
      thf= document.createElement('th');
      thf.colSpan = 2;
      thf.setAttribute('style','background: #e3e4e5;border-right:0');
      tfoot.append(helpmark);
      tfoot.append(thf);
      total =document.createElement('td');  
      total.setAttribute('style','font-weight: bold;text-align: center;');
      total.id ="totalGain";
      tfoot.append(total);
      table.append(tfoot); 
    }
      
      observer.observe(researchPower, { characterData: false, attributes: false, childList: true, subtree: false });
      weightedResearch();
      
      pointGain();
      

        } catch (error) {
            //console.log(error);
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
    ele.innerHTML = text;
    ele.setAttribute('style','width: 32px;height:32px;text-align: center;');
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
    rPower = parseFloat(document.getElementById('checkboxTotal').textContent.slice(0,-1)/100);
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
    pointGain();
}); 

function addFieldTip(){
    var span = document.createElement('span');
    span.id = 'fieldtip';
    span.setAttribute("style",`opacity:0`);
    return span;
}
function askHelpButton(text){

    span = document.createElement('span');
    container = document.createElement('td');
    span.textContent = '?';
    span.className = "fieldtip";
    span.setAttribute('style','cursor: help;display:block; text-align: center; ; border-radius: 50%;background-color: #96bf86;color: #ffffff;width: 23px;height: 23px;');
    span.setAttribute('data-fieldtip',text);
    span.addEventListener('mouseenter',function(){
        fieldtip = document.getElementById('fieldtip');
        fieldtip.textContent = this.dataset.fieldtip;
        fieldtip.style.display ='inline-block';
        var position = { 
            top: 355,
            left: this.offsetLeft -10, 
        };
        fieldtip.style.opacity = 1;
        
        fieldtip.setAttribute('style',`top:${position.top}px;left:${position.left}px`);
        

    });
    span.addEventListener('mouseleave',function(){
        fieldtip = document.getElementById('fieldtip');
        fieldtip.style.opacity = 0;
        fieldtip.style.display ='none';
    });
    //span = 
   if(document.getElementById('fieldtip')==null)
   {
    place = document.getElementsByClassName('bgGrey')[0]; 
    place.append(addFieldTip());
    
   }
    container.append(span);
    return container;
}

function pointGain(){
    rPower = parseFloat(document.getElementById('checkboxTotal').textContent.slice(0,-1)/100);
    checkboxdAttr= document.querySelectorAll('input[type="checkbox"]:not(.checkAll)');
    gametable =document.getElementById('statsTable').tBodies[0];
    var totalGain = 0;
    Object.keys(checkboxdAttr).forEach(area =>{
        var gain = 0;
        var areaIndex = checkboxdAttr[area].parentElement.parentElement.rowIndex-1;
        if(checkboxdAttr[area].checked){
        
        if(checkboxdAttr[area].parentElement.previousElementSibling.parentElement.classList.contains('bgLightGreen')){
            gain = Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent*1.1);
        }
        else if(checkboxdAttr[area].parentElement.previousElementSibling.parentElement.classList.contains('bgLightRed'))
        {
            gain =  Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent*0.5);
        }else
        {
            gain = Math.ceil(rPower * gametable.rows[areaIndex].cells[2].textContent);
           
           // console.log('neutraal');
        }
        totalGain+=gain;
         gametable.rows[areaIndex].cells[3].textContent = gain;
        }
        else
        gametable.rows[areaIndex].cells[3].textContent ="";
        
    });
    document.getElementById('totalGain').textContent = totalGain;
    //console.log(totalGain);
}