
if(!document.getElementById('strategy')?.getAttribute('injected') ?? false)
  (async function main(){
    document.getElementById('strategy').setAttribute('injected',true);
    //console.log('strategy loading');
    const observer = new MutationObserver(function(mutations){ mutations.forEach(mut=>{if(mut.target.parentElement.style.visibility == 'visible' && mut.addedNodes.length > 0)update_stint(mut.target.closest('td'));});});
    //language
    const {language}  = await chrome.storage.local.get({ language: 'en' });
    const {language: i18n}  = await import(chrome.runtime.getURL('common/localization.js'));
    //track information
    const TRACK_CODE = document.querySelector('.flag').className.slice(-2) ?? 'au';
    const {track_info, multipliers, trackLink ,trackDictionary} = await import(chrome.runtime.getURL('/strategy/const.js'));
    const TRACK_INFO = track_info[TRACK_CODE];
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
    const { icons } = await import(chrome.runtime.getURL('/common/config.js'));
    const {createSlider, hashCode, childOf} = await import(chrome.runtime.getURL('/strategy/utility.js'));

    try {
      if (league_info != false) {
        injectAdvancedStint();
        injectCircuitMap();
        readGSheets();
        addMoreStints();
        addSaveButton();
        addWeatherInStrategy();

        //eventAdded is a placeholder for knowing if the eventlistener is already present
        if(document.getElementById('eventAdded') == null)
          dragStint();
        if(active_scripts.script.sliderS)
          addFuelSlider();
        if(active_scripts.script.editS)
          addEdit();

        //add muutation observer to game dialog. detecting when user open the tyre/fuel dialog
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
        feToolTip[i].textContent =  i18n[language].pushDescriptionPart1 + ((fuel_calc(fe) * TRACK_INFO.length).toFixed(3)) + ' ' + i18n[language].pushDescriptionPart2;
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
        const strategyIDNumber = dstrategy[driver].closest('form').id[1];

        //add fuel div if the race is no refuel
        if(document.getElementById(`d${strategyIDNumber}strategyAdvanced`).querySelectorAll('.greyWrap').length > 2)
        {
          var elem = document.createElement('div');
          elem.setAttribute('style','color:white; font-family:RobotoCondensedBold; font-size:.9em;');
          elem.className = 'fuelEst';
          const placement = dstrategy[driver].closest('form').querySelector('[id^=\'d\']').parentElement;
          if(placement.childElementCount < 2)
            placement.append(elem);
        }


        Promise.all([createWearRow(dstrategy[driver]),createPushRow(dstrategy[driver])]).then((test) => {
        //after wear and push rows are generated execute this
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
              const image = document.createElement('img');
              image.src = icons['igp-fuel'];
              pushInputLabel.textContent='';
              image.classList.add('feLabel');
              pushInputLabel.append(image);
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
            var w = get_wear(tyre, laps ,TRACK_INFO , CAR_ECONOMY, multiplier);
            stint.style.visibility = strategy.cells[i].style.visibility;
            //event will fire when laps or tyre is changed
            observer.observe(strategy.cells[i].childNodes[0], { characterData: false, attributes: false, childList: true, subtree: false });
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
      const fuel_el = el.querySelector('.num');
      const fuelPerLap = fuel_calc(document.getElementsByClassName('PLFE')[0].value);
      const driver = document.querySelector('form[id$="strategy"]:not([style*="display:none"]):not([style*="display: none"])');
      const stintID = parseInt(document.getElementsByName('stintId')[0].value);
      const pushToAdd = parseFloat(driver.querySelector('[pushevent]').cells[stintID].childNodes[0].value);
      //observe the fuel change in the dialog for tyre/fuel selection
      var fuelChangeObserver = new MutationObserver(function (mutations) {
        console.log('changing fuel');
        mutations.forEach(mut => {
          document.getElementById('realfuel').textContent = (parseFloat(fuel_el.textContent) / ((fuelPerLap + pushToAdd) * TRACK_INFO.length)).toFixed(2);
        });
      });

      //observe dialog opening/closing
      var dialogBoxObserver = new MutationObserver(function (mutations) {
        console.log('test');
        mutations.forEach(mut => {
          if (mut.type == 'childList' && mut.addedNodes.length == 0) {
          //console.log('closed');
            // this.disconnect();
            // waitForAddedNode({id: 'stintDialog',parent: document.getElementById('dialogs-container'),recursive: false,done:function(el){addBetterStintFuel(el);}});
          }

        });
      });
      //dialogBoxObserver.observe(document.getElementById('dialogs-container'), { childList: true, attributes: true, subtree: true });
      fuelChangeObserver.observe(fuel_el, { characterData: false, attributes: false, childList: true, subtree: false });
      const estimatedlaps = document.getElementById('fuelLapsPrediction');
      if (document.getElementById('realfuel') == null) {
        const real = document.createElement('span');
        real.id = 'realfuel';
        real.setAttribute('style', 'position: relative;top: 2px;vertical-align: text-bottom;width: 2rem;display: inline-table;color: #ffffff;margin-left: 5px;cursor: pointer;background-color: #96bf86;border-radius: 40%;');
        real.textContent = (parseFloat(fuel_el.textContent) / ((fuelPerLap + pushToAdd) * TRACK_INFO.length)).toFixed(2);
        //console.log(CAR_ECONOMY.fuel);
        real.addEventListener('click',function overwrite(){
          document.getElementById('fuelLapsPrediction').textContent = this.textContent;
        });
        estimatedlaps.parentElement.append(real);
      }

    }

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
      // this observer will stay avtive until hard page reload
      dialogObserver.observe(params.parent || document, {
        subtree: !!params.recursive || !params.parent,
        childList: true,
      });
      return dialogObserver;
    }
    function getColumnElements(elementOfColumn){
      const index = (elementOfColumn.cellIndex + 1) || (elementOfColumn.closest('td').cellIndex + 1) ;
      const column = elementOfColumn.closest('tbody').querySelectorAll(`th:nth-child(${index}),td:nth-child(${index}):not(.loadStint)`);
      return column;
    }
    function dropzoneEnter(e){
      const column = getColumnElements(e.target);
      column.forEach(c => c.classList.add('accept'));
    }
    function dropzoneLeave(e){
      const column = getColumnElements(e.target);
      column.forEach(c => c.classList.remove('accept'));
    }
    function dragStint(){

      if(document.getElementById('eventAdded') == null){
        const eventa = document.createElement('h1');
        eventa.id = 'eventAdded';
        eventa.style.display = 'none';
        document.getElementsByClassName('fuel')[0].parentElement.parentElement.append(eventa);
        const plusMinus = document.querySelectorAll('form[id$=strategy] .plus,form[id$=strategy] .minus');
        plusMinus.forEach(button => {
          button.addEventListener('click',addEvent,true);
          button.addEventListener('touchstart',addEvent,true);
        });

      }
      addEvent();
      function addEvent(){
      //waiting in case new stint is created
        setTimeout(()=>{
          const strategies = document.getElementsByClassName('fuel');
          const driver = [];
          let visibleStints = [];

          for(const strategy of strategies){
            driver.push(strategy.closest('tbody').firstChild);
          }
          driver.forEach(stintRow =>{
            stintRow.querySelectorAll('th:not(:first-child)').forEach(th => {
              th.classList.remove('dragMe');
              th.removeEventListener('mousedown',dragMousedown,true);
              th.removeEventListener('touchstart',dragMousedown,true);
            });
            visibleStints = visibleStints.concat(getVisibleStints(stintRow));
          });

          let info = null;
          visibleStints.forEach(th => {
            th.addEventListener('mousedown',dragMousedown,true);
            th.addEventListener('touchstart',dragMousedown,true);
            th.classList.add('dragMe');
          });
        },100);



      }

    }
    function getStintInfo(stintColumn){

      const tyre = stintColumn[1].querySelector('input').value;
      const fuel = stintColumn[2].querySelector('input').value;
      const laps = stintColumn[2].querySelector('span').textContent;
      const push = stintColumn[3].querySelector('select').selectedIndex;

      return {tyre,fuel,push,laps};
    }
    function setStintInfo(stintColumn,tyre,fuel,push,laps){
      stintColumn[1].querySelector('input').value = tyre;
      stintColumn[1].className = 'ts-' + tyre;
      stintColumn[1].setAttribute('data-tyre',tyre);
      stintColumn[2].querySelector('span').textContent = laps;
      stintColumn[2].querySelectorAll('input')[0].value = fuel;
      stintColumn[2].querySelectorAll('input')[1].value = laps;
      stintColumn[3].querySelector('select').selectedIndex = push;

    }

    function closeDragElement(e) {
      let isChild = false;
      const pointerOnTop = document.elementFromPoint(e.clientX, e.clientY);
      const strat = document.getElementsByClassName('strategy');

      for(const s of strat){
        if (childOf(pointerOnTop,s))
          isChild = true;
      }

      //try to set new info
      try {
        if(isChild){
          setStintInfo(getColumnElements(pointerOnTop),info.tyre,info.fuel,info.push,info.laps);
          update_stint((pointerOnTop.closest('tbody').querySelector('.fuel').cells[pointerOnTop.cellIndex]) || (pointerOnTop.closest('tbody').querySelector('.fuel').cells[pointerOnTop.closest('td').cellIndex]));
        }

      } catch (error) {

      }

      /* stop moving when mouse button is released:*/
      document.querySelectorAll('.dropzone,.dragging,.dropzonebottom').forEach(otherStint => {
        otherStint.classList.remove('dragging', 'dropzone', 'dropzonebottom','accept');
        otherStint.removeEventListener('pointerenter',dropzoneEnter,true);
        otherStint.removeEventListener('pointerleave',dropzoneLeave,true);
        document.removeEventListener('pointerup',closeDragElement);
      });

      document.removeEventListener('pointermove',elementDrag,true);

      const preview = document.getElementsByClassName('drag');
      for(ele of preview) ele.remove();

    }
    function elementDrag(e){

      const ele = document.getElementsByClassName('drag');
      Array.from(ele).forEach(stintPreview=>{
        stintPreview.style.top = e.clientY + 10 + 'px';
        stintPreview.style.left = e.clientX - 5 + 'px';
      });


    }
    function previewDrag(stintHeader,coord){
      const preview = document.getElementsByClassName('drag');
      for(ele of preview) ele.remove();
      const table = document.createElement('table');
      const row = document.createElement('tr');
      row.append(stintHeader.cloneNode(true));
      const tyreRow = document.createElement('tr');
      const tyre = stintHeader.closest('tr').nextElementSibling.cells[stintHeader.cellIndex].cloneNode(true);
      tyreRow.append(tyre);
      tyreRow.classList.add('tyre');
      table.append(row,tyreRow);
      table.classList.add('drag');
      table.id = 'previewDrag';
      table.style.top = coord.y + 5 + 'px';
      table.style.left = coord.x + 5 + 'px';
      return table;
    }
    function dragMousedown(e){
      e.preventDefault();
      if(e.target.closest('tbody').querySelector('.tyre').cells[e.target.cellIndex].style.visibility == 'visible'){
        const coord = {x:e.clientX,y:e.clientY};
        const preview = previewDrag(e.target,coord);

        document.body.append(preview);
        document.addEventListener('pointermove',elementDrag,true);
        info = getStintInfo(getColumnElements(e.target));

        const otherstints = getVisibleStints(e.target.closest('tr'));
        otherstints.forEach(s => {
          const stintColumns = getColumnElements(s);
          if(s == e.target){
            stintColumns.forEach(e => e.classList.add('dragging'));
          }else{
            //other visible elements that will be dropzones
            stintColumns.forEach(ele => {
              ele.classList.add('dropzone');
              if (ele.parentElement.getAttribute('wearevent'))
                ele.classList.add('dropzonebottom');
              ele.addEventListener('pointerenter',dropzoneEnter,true);
              ele.addEventListener('pointerleave',dropzoneLeave,true);

            });
          }
          document.addEventListener('pointerup',closeDragElement);
        });

      }


    }
    function getVisibleStints(stintHeader){
      const visibleS = [];
      const stints = stintHeader.querySelectorAll('th:not(:first-child)');
      stints.forEach(stint =>{
        if (stint.closest('tbody').querySelector('.tyre').cells[stint.cellIndex].style.visibility == 'visible')
          visibleS.push(stint);
      });
      return visibleS;
    }
    function update_stint(s)
    {
      const stint = s.cellIndex;
      const tbody = s.closest('tbody');
      const wearRow = tbody.querySelector('[wearevent]');
      const tyreRow = tbody.querySelector('.tyre');
      const tyre = tyreRow.cells[stint].className.slice(3);
      const laps = s.textContent;
      wearRow.cells[stint].textContent = get_wear(tyre,laps ,TRACK_INFO, CAR_ECONOMY, multiplier);
      updateFuel(tbody);
    }
    function updateFuel(tbod)
    {
    //this function is called either directly or by change event of the push select.
      if(tbod instanceof Event)
        tbod = tbod.target.closest('tbody');

      const pushRow = tbod.querySelector('[pushevent]');
      const tyreRow = tbod.querySelector('.tyre');
      const lapsRow = tbod.querySelector('.fuel');
      const stintNumber = tyreRow.querySelectorAll('[style*=\'visibility: visible\']').length;
      const ecoFuel = fuel_calc(parseInt(document.getElementsByClassName('PLFE')[0].value));
      let totalfuel = 0;
      let totalLaps = 0;
      for(var i = 1 ;i < stintNumber ;i++)
      {
        let push = parseFloat(pushRow.cells[i].childNodes[0].value);
        let laps = lapsRow.cells[i].textContent;
        totalLaps += parseInt(laps);
        const fuellap = ((ecoFuel + push) * TRACK_INFO.length);
        totalfuel += parseInt(laps) * fuellap;
      }
      const fuelEle = tbod.closest('form').getElementsByClassName('fuelEst')[0];
      const lapsTextNode = tbod.querySelector('.robotoBold');
      lapsTextNode.textContent = totalLaps;
      const raceLapsText = Number(lapsTextNode.nextSibling.textContent.split('/')[1]);
      lapsTextNode.classList.remove('block-orange');
      if(totalLaps > raceLapsText){
        lapsTextNode.classList.add('block-orange');
        lapsTextNode.classList.remove('block-grey');
      }
      if(totalLaps == raceLapsText)
        lapsTextNode.classList.remove('block-red');



      if(fuelEle != null)
        fuelEle.textContent = `Fuel:${totalfuel.toFixed(2)}`;
    }
    function addEdit()
    {
      advancedFuel = document.getElementsByName('advancedFuel');
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

        text = node.parentElement.querySelectorAll('.num')[0];
        text.contentEditable = true;

        text.setAttribute('style','border-radius: 50%;background-color: #96bf86;color: #ffffff!important;width: 2rem;height: 2rem;cursor: pointer;');
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

          stored = this.parentElement.nextElementSibling;

          if (!e.data.match(/^[0-9]{0,2}$/)) {
            this.textContent = '';
          }
          currentValue = parseInt(this.textContent);
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
            driverStrategyId = this.closest('form').id;
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
        async function getCurrentTrack(j){

          jTrack = [];

          j.forEach((ele) =>
          {
            try {
              if(isNaN(ele[t.gTrack]))
                requestedTrack = ele[t.gTrack].toLowerCase();
              else
                requestedTrack = ele[t.gTrack];

              if(trackDictionary[TRACK_CODE].includes(requestedTrack))
                jTrack.push(ele);

            } catch (error) {
              console.log(error);
            }
          });

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
            await fetch(url)
              .then(res => res.text())
              .then(async rep => {
              //Remove additional text and extract only JSON:
                const jsonData = JSON.parse(rep.substring(47).slice(0, -2));
                //console.log(jsonData);
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

                await processRows(data);
              });

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




        }

        async function processRows(json) {
        //  console.log(json);

          json = await getCurrentTrack(json);

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
    function removeStints(minusDiv)
    {

      if(minusDiv.tagName != 'DIV')
      {
        var pits = this.nextElementSibling.textContent.match(/\d+/)[0];
        minusDiv = this;
      }
      else
        pits = minusDiv.nextElementSibling.textContent.match(/\d+/)[0];

      var driver = minusDiv.closest('form');
      totalStintNumber = driver.getElementsByClassName('tyre')[0].querySelectorAll('td[style*="visibility: visible"]').length;

      if(totalStintNumber <= 5)
      {
        minusDiv.nextElementSibling.nextElementSibling.setAttribute('style','background-color:#6c7880');
        minusDiv.nextElementSibling.nextElementSibling.className = 'plus';
        minusDiv.nextSibling.nextElementSibling.nextElementSibling.style.visibility = 'hidden';
      }
      if(totalStintNumber <= 6)
      {
        minusDiv.nextSibling.nextElementSibling.nextElementSibling.style.visibility = 'hidden';
      }

      var extraStints = parseInt(minusDiv.parentElement.lastChild.childNodes[1].textContent);
      pitNumber = minusDiv.nextElementSibling.childNodes[0].textContent;



      extraStints = hasExtraStint(pitNumber);



      if(totalStintNumber > 5){
        minusDiv.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan--;


        driver = minusDiv.parentElement.parentElement.parentElement;
        var strategyTable = driver.childNodes[3].childNodes[0];
        strategyTable.childNodes[0].lastChild.remove();
        strategyTable.childNodes[1].lastChild.remove();
        strategyTable.childNodes[3].lastChild.remove();
        strategyTable.childNodes[5].lastChild.remove();
        strategyTable.childNodes[6].lastChild.remove();


        minusDiv.parentElement.lastChild.childNodes[1].textContent = totalStintNumber - 6;


        if((totalStintNumber - 1) == 5)
        {
          minusDiv.className = 'minus';
          minusDiv.setAttribute('style','background-color:#6c7880');

        }

      }

    }
    function injectExtraStints(plusDiv){


      return new Promise((resolve, reject) => {

        success = false;

        if(plusDiv.tagName != 'DIV')
        {
          var pits = this.previousElementSibling.textContent.match(/\d+/)[0];
          plusDiv = this;
        }
        else
          pits = plusDiv.previousElementSibling.textContent.match(/\d+/)[0];


        var driver = plusDiv.closest('form');
        var pitRow = driver.getElementsByClassName('darkgrey')[0];
        numberOfExtraPits = hasExtraStint(pits);

        if(pits >= 4 && plusDiv.style.backgroundColor == 'firebrick' && pitRow.childElementCount < 8)
        {

          var minus = plusDiv.nextElementSibling.parentElement.firstChild;
          minus.className = 'minus disabled';
          minus.setAttribute('style','background-color: firebrick;opacity: 100!important;');
          plusDiv.nextElementSibling.setAttribute('style','visibility:visible');

          if(plusDiv.className == 'plus disabled'){

            var strategyTable = driver.childNodes[3].childNodes[0];

            plusDiv.parentNode.parentElement.parentElement.childNodes[3].childNodes[0].lastChild.childNodes[0].colSpan++;

            //clone last pit

            var pitTh = pitRow.lastChild.cloneNode(true);
            var lastpit = parseInt(pitTh.textContent.match(/\d+/)[0]);

            plusDiv.nextElementSibling.childNodes[1].textContent = pitRow.childElementCount - 5;
            lastpit++;
            pitTh.textContent = pitTh.textContent.replace(/[0-9]/g, lastpit);
            pitRow.appendChild(pitTh);

            //clone last tyre
            var tyreRow = strategyTable.childNodes[1];
            var clonedTyre = tyreRow.lastChild.cloneNode(true);
            clonedTyre.childNodes[0].name = 'tyre' + (parseInt(clonedTyre.childNodes[0].name.match(/\d+/)[0]) + 1);
            clonedTyre.addEventListener('click',openTyreDialog);
            tyreRow.appendChild(clonedTyre);
            //clone last lap

            var lapsRow = strategyTable.childNodes[3];
            var clonedLap = lapsRow.lastChild.cloneNode(true);
            //console.log(clonedLap);
            observer.observe(clonedLap.childNodes[0], { characterData: false, attributes: false, childList: true, subtree: false });

            clonedLap.childNodes[1].name = 'fuel' + (parseInt(clonedLap.childNodes[1].name.match(/\d+/)[0]) + 1);
            clonedLap.childNodes[2].name = 'laps' + (parseInt(clonedLap.childNodes[2].name.match(/\d+/)[0]) + 1);
            lapsRow.appendChild(clonedLap);
            //clone last push
            var pushRow = strategyTable.childNodes[5];
            var clonedPush = pushRow.lastChild.cloneNode(true);
            clonedPush.addEventListener('change',updateFuel);//-------------------------------------------------------------
            pushRow.appendChild(clonedPush);
            //clone last wear
            var wearRow = strategyTable.childNodes[6];
            var clonedWear = wearRow.lastChild.cloneNode(true);
            wearRow.appendChild(clonedWear);
            updateFuel(clonedLap.closest('tbody'));

            success = true;
          }
        }else if(pits == 4)
        {
          plusDiv.setAttribute('style','background-color: firebrick;opacity: 100!important;');
        //plusDiv.nextElementSibling.lastChild.textContent = 0;
        }

        if (success) {
          resolve(true);
        } else {
        //reject(false);
        }

      });

    }
    function hasExtraStint(pitNumber){
      var extraStints = 0;
      if(pitNumber < 4)
        extraStints = -1;
      else if(pitNumber == 4)
        extraStints = 0;
      else if(pitNumber > 4)
        extraStints = 1;
      return extraStints;
    }
    function openTyreDialog(){
      var tyre = this.className;
      var stintId = this.lastChild.name.match(/\d+/)[0];
      var fuelL = this.parentElement.parentElement.childNodes[3].childNodes[stintId].childNodes[1].value;
      var laps = this.parentElement.parentElement.childNodes[3].childNodes[stintId].textContent;
      this.parentElement.cells[5].click(); //last valid stint
      var tyreD = document.getElementById('tyreSelect').childNodes[0].childNodes[0];
      document.getElementsByName('stintId')[0].value = stintId;
      var dialog = document.getElementById('stintDialog');
      dialog.childNodes[0].childNodes[0].textContent = 'Pit ' + (stintId - 1); // name of dialog stint

      if(document.getElementById('fuelLapsPrediction').parentElement.parentElement.className == ' hide')
        document.getElementById('tyreSelect').childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[1].textContent = laps;
      else
        document.getElementById('tyreSelect').childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[1].textContent = fuelL;


      var event = new MouseEvent('mousedown', {
        'view': window,
        'bubbles': true,
        'cancelable': true,

      });
      var event2 = new MouseEvent('mouseup', {
        'view': window,
        'bubbles': true,
        'cancelable': true,

      });
      //simulate changing fuel to update values
      dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[0].dispatchEvent(event);
      dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[0].dispatchEvent(event2);
      dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[2].dispatchEvent(event);
      dialog.childNodes[2].childNodes[4].childNodes[0].childNodes[3].childNodes[0].childNodes[1].childNodes[2].dispatchEvent(event2);

      for(var i = 0 ; i < 6 ; i++)
      {
        if(tyreD.childNodes[i].id != tyre)
        {
          tyreD.childNodes[i].className = 'inactive';
        }else
          tyreD.childNodes[i].className = '';
      }



    }
    function addMoreStints()
    {
      function addExtraStintButton(pitDiv)
      {
        if(pitDiv.getAttribute('x') == null){
          pitDiv.setAttribute('x','enabled');
          var  addStint = document.createElement('div');
          addStint.textContent = '+';
          var stintCounter = document.createElement('div');
          stintCounter.textContent = -1;
          addStint.append(stintCounter);
          //addStint.id="extra "+id;
          addStint.setAttribute('style','left: 140px;position: relative; visibility:hidden');


          carPits = pitDiv;

          var stops = parseInt(carPits.textContent.match(/\d+/)[0]);
          if(stops > 3)
          {
            stintCounter.textContent = 0;
            carPits.childNodes[0].childNodes[2].setAttribute('style','background-color: firebrick;opacity: 100!important;');
          }


          carPits.childNodes[0].childNodes[2].addEventListener('touchstart',injectExtraStints);
          carPits.childNodes[0].childNodes[2].addEventListener('click',injectExtraStints);

          carPits.childNodes[0].childNodes[0].addEventListener('click',removeStints);
          carPits.childNodes[0].childNodes[0].addEventListener('touchstart',removeStints);
          carPits.childNodes[0].append(addStint);
        }


      }


      var strategies = document.getElementsByClassName('fuel');

      Object.keys(strategies).forEach(car=>{
        addExtraStintButton(strategies[car].closest('form').querySelector('.igpNum').parentElement);
      });

    }
    async function saveStint()
    {

      const code = TRACK_CODE;
      const driverStrategy = this.closest('form');
      const tyre = driverStrategy.getElementsByClassName('tyre')[0];
      const fuel = driverStrategy.getElementsByClassName('fuel')[0];
      const push = driverStrategy.querySelector('tr[pushEvent]');
      const tyreStrategy = tyre.querySelectorAll('td[style*="visibility: visible"]');
      const fuelStrategy = fuel.querySelectorAll('td[style*="visibility: visible"]');
      const pushStrategy = push.querySelectorAll('td[style*="visibility: visible"]');

      const saveData = {};
      for(var i = 0; i < tyreStrategy.length; i++)
      {
        saveData[i] = {
          tyre:tyreStrategy[i].className,
          laps:fuelStrategy[i].textContent,
          push:pushStrategy[i].childNodes[0].selectedIndex};
      }
      const s = hashCode(JSON.stringify(saveData));
      const data = await chrome.storage.local.get('save');

      if(typeof data.save === 'undefined')
      {
        chrome.storage.local.set({'save':{[code]:{[s]:saveData}}});
      }
      else
      {
        if(typeof data.save[code] === 'undefined')
        {
          data.save[code] = {[s]:saveData};
        }
        else
          data.save[code][s] = saveData;

        chrome.storage.local.set({'save':data.save});
      }
      document.querySelectorAll('.lbutton').forEach((element) => {
        element.classList.remove('disabled');
      });
      //const list = document.getElementById('myDropdown2');
      //list.classList.remove('show1');

      const isSyncEnabled = await chrome.storage.local.get({'gdrive':false});
      if(isSyncEnabled.gdrive){
        const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
        const token = await getAccessToken();
        if(token != false)
          await chrome.runtime.sendMessage({type: 'saveStrategy',data:{name:s,track:code,strategy:saveData},token:token.access_token});

      }

    }

    async function loadStint()
    {
    //document.getElementById('myDropdown2').classList.toggle('show1');
    //this.closest("div").classList.toggle("show1");
      const code  = TRACK_CODE;
      const data = await chrome.storage.local.get('save');
      const s = data.save[code][this.parentElement.id];
      const driverStrategy = this.closest('form');
      const pitNum = driverStrategy.querySelectorAll('input[name=\'numPits\']')[0];
      const tyre = driverStrategy.getElementsByClassName('tyre')[0];
      const fuel = driverStrategy.getElementsByClassName('fuel')[0];
      const push = driverStrategy.querySelector('tr[pushEvent]');
      const pits = driverStrategy.querySelector('div > div.num.green');
      const enabledStints = tyre.querySelectorAll('td[style*="visibility: visible"]').length;
      const wear = driverStrategy.querySelector('tr[wearEvent]');

      const tyreStrategy = tyre.querySelectorAll('td');
      const fuelStrategy = fuel.querySelectorAll('td');
      const pushStrategy = push.querySelectorAll('td');
      const activeStints = tyre.childElementCount - 1;

      const stints = Object.keys(s).length;
      let pitText = stints - 1;


      pitNum.value = pitText;

      if((pitText) > 4)
        pitText = 4;
      pits.childNodes[0].textContent = pitText;

      if(activeStints > 5)
      {
        for (let i = 0; i < (enabledStints - stints); i++) {
          removeStints(pits.previousElementSibling);
        }
      }

      const extraStintstoAdd = (activeStints - stints);


      if(activeStints < stints)
      {
        var event = new MouseEvent('mousedown', {
          'view': window,
          'bubbles': true,
          'cancelable': true,

        });
        var event2 = new MouseEvent('mouseup', {
          'view': window,
          'bubbles': true,
          'cancelable': true,

        });



        for (let i = 0; i < (5 - enabledStints); i++) {
          pits.nextElementSibling.dispatchEvent(event);
          pits.nextElementSibling.dispatchEvent(event2);
          pits.nextElementSibling.setAttribute('style','background-color: firebrick;opacity: 100!important;');
        }

        for (let i = 0; i < (stints - 5); i++) {
          done = await injectExtraStints(pits.nextElementSibling);
        }
      }

      // const wear = driverStrategy.querySelectorAll('tr[id*=tyre] >td');

      /* tyre = driverStrategy.getElementsByClassName('tyre')[0];
    fuel = driverStrategy.getElementsByClassName('fuel')[0];
    push = driverStrategy.querySelector('tr[pushEvent]');*/



      for(var i = stints ; i < 5; i++)
      {
        tyreStrategy[i].style.visibility = 'hidden';
        fuelStrategy[i].style.visibility = 'hidden';
        pushStrategy[i].style.visibility = 'hidden';
        wear.cells[i + 1].style.visibility = 'hidden';
      }

      var fuelLap = fuel_calc(parseInt(document.getElementsByClassName('PLFE')[0].value)) * TRACK_INFO.length;
      console.log('fe is',document.getElementsByClassName('PLFE')[0].value);
      for(var i = 0; i < stints; i++)
      {
        try {

          tyreStrategy[i].className = s[i].tyre;
          tyreStrategy[i].childNodes[0].value = s[i].tyre.substring(3);
          tyreStrategy[i].setAttribute('data-tyre',s[i].tyre.substring(3));
          tyreStrategy[i].style.visibility = 'visible';

          fuelStrategy[i].childNodes[0].textContent = s[i].laps;
          fuelStrategy[i].style.visibility = 'visible';
          fuelStrategy[i].childNodes[1].value = Math.ceil((s[i].laps * fuelLap));
          fuelStrategy[i].childNodes[2].value = s[i].laps;

          pushStrategy[i].childNodes[0].selectedIndex = s[i].push;
          pushStrategy[i].style.visibility = 'visible';

          wear.cells[i + 1].style.visibility = 'visible';
          // console.log(tyreStrategy[i]);
          update_stint(fuelStrategy[i]);
        } catch (error) {

        }

      }

      if((stints - 1) < 4)
      {
        pits.nextElementSibling.setAttribute('style','background-color: #6c7880;opacity: 100!important;');
        pits.nextElementSibling.className = 'plus';
      }
      if((stints - 1) == 1)
      {
        pits.previousElementSibling.className = 'minus disabled';
      }
      if((stints - 1) == 4)
      {
        pits.nextElementSibling.setAttribute('style','background-color: firebrick;opacity: 100!important;');
        pits.nextElementSibling.className = 'plus disabled';
        pits.previousElementSibling.className = 'minus';
      }

      updateFuel(wear.closest('tbody'));
      dragStint();
      const saveBox = driverStrategy.getElementsByClassName('dropdown2-content');
      Object.keys(saveBox).forEach(key=>{
        saveBox[key].close();
      });
    }
    function dialogClickHandler(e) {
      if (e.target.tagName !== 'DIALOG')
        return;

      const rect = e.target.getBoundingClientRect();

      const clickedInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );

      if (clickedInDialog === false)
        e.target.close();
    }
    async function addSaveButton()
    {

      if(document.getElementById('save&load') == null)
      {
        async function generateSaveList () {
          return new Promise(function(res){
            const code = TRACK_CODE;
            chrome.storage.local.get('save',function(data){
              if (typeof data.save === 'undefined') {
                res('empty');
              }else{
                if (typeof data.save[code] === 'undefined') {
                  res('empty');
                } else {
                  if (Object.keys(data.save[code]).length == 0) {
                    console.log('no save');
                    document.querySelectorAll('.lbutton').forEach((element) => {
                      element.classList.add('disabled');
                    });
                    res('empty');
                  } else {
                    const sList = document.querySelectorAll('#saveList');
                    if (sList != null)
                      sList.forEach((e) => {e.remove();});


                    document.querySelectorAll('.lbutton').forEach((element) => {
                      element.classList.remove('disabled');
                    });

                    const list = document.querySelectorAll('#myDropdown2');
                    list.forEach((e) => {
                      const sList = createSaveDataPreview(data.save[code]);
                      e.appendChild(sList);});
                  }
                  res (true);
                }
              }
            });


          });



        }
        function createSaveLoad()
        {
          const containerDiv = document.createElement('div');
          containerDiv.id = 'save&load';
          containerDiv.classList.add('saveContainer');
          const saveDiv = document.createElement('div');
          const loadDiv = document.createElement('div');
          const loadContainer = document.createElement('dialog');
          loadContainer.className = 'dropdown2-content not-selectable';
          loadContainer.id = 'myDropdown2';
          loadContainer.addEventListener('click',dialogClickHandler);
          saveDiv.className = 'sbutton';
          loadDiv.className = 'sbutton lbutton';
          saveDiv.textContent = 'Save';
          loadDiv.textContent = 'Load';
          containerDiv.append(loadContainer);
          saveDiv.addEventListener('click',saveStint);
          loadDiv.addEventListener('click',async function(){
            const saves =  await generateSaveList();
            if(saves != 'empty'){
              const dialog = this.parentElement.querySelector('[id=myDropdown2]');
              dialog.showModal();
            }

          });
          containerDiv.appendChild(saveDiv);
          containerDiv.appendChild(loadDiv);
          generateSaveList();



          return containerDiv;
        }

        driverNumber = document.getElementsByClassName('fuel').length;
        if(driverNumber == 2)
        {
          strategy = document.getElementById('d2strategy');
          placeHere = strategy.querySelectorAll('th')[0];
          placeHere.appendChild(createSaveLoad());
        }
        strategy = document.getElementById('d1strategy');
        placeHere = strategy.querySelectorAll('th')[0];
        placeHere.appendChild(createSaveLoad());
      }

      const code = TRACK_CODE;
      data = await chrome.storage.local.get('save');

      lb = document.querySelectorAll('.lbutton');

      if(typeof data.save === 'undefined')
      {
        lb.forEach((ele) => {
          ele.classList.add('disabled');
        });

      }
      else
      {
        if(typeof data.save[code] === 'undefined')
        {
          lb.forEach((ele) => {
            ele.classList.add('disabled');
          });
        }

      }

    }
    function createSaveDataPreview(s)
    {
      function createStint(a,k)
      {
        const strategyContainer = document.createElement('tr');
        strategyContainer.setAttribute('style','background-color: #dfdfdf;');
        strategyContainer.id = k;
        //const deleteB = document.createElement('th');
        const deleteB = document.createElement('td');
        deleteB.innerHTML = `<svg style="color:white!important";
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z"
        fill="currentColor"
      />
      <path d="M9 9H11V17H9V9Z" fill="currentColor" />
      <path d="M13 9H15V17H13V9Z" fill="currentColor" />
    </svg>`;
        //s deleteB.textContent = 'del';

        //deleteB.setAttribute('style','background-color: #d66e67; font-size: 1.25rem;font-family: roboto ; color:white');
        deleteB.classList.add('trash');
        deleteB.addEventListener('click',deleteSave);
        strategyContainer.appendChild(deleteB);
        //download = docum ---------------------------------------------


        for (const key in a) {
          if(!isNaN(key))
          {
            const strategy = document.createElement('td');
            const strategyL = document.createElement('td');
            strategyL.addEventListener('click',loadStint);
            strategy.addEventListener('click',loadStint);
            strategy.classList.add('loadStint','preview-tyre',a[key].tyre);
            //strategy.setAttribute('style','height:32px; width:32px;margin:1px; background-color: #dfdfdf;');
            strategyL.classList.add('loadStint','preview-laps');
            strategyL.textContent = a[key].laps;

            strategyContainer.appendChild(strategyL);
            strategyContainer.appendChild(strategy);
          }
        }
        //console.log(strategyContainer);
        return strategyContainer;
      }
      const saveList = document.createElement('tbody');
      saveList.id = 'saveList';

      for (const key in s) {
        saveList.appendChild(createStint(s[key],key));
      }

      saveList.setAttribute('style','height:max-content ;width: max-content;border-collapse: collapse;');
      return saveList;

    }
    async function deleteSave()
    {

      const saveToDelete = this.parentElement.id;
      const code = TRACK_CODE;
      data = await chrome.storage.local.get('save');
      delete data.save[code][saveToDelete];
      chrome.storage.local.set({'save':data.save});
      document.querySelectorAll(`[id="${saveToDelete}"]`).forEach((save) => {
        save.remove();
      });


      const dialog =  document.getElementById('myDropdown2');
      if(document.getElementById('saveList').childElementCount == 0)
      {
        dialog.close();
        document.querySelectorAll('.lbutton').forEach((element) => {
          element.className += ' disabled';
        });
      }
      const isSyncEnabled = await chrome.storage.local.get({'gdrive':false});
      if(isSyncEnabled.gdrive){

        const { getAccessToken } = await import(chrome.runtime.getURL('/auth/googleAuth.js'));
        const token = await getAccessToken();
        if(token != false){
          chrome.runtime.sendMessage({
            type:'deleteFile',
            data:{type:'strategies',track:code,name:saveToDelete},
            token:token.access_token});
        }

      //deleteFile(saveToDelete+'.json',token.access_token);
      }

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

