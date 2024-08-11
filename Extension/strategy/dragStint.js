function dragStintHandler(){
  if(document.getElementById('eventAdded') == null){
    const eventa = document.createElement('h1');
    eventa.id = 'eventAdded';
    eventa.style.display = 'none';
    document.getElementsByClassName('fuel')[0].parentElement.parentElement.append(eventa);
    const driver_pit_div = document.querySelectorAll('form[id$=strategy] .num');
    //observer will observe change in the number of pit stops then add/remove the drag feature to the stints
    const observer = new MutationObserver(async mutationsList => {if(mutationsList[0].target.classList.contains('num'))addEvent();});
    driver_pit_div.forEach(pit => { observer.observe(pit, {subtree: true, childList: true }); });
  }
  //adding the drag feature to the initial stints
  addEvent();
}

//add drag event to every visible stint for every driver
function addEvent(){
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

  visibleStints.forEach(th => {
    th.addEventListener('mousedown',dragMousedown,true);
    th.addEventListener('touchstart',dragMousedown,true);
    th.classList.add('dragMe');
  });

}
//css styling
function dropzoneEnter(e){
  const column = getColumnElements(e.target);
  column.forEach(c => c.classList.add('accept'));
}
function dropzoneLeave(e){
  const column = getColumnElements(e.target);
  column.forEach(c => c.classList.remove('accept'));
}


function elementDrag(e){
  const ele = document.getElementsByClassName('drag');
  Array.from(ele).forEach(stintPreview=>{
    stintPreview.style.top = e.pageY + 'px';
    stintPreview.style.left = e.pageX - 30 + 'px';
  });


}
function previewDrag(stintHeader,coord){
  const preview = document.getElementsByClassName('drag');
  for(const ele of preview) ele.remove();
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
  table.style.top = coord.y + 'px';
  table.style.left = coord.x + 'px';
  return table;
}
function dragMousedown(e){
  e.preventDefault();
  let info = null;
  if(e.target.closest('tbody').querySelector('.tyre').cells[e.target.cellIndex].style.visibility == 'visible'){
    const coord = {x:e.pageX - 30,y:e.pageY};
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

  function closeDragElement(e) {

    let isChild = false;
    const pointerOnTop = document.elementFromPoint(e.clientX, e.clientY);
    const strat = document.getElementsByClassName('strategy');

    for(const s of strat){
      if (childOf(pointerOnTop,s))
        isChild = true;
    }
    /* stop moving when mouse button is released:*/
    document.querySelectorAll('.dropzone,.dragging,.dropzonebottom','.dropzone.accept').forEach(otherStint => {
      otherStint.classList.remove('dragging', 'dropzone', 'dropzonebottom','accept');
      otherStint.removeEventListener('pointerenter',dropzoneEnter,true);
      otherStint.removeEventListener('pointerleave',dropzoneLeave,true);
      document.removeEventListener('pointerup',closeDragElement);
    });
    document.removeEventListener('pointermove',elementDrag,true);
    //try to set new info
    try {
      if(isChild){
        setStintInfo(getColumnElements(pointerOnTop),info.tyre,info.fuel,info.push,info.laps);
        //update_stint((pointerOnTop.closest('tbody').querySelector('.fuel').cells[pointerOnTop.cellIndex]) || (pointerOnTop.closest('tbody').querySelector('.fuel').cells[pointerOnTop.closest('td').cellIndex]));
      }

    } catch (error) {
      //console.log(error);
    }
    const preview = document.getElementsByClassName('drag');
    for(const ele of preview) ele.remove();

  }
}
function getColumnElements(elementOfColumn){
  const index = (elementOfColumn.cellIndex + 1) || (elementOfColumn.closest('td').cellIndex + 1) ;
  const column = elementOfColumn.closest('tbody').querySelectorAll(`th:nth-child(${index}),td:nth-child(${index}):not(.loadStint):not(.trash)`);
  return column;
}
function childOf(/*child node*/c, /*parent node*/p){ //returns boolean
  while((c = c.parentNode) && c !== p);
  return !!c;
}
function getStintInfo(stintColumn){
  const tyre = stintColumn[1].querySelector('input').value;
  const fuel = stintColumn[2].querySelector('input').value;
  const laps = stintColumn[2].querySelector('span').textContent;
  const push = stintColumn[4].querySelector('select').selectedIndex;

  return {tyre,fuel,push,laps};
}
function setStintInfo(stintColumn,tyre,fuel,push,laps){
  stintColumn[1].lastChild.textContent = tyre;
  stintColumn[1].querySelector('input').value = tyre;
  stintColumn[1].className = 'ts-' + tyre;
  stintColumn[1].setAttribute('data-tyre',tyre);
  stintColumn[2].querySelector('span').replaceChild(document.createTextNode(laps),stintColumn[2].querySelector('span').childNodes[0]);
  stintColumn[2].querySelectorAll('input')[0].value = fuel;
  stintColumn[2].querySelectorAll('input')[1].value = laps;
  stintColumn[4].querySelector('select').selectedIndex = push;
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

export{
  dragStintHandler
};