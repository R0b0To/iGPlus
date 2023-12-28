if(!document.getElementById('strategy')?.getAttribute('injected') ?? false)
  (async function main(){
    document.getElementById('strategy').setAttribute('injected',true);
    //console.log('strategy loading');
    const observer = new MutationObserver(function (mutations) {
      //console.log(mutations);
      if(document.getElementsByClassName('PLFE')[0]?.value ?? false)
        mutations.forEach(mut => {

          //extra stint added or removed
          if(mut.type == 'childList' && mut.target.classList.contains('darkgrey'))
          {
            const driver_form = mut.target.closest('form');
            setTotalLapsText(driver_form);
            updateFuel(driver_form.querySelector('tbody'));
          }

          //mutation of lap number
          if(mut.target.tagName == 'SPAN' && mut.addedNodes.length > 0 && mut.target.classList.length == 0)
          {
            update_stint(mut.target.closest('td'));
            setTotalLapsText(mut.target.closest('form'));
          }

        });
    });

    function setTotalLapsText(driver_form){
      const stintsLaps = driver_form.querySelectorAll('td[style="visibility: visible;"]>span');
      let total = 0;
      for(const laps of stintsLaps)
        total += Number(laps.textContent);

      driver_form.querySelector('[id*=TotalLaps]').textContent = total;
    }
    //language
    const {language}  = await chrome.storage.local.get({ language: 'en' });
    const {language: i18n}  = await import(chrome.runtime.getURL('common/localization.js'));
    //track information
    const TRACK_CODE = document.querySelector('.flag').className.slice(-2) ?? 'au';
    const {track_info, multipliers, trackLink ,trackDictionary} = await import(chrome.runtime.getURL('/strategy/const.js'));
    let TRACK_INFO = track_info[TRACK_CODE];
    //league information
    const league = document.querySelector('#mLeague').href;
    const league_id = /(?<=id=).*/gm.exec(league)[0];
    const { fetchLeagueData, fetchCarData } = await import(chrome.runtime.getURL('common/fetcher.js'));
    const league_info = await fetchLeagueData(league_id) ?? false;
    const league_length = /(?<=chronometer<\/icon> ).\d+/gm.exec(league_info.vars.rules)[0];
    const multiplier = multipliers[league_length] ?? 1;
    //car information
    const { fuel_calc, get_wear } = await import(chrome.runtime.getURL('strategy/strategyMath.js'));
    const car_data = await fetchCarData() ?? false;
    const CAR_ECONOMY = {fe:car_data.vars.fuel_economyBar,te:car_data.vars.tyre_economyBar,fuel:fuel_calc(car_data.vars.fuel_economyBar)};
    //active scripts
    const active_scripts = await chrome.storage.local.get('script');
    //utility
    const {createSlider} = await import(chrome.runtime.getURL('/strategy/utility.js'));
    const {addStintEventHandler, updateFuel, update_stint} = await import(chrome.runtime.getURL('/strategy/extraStints.js'));
    const {dragStintHandler} = await import(chrome.runtime.getURL('/strategy/dragStint.js'));
    const {addSaveButton} = await import(chrome.runtime.getURL('/strategy/saveLoad.js'));
    let readAttempts = 3;
    try {
      if (league_info != false) {
        injectAdvancedStint();
        injectCircuitMap();       
        readGSheets();
        addMoreStints();
        addSaveButton({economy:CAR_ECONOMY,track:{code:TRACK_CODE,info:TRACK_INFO},league:league_length});
        addWeatherInStrategy();
        addSelectCheckbox();

        //eventAdded is a placeholder for knowing if the eventlistener is already present
        if(document.getElementById('eventAdded') == null)
          dragStintHandler();
        if(active_scripts.script.sliderS)
          addFuelSlider();
        if(active_scripts.script.editS)
          addEdit();

        //add mutation observer to game dialog. detecting when user open the tyre/fuel dialog
        waitForAddedNode({id: 'stintDialog',parent: document.getElementById('dialogs-container'),recursive: false,done:function(el){addBetterStintFuel(el);}});
      }

    } catch (error) {
      console.log(error);
    }
    function savePush(tbody){
    // console.log('saving');

      const newPL = tbody.querySelectorAll('[class^=PL]');
      const pushes = document.querySelectorAll('[class^=PL]');

      let pl = [];
      pl.push(tbody.getElementsByClassName('PL1')[0].value);
      pl.push(tbody.getElementsByClassName('PL2')[0].value);
      pl.push(tbody.getElementsByClassName('PL3')[0].value);
      pl.push(tbody.getElementsByClassName('PL4')[0].value);
      pl.push(tbody.getElementsByClassName('PL5')[0].value);
      const fe = tbody.getElementsByClassName('PLFE')[0].value;

      CAR_ECONOMY.fuel = fuel_calc(parseInt(fe));

      //get the push value from all the select elements
      for(let i = 1; i < 6 ;i++){
        const p = document.querySelectorAll(`[class^=PL${i}]`);
        Object.keys(p).forEach(key=>{
          p[key].value = pl[i - 1];
        });
      }
      const pFE = document.getElementsByClassName('PLFE');
      const feToolTip = document.getElementsByClassName('tooltiptext');
      for (let i = 0; i < pFE.length; i++) {
        pFE[i].value = fe;
        feToolTip[i].textContent =  i18n[language].pushDescriptionPart1 + ((fuel_calc(fe)).toFixed(3)) + i18n[language].pushDescriptionPart2;
      }
      chrome.storage.local.set({'pushLevels':pl});
      for(var j = 0 ; j < 5 ; j++)
      {
        const option = document.getElementsByClassName('OPL' + (j + 1));
        for(let item of option)
        {
          item.value = pl[j];
        }
      }
      const toUpdate = document.getElementsByClassName('fuelEst');
      Object.keys(toUpdate).forEach(car=>{
        updateFuel(toUpdate[car].closest('tbody'));
      });
    }
    async function injectAdvancedStint(){
      const dstrategy = document.getElementsByClassName('fuel');

      Object.keys(dstrategy).forEach(async driver =>{
        const driverForm = dstrategy[driver].closest('form');
        const strategyIDNumber = driverForm.id[1];
        observer.observe(dstrategy[driver].closest('tbody'), { characterData: true, attributes: true, childList: true, subtree: true });
        //add fuel div if the race is no refuel
        if(document.getElementById(`d${strategyIDNumber}strategyAdvanced`).querySelectorAll('.greyWrap').length > 2)
        {
          var elem = document.createElement('div');
          elem.setAttribute('style','color:white; font-family:RobotoCondensedBold; font-size:.9em;');
          elem.className = 'fuelEst';
          const placement = driverForm.querySelector('[id^=\'d\']').parentElement;
          if(placement.childElementCount < 2)
            placement.append(elem);
        }
        else{
          const lapsRow = driverForm.getElementsByClassName('fuel')[0];
          lapsRow.classList.add('reallaps');
          lapsRow.cells[0].addEventListener('click',function(){
            lapsRow.querySelectorAll('td').forEach(e => {
              const [fuel,laps] = e.querySelectorAll('input');
              const push = lapsRow.nextElementSibling.nextElementSibling.cells[e.cellIndex];
              const pushToAdd = push.querySelector('select').value;
              laps.value =  Math.floor((parseFloat(fuel.value) / ((CAR_ECONOMY.fuel + parseFloat(pushToAdd)) * TRACK_INFO.length)));
              e.querySelector('span').textContent = laps.value;
            });
          });

        }


        Promise.all([createPushRow(dstrategy[driver])]).then(() => {
        //after wear and push rows are generated execute this
          createWearRow(dstrategy[driver]);
          update_stint(dstrategy[driver].cells[1]);


        });


      });

      if(document.body.getAttribute('boxEvent') == null)
      {
        document.body.removeEventListener('click',handleClickOutsidePushBox,false);
        document.body.addEventListener('click',handleClickOutsidePushBox,false);

      }

      function handleClickOutsidePushBox(event) {
        document.body.setAttribute('boxEvent', true);
        const box = document.getElementsByClassName('not-selectable');
        const button = document.getElementsByClassName('dropbtn1');
        Object.keys(box).forEach(key => {
        //console.log(box[key].closest('th').contains(event.target));
          if (!box[key].closest('th').contains(event.target) && box[key].classList.contains('show')) {

            if( box[key].classList)
              box[key].classList.remove('show');
            box[key].nextElementSibling.classList.remove('show');

            savePush(box[key].closest('tbody'));
          //updateFuel(box[key].closest('tbody'));
          }
        });
      }

      function createPushRow(strategy)
      {
        const pushesText = document.getElementsByName('pushLevel')[0];
        const pushEquivalent = {
          FE:'FE',
          1:pushesText[4].textContent,
          2:pushesText[3].textContent,
          3:pushesText[2].textContent,
          4:pushesText[1].textContent,
          5:pushesText[0].textContent};
        return new Promise((resolve, reject) => {
          const defaultPush = [-0.007, -0.004, 0, 0.01, 0.02];
          let pushToUse = [];
          chrome.storage.local.get({ 'pushLevels': defaultPush }, function (data) {
            pushToUse = data.pushLevels;
            const pushEle = document.createElement('tr');
            pushEle.setAttribute('pushevent', true);
            var pushButtonHeader = document.createElement('th');
            pushButtonHeader.className = 'dropdown1';
            var pushButton = document.createElement('div');
            pushButton.className = 'dropbtn1';
            pushButton.textContent = i18n[language].pushText;
            pushButton.addEventListener('click',function(){
              this.nextSibling.classList.toggle('show');
              this.nextSibling.nextSibling.classList.toggle('show');
              //savePush();

            });

            pushButtonHeader.append(pushButton);
            //TO DO? change to dialog?
            var pushDiv = document.createElement('div');
            pushDiv.className = 'dropdown1-content not-selectable';
            pushDiv.id = 'myDropdown';
            const fuelEco = createPushElement('FE', CAR_ECONOMY.fe, 1);
            pushDiv.append(fuelEco);
            for (let i = 5; i > 0; i--) {
              const p = createPushElement(i, '', 0.001);
              pushDiv.append(p);
              pushButtonHeader.append(pushDiv);
            }
            var tooltipElem = document.createElement('div');
            tooltipElem.className = 'dropdown1-content tooltip1';
            tooltipElem.textContent = '?';
            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltiptext';
            tooltipText.textContent = i18n[language].pushDescriptionPart1 + ((CAR_ECONOMY.fuel).toFixed(3)) + i18n[language].pushDescriptionPart2;
            tooltipElem.append(tooltipText);
            pushButtonHeader.append(tooltipElem);
            const row_name = pushButtonHeader;
            row_name.setAttribute('style', 'color:white; height:20px; border-radius:4px; text-align:center; border:0px; font-family:RobotoCondensedBold; width:100%;');
            pushEle.append(row_name);
            
            for (let i = 1; i < strategy.childElementCount; i++) {
              var stint = document.createElement('td');
              var pushSelect = document.createElement('select');
              pushSelect.classList.add('pushSelect');
              pushSelect.addEventListener('change',updateFuel);
              for (var j = 5; j > 0; j--) //5 push options
              {
                var pushOption = document.createElement('option');
                pushOption.textContent = pushEquivalent[j];
                if (j == 3)
                  pushOption.selected = true; //pre select middle push
                pushOption.value = pushToUse[j - 1];
                pushOption.className = 'OPL' + j;
                pushSelect.append(pushOption);
              }
              stint.append(pushSelect);
              stint.style.visibility = strategy.childNodes[i].style.visibility;
              pushEle.append(stint);

            }
            if (strategy.parentElement.querySelector('[pushevent=true]') == null) {
              strategy.parentElement.insertBefore(pushEle, strategy.parentElement.childNodes[5]);

              resolve(`driver ${strategy.closest('form').id[1]} push is done`);
            }
          });



          function createPushElement(i, value, step) {
            var pushInputDiv = document.createElement('div');
            pushInputDiv.className = 'pushDiv';

            var pushInputLabel = document.createElement('div');
            pushInputLabel.textContent = pushEquivalent[i];
            pushInputLabel.classList.add('pushBox');

            var pushInputDown = document.createElement('div');

            var  textSpan = document.createElement('span');
            textSpan.textContent = '−';
            pushInputDown.append(textSpan);
            pushInputDown.className = 'pushPlusMin';
            pushInputDown.addEventListener('click', function () {
              this.parentNode.querySelector('input[type=number]').stepDown();
            });

            var pushInput = document.createElement('input');
            pushInput.className = 'PL' + i + ' pushInput';
            pushInput.type = 'number';
            pushInput.step = step; '0.001';
            //pushInput.setAttribute("style", "margin: 9px;");

            if (i == 'FE'){
              pushInput.value = value;
              pushInputLabel.textContent = '';
              pushInputLabel.classList.add('feLabel');
            }
            else
              pushInput.value = pushToUse[i - 1];


            var pushInputUp = document.createElement('div');
            pushInputUp.className = 'pushPlusMin';

            var  textSpan = document.createElement('span');
            textSpan.textContent = '+';
            pushInputUp.append(textSpan);
            pushInputUp.addEventListener('click', function () {
              this.parentNode.querySelector('input[type=number]').stepUp();
            });

            pushInputDiv.append(pushInputLabel);
            pushInputDiv.append(pushInputDown);
            pushInputDiv.append(pushInput);
            pushInputDiv.append(pushInputUp);

            return pushInputDiv;
          }
        });
      }
      function createWearRow(strategy) {
        return new Promise((resolve, reject) => {
          const wearEle = document.createElement('tr');
          wearEle.setAttribute('wearevent', true);
          const row_name = document.createElement('th');
          row_name.textContent = 'Wear';
          row_name.style.fontSize = '.8em';
          wearEle.append(row_name);
          //starts at 1 because the first element is the name title
          for (var i = 1; i < strategy.childElementCount; i++) {
            var stint = document.createElement('td');
            var tyre = strategy.previousElementSibling.cells[i].className.slice(3); //tyre of stint i
            var laps = strategy.cells[i].textContent;  
            CAR_ECONOMY.push =  strategy.nextElementSibling.cells[1].childNodes[0].selectedIndex; 
            var w = get_wear(tyre, laps ,TRACK_INFO , CAR_ECONOMY, multiplier);
            stint.style.visibility = strategy.cells[i].style.visibility;
            //event will fire when laps or tyre is changed

            stint.textContent = w;
            wearEle.append(stint);
          }
          if (strategy.parentElement.querySelector('[wearevent=true]') == null) {
            strategy.parentElement.insertBefore(wearEle, strategy.parentElement.childNodes[5]);
            resolve(`driver ${strategy.closest('form').id[1]} wear is done`);
          }
        });
      }

    }
    async function addBetterStintFuel(el){
      const track_code = document.querySelector('.flag').className.slice(-2) ?? 'au';
      TRACK_INFO = track_info[track_code];
      const fuel_el = el.querySelector('.num');
      const fe_used = Number(document.getElementsByClassName('PLFE')[0].value);
      const fuelPerLap = fuel_calc(fe_used);
      const driver = document.querySelector('form[id$="strategy"]:not([style*="display:none"]):not([style*="display: none"])');
      const stintID = parseInt(document.getElementsByName('stintId')[0].value);
      const pushToAdd = parseFloat(driver.querySelector('[pushevent]').cells[stintID].childNodes[0].value);
      //observe the fuel change in the dialog for tyre/fuel selection+
      const fuelChangeObserver = new MutationObserver(function (mutations) {
        //console.log('fuelChangeObserver')
        mutations.forEach(mut => {
          const fuel_el = el.querySelector('.num');
          const fuelPerLap = fuel_calc(document.getElementsByClassName('PLFE')[0].value);
          const driver = document.querySelector('form[id$="strategy"]:not([style*="display:none"]):not([style*="display: none"])');
          const stintID = parseInt(document.getElementsByName('stintId')[0].value);
          const pushToAdd = parseFloat(driver.querySelector('[pushevent]').cells[stintID].childNodes[0].value);
          document.getElementById('realfuel').textContent = (parseFloat(fuel_el.textContent) / ((fuelPerLap + pushToAdd) * TRACK_INFO.length)).toFixed(2);
        });
      });

      fuelChangeObserver.observe(fuel_el, { characterData: false, attributes: false, childList: true, subtree: false });
      const estimatedlaps = document.getElementById('fuelLapsPrediction');
      if (document.getElementById('realfuel') == null) {
        const real = document.createElement('span');
        real.id = 'realfuel';
        real.setAttribute('style', 'position: relative;top: 2px;vertical-align: text-bottom;width: 2rem;display: inline-table;color: #ffffff;margin-left: 5px;cursor: pointer;background-color: #96bf86;border-radius: 40%;');
        real.textContent = (Number(fuel_el.textContent) / ((fuelPerLap + pushToAdd) * TRACK_INFO.length)).toFixed(2);
        real.addEventListener('click',function overwrite(){
          document.getElementById('fuelLapsPrediction').textContent = this.textContent;
        });
        estimatedlaps.parentElement.append(real);
      }
    }
    // add observer for dialog opening. this will handle
    function waitForAddedNode(params) {

      if(params.parent.getAttribute('observing') ?? false)
        return;

      params.parent.setAttribute('observing',true);
      const dialogObserver = new MutationObserver(function(mutations) {
        const el = params.parent.querySelector('form');
        if (el) {
        //is dialog the tyre/fuel selection?
          if(el.querySelector('[id=fuelLapsPrediction]'))
          {
            try {
              params.done(el);
            } catch (error) {
              console.log(error);
            }
          }
        //this.disconnect();
        }
      });
      // this observer will stay active until hard page reload
      dialogObserver.observe(params.parent || document, {
        subtree: !!params.recursive || !params.parent,
        childList: true,
      });
      return dialogObserver;
    }

    function addEdit()
    {
      const advancedFuel = document.getElementsByName('advancedFuel');
      if(advancedFuel != null)
      {
        advancedFuel.forEach(car => {

          if(!car.getAttribute('event')) {
            createEdit(car);
            car.setAttribute('event',true);
          }


        });
      }

      function createEdit(node){

        const  text = node.parentElement.querySelectorAll('.num')[0];
        text.contentEditable = true;
        text.classList.add("withSlider");
        text.classList.remove("green");
        text.addEventListener('click',function(){
          if(this.textContent != ''){
            this.parentElement.nextElementSibling.value = this.textContent;
          }
          this.textContent = '';
        });
        text.addEventListener('focusout',function(e){
          this.textContent = this.parentElement.nextElementSibling.value ;
        });
        text.addEventListener('input',function(e){

          const stored = this.parentElement.nextElementSibling;

          if (!e.data.match(/^[0-9]{0,2}$/)) {
            this.textContent = '';
          }
          let currentValue = parseInt(this.textContent);
          if(isNaN(currentValue))
          {
            currentValue = stored.value;
          }
          if(currentValue > parseInt(stored.max))
          {
            this.textContent = stored.max;
            currentValue = stored.max;
          } if(currentValue == 0)
          {
            const driverStrategyId = this.closest('form').id;
            document.getElementsByName('fuel1')[driverStrategyId[1] - 1].value = 0;
          }
          //this.textContent=(currentValue);
          stored.value = currentValue;
        });
      }
    }
    function addFuelSlider()
    {
      advancedFuel = document.getElementsByName('advancedFuel');
      if(advancedFuel != null)
      {
        advancedFuel.forEach(car => {

          if(car.previousElementSibling.childElementCount < 4)
            createSlider(car,0,200);

        });
      }

    }
    function syncSelects() {
      const car = this.closest("form").id[1] 
      const checkbox = this.parentElement.querySelector('.syncCheckbox');
      const main_select = this.parentElement.querySelector('[name=pushLevel]');
      const select_elements = document.getElementById(`d${car}strategy`).querySelectorAll(".pushSelect");
      if (checkbox.checked) {    
        select_elements.forEach(select=> {
          select.classList.add("select_overwrite")
          select.selectedIndex = main_select.selectedIndex;
          select.disabled = true;
          update_stint(select.closest("tbody").rows[2].cells[select.parentElement.cellIndex])
        })

        
      }
      else{
        select_elements.forEach(select=> {
          select.classList.remove("select_overwrite")
          select.disabled = false;
        })
      }
    }
    function addSelectCheckbox()
    {
      targetElement = document.getElementsByName('pushLevel');
      if(targetElement != null)
      {
        
        targetElement.forEach(car => {

          if(car)
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("syncCheckbox");
            checkbox.textContent = "Synchronize Selects";
            checkbox.addEventListener("change", syncSelects);
            car.parentNode.insertBefore(checkbox, car.nextSibling);
            car.addEventListener("change",syncSelects)

        });
      }

    }
    function injectCircuitMap(){


      if(!document.getElementById('customMap'))
      {
        try {
          const target = document.querySelector('[id=strategy] .eight');
          const circuit = document.createElement('img');
          circuit.id = 'customMap';
          circuit.src = chrome.runtime.getURL('images/circuits/' + TRACK_CODE + '.png');
          circuit.src = chrome.runtime.getURL(`images/circuits/${TRACK_CODE}.png`);
          circuit.setAttribute('style','width:100%;');
          const imageLink = document.createElement('a');
          imageLink.href = trackLink[TRACK_CODE];
          imageLink.append(circuit);
          target.append(imageLink);
        } catch (error) {
        //page changed
        }

      }
    }
    async function readGSheets()
    {
      if(document.getElementById('importedTable') == null)
      {
        async function getCurrentTrack(trackj){

          const jTrack = [];
         try {
          trackj.forEach((ele) =>
          {
           
              if(isNaN(ele[t.gTrack]))
                requestedTrack = ele[t.gTrack].toLowerCase();
              else
                requestedTrack = ele[t.gTrack];

              if(trackDictionary[TRACK_CODE].includes(requestedTrack))
                jTrack.push(ele);

            
          });} catch (error) {
            return -1;
          }
          
          return jTrack;
        }
        function sortTable() {

          n = this.cellIndex;

          var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
          table = document.getElementById('importedTable');
          switching = true;
          dir = 'asc';
          while (switching) {
            switching = false;
            rows = table.rows;
            for (i = 1; i < (rows.length - 1); i++) {
              shouldSwitch = false;
              x = rows[i].getElementsByTagName('TD')[n];
              y = rows[i + 1].getElementsByTagName('TD')[n];
              var cmpX = isNaN(parseInt(x.innerHTML)) ? x.innerHTML.toLowerCase() : parseInt(x.innerHTML);
              var cmpY = isNaN(parseInt(y.innerHTML)) ? y.innerHTML.toLowerCase() : parseInt(y.innerHTML);
              cmpX = (cmpX == '-') ? 0 : cmpX;
              cmpY = (cmpY == '-') ? 0 : cmpY;
              if (dir == 'asc') {
                if (cmpX > cmpY) {
                  shouldSwitch = true;
                  break;
                }
              } else if (dir == 'desc') {
                if (cmpX < cmpY) {
                  shouldSwitch = true;
                  break;
                }
              }
            }
            if (shouldSwitch) {
              rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
              switching = true;
              switchcount ++;
            } else {
              if (switchcount == 0 && dir == 'asc') {
                dir = 'desc';
                switching = true;
              }
            }
          }
        }
        savedLink = await chrome.storage.local.get({'gLink':''});

        if(savedLink.gLink != '')
        {
          t = await chrome.storage.local.get({'gTrack':'track'});
          sName = await chrome.storage.local.get({'gLinkName':'Sheet1'});
          idRegex = /spreadsheets\/d\/(.*)\/edit/;
          link = idRegex.exec(savedLink.gLink)[1];
          const sheetId = link;
          const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
          //console.log(sName);
          const sheetName = sName.gLinkName;
          const query = encodeURIComponent('Select *');
          const url = `${base}&sheet=${sheetName}&tq=${query}`;
          const data = [];
          var output = document.createElement('table');//document.querySelector('.output')
          output.setAttribute('style','width: 100%;table-layout: auto;text-align: center;');
          output.id = 'importedTable';
          init();
          async function init() {
            //e.preventDefault()
            await new Promise((res) => setTimeout(res, 500)); // sleep a bit, while page loads
            await fetch(url)
              .then(res => res.text())
              .then(async rep => {
              //Remove additional text and extract only JSON:
                const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
                const colz = [];
                const tr = document.createElement('tr');

                //if data is without labels make the first row the labels
                if(!jsonData.table.cols[0].label)
                {
                  for(var i = 0 ; i < jsonData.table.cols.length; i++)
                  {
                    jsonData.table.cols[i].label = jsonData.table.rows[0].c[i].v;
                  }
                }

                //Extract column labels
                jsonData.table.cols.forEach((heading) => {
                  if (heading.label) {
                    let column = heading.label;
                    if(column.toLowerCase() == t.gTrack)
                    {
                      column = column.toLowerCase();
                    }
                    colz.push(column);
                    const th = document.createElement('th');
                    th.setAttribute('style','font-family: "RobotoCondensed","Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif;cursor: pointer;background-color: #8f8f8f;color: #ffffff;border-radius: 5px;');
                    th.addEventListener('click',sortTable);
                    th.textContent = column;
                    tr.appendChild(th);

                  }
                  else
                  {

                  }
                });
                output.appendChild(tr);
                //extract row data:
                jsonData.table.rows.forEach((rowData) => {
                  const row = {};
                  colz.forEach((ele, ind) => {
                    row[ele] = (rowData.c[ind] != null) ? rowData.c[ind].v : '';
                  });
                  data.push(row);
                });
                const result = await processRows(data)
                if (result == -1)
                  return
                else
                {
                  if(document.getElementById('importedTable') == null)
                  {
                    function removeColumn(table, columnName) {
                    // Find the index of the column to remove
                      let colIndex = -1;
                      for (let i = 0; i < table.rows[0].cells.length; i++) {
                        if (table.rows[0].cells[i].textContent === columnName) {
                          colIndex = i;
                          break;
                        }
                      }
      
                      // If the column was found
                      if (colIndex !== -1) {
                      // Remove the cells from all rows
                        for (let i = 0; i < table.rows.length; i++) {
                          table.rows[i].deleteCell(colIndex);
                        }
                      }
                    }
      
      
                    document.querySelectorAll('.eight.columns.mOpt.aStrat')[0].append(output);
                    removeColumn(output,t.gTrack);
                  }
                }
              });

          }

        }

        async function processRows(json) {
              json = await getCurrentTrack(json);
              if(json == -1 && readAttempts > 0)
              {
                readAttempts--;
                await new Promise((res) => setTimeout(res, 2000)); // sleep a bit, while page loads
                readGSheets();
                return -1;
              }
          json.forEach((row) => {
            const tr = document.createElement('tr');
            const keys = Object.keys(row);

            keys.forEach((key) => {
              const td = document.createElement('td');
              td.textContent = row[key];
              tr.appendChild(td);
            });
            output.appendChild(tr);
          });

        }}
    }
    async function addMoreStints()
    {
      const strategies = document.getElementsByClassName('fuel');
      Object.keys(strategies).forEach(car=>{
        addStintEventHandler(strategies[car].closest('form').querySelector('.igpNum').parentElement,{CAR_ECONOMY,TRACK_INFO,multiplier});

      });

    }
    function addWeatherInStrategy(){
      const strategy = document.getElementsByClassName('fuel');
      Object.keys(strategy).forEach(car=>{
        const w = (document.getElementsByClassName('pWeather text-right green')[0]).cloneNode(true);
        w.className = '';
        w.childNodes[0].style.filter = 'brightness(0) invert(1)';
        w.childNodes[1].style.color = 'white';
        w.childNodes[2].setAttribute('style','width: 28px;height: 28px;');
        w.setAttribute('style','display: inline;padding-right: 10px;');
        const notice = strategy[car].closest('tbody').querySelector('.notice');
        if(notice.querySelector('.waterLevel') == null)
          notice.prepend(w);
      });
    }
  })();

