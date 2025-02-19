async function addTalent(){
    const [{ fetchDriverInfo }, { parseAttributes } ] = await Promise.all([
        import(chrome.runtime.getURL('common/fetcher.js')),
        import(chrome.runtime.getURL('scripts/driver/driverHelpers.js'))
      ]);
    
    const table = document.getElementById('drivers').childNodes[0];
    if(document.getElementById('sl_talent') == null){
      const thead = table.tHead.rows[0];
      const talent = document.createElement('th');
      talent.addEventListener('click',sortTable);
      talent.innerHTML = '<svg style=\'width:24px\' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M16 0H144c5.3 0 10.3 2.7 13.3 7.1l81.1 121.6c-49.5 4.1-94 25.6-127.6 58.3L2.7 24.9C-.6 20-.9 13.7 1.9 8.5S10.1 0 16 0zM509.3 24.9L401.2 187.1c-33.5-32.7-78.1-54.2-127.6-58.3L354.7 7.1c3-4.5 8-7.1 13.3-7.1H496c5.9 0 11.3 3.2 14.1 8.5s2.5 11.5-.8 16.4zM432 336c0 97.2-78.8 176-176 176s-176-78.8-176-176s78.8-176 176-176s176 78.8 176 176zM264.4 241.1c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z"/></svg>';
      talent.className = 'sortBy hover pointer';
      talent.setAttribute('style','width:7%');
      thead.insertBefore(talent, thead.childNodes[2]);
      talent.id = 'sl_talent';
    }

      const driver_links = table.querySelectorAll('a')
      
      driver_links.forEach(async link => {
        const tEle = document.createElement('td');
        tEle.id = 'talentRow';  
        const id = new URLSearchParams(link.href).get('id');
        //save id 
        let result_info = await chrome.runtime.sendMessage({
            type:'getDataFromDB',
            data:{id:id,store:'shortlist_driver'}
          });
        if(result_info == false){
            const result = await fetchDriverInfo(id);
            result_info = parseAttributes(result);
            
            chrome.runtime.sendMessage({
                type:'addShortlistDriverToDB',
                data:{id:id,...result_info}
              });
        }
        const talent_col = link.closest("tr").insertCell(2);
        talent_col.textContent = result_info.sTalent;

      });
  }

  function sortTable() {
    n = this.cellIndex;
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById('drivers').childNodes[0].tBodies[0];
    switching = true;
    dir = 'desc';
    while (switching) {
      switching = false;
      rows = table.rows;
      for (i = 0; i < (rows.length - 1); i++) {
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
        if (switchcount == 0 && dir == 'desc') {
          dir = 'asc';
          switching = true;
        }
      }
    }
  }

  (async () => {
    try {
      await new Promise((res) => setTimeout(res, 100)); // sleep a bit, while page loads
      if (document.getElementById('sl_talent') == null) {
        addTalent();
      }
    } catch (err) {
      console.log('page not loaded');
    }
  })();
  
