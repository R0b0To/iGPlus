function import_to_sheet(id,access_token,values,id_list,sheetId){
    const spreadsheetId = id;
    const accessToken = access_token; 
    const range = 'imported_data!A31';
    

const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
fetch(apiUrl, {
    method: 'POST',
    headers: {'Authorization': `Bearer ${accessToken}`,'Content-Type': 'application/json',},
    body: JSON.stringify({values: values,}),})
    .then(response => response.json())
    .then(data => {
    })
    .catch(error => {
      console.error('Error appending data:', error);
    });
    
    const batchUpdateRequest = {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: sheetId, 
                startRowIndex: 0,
                startColumnIndex: 0,
                endRowIndex: 30, 
                endColumnIndex: 3, 
              },
              rows: id_list.map((id, index) => {
                return {  
                  values: [
                    {userEnteredValue: {numberValue: id[0]}},//race id
                    {userEnteredValue: {stringValue: id[1]}},//race track 
                    {userEnteredValue: {stringValue: id[2]}} //race timestamp
                  ]                
                };

              }),
              fields: 'userEnteredValue',
            },
          },
        ],
      };
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${accessToken}`,'Content-Type': 'application/json',},
        body: JSON.stringify(batchUpdateRequest),
      })
        .then(response => response.json())
        .then(data => {
            console.log('Data updated successfully:');
        })
        .catch(error => {
          console.error('Error appending data:', error);
        });   
}

function access_gSheet(id,access_token,values,race_info){
    const RANGE = 'imported_data!A1:D30';
    const API_ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${RANGE}`;
    const API_SPREADSHEET_ENDPOINT  = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
    let sheetId = 0;
    // Fetch the data from the Google Sheets API with the access token in the headers.
    fetch(API_SPREADSHEET_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })
      .then(response => {
        if (response.status === 200) {          
            return response.json();
          }else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        })
        .then(async spreadsheetData => {
            // Check if the specified sheet exists in the spreadsheet.
            const sheet = spreadsheetData.sheets.find(sheet => sheet.properties.title === RANGE.split('!')[0]);
            if (sheet) {
                // Extract the sheetId
                sheetId = sheet.properties.sheetId;
              // If the sheet exists, proceed to fetch its values.
              return fetch(API_ENDPOINT, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                },
              });
            } else {

              //console.log('Sheet does not exist. You might want to create a new sheet.');

              sheetId = await addSheet(id,access_token);
              //add new sheet then call funcion again
              if(sheetId == -1)
              return -1
              access_gSheet(id,access_token,values,race_info)
              return 1
              
            }
          }).then(response => {
            if (response?.status === 200) {
              return response.json();
            }else
            return 1
          })
          .then(data => {
            // Process the data if the sheet exists.
            if(data == 1)
            return

            const id_list = data.values ?? [];
            const race_id = values[0][0];
            let isValuePresent = false;
            if(id_list.length > 0){
               isValuePresent = data.values.some(function(subArray) {return subArray.includes(race_id);});
            }
              
            //import the race if it's not present in the sheet and there are less than 31 races saved
            if(!isValuePresent && id_list.length < 31){
                id_list.push([race_id,race_info.track_code,race_info.race_date]);
                 import_to_sheet(id,access_token,values,id_list,sheetId)
            }else{
                console.log("Race report already stored")
            }
            
          })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
}


export{
    import_to_sheet,
    access_gSheet
  };

  async function addSheet(id,access_token){
    //to do return id of the created sheet
    const API_SPREADSHEET_ENDPOINT  = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;
    return fetch(API_SPREADSHEET_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: 
      {
          addSheet: 
          {
            properties: 
            {
              title: "imported_data",
            },
          },
      },
    }),
  }).then(response => {
    if (response.status === 200) {
      return response.json();
    }
    if (response.status === 403) {
      alert('You do not have edit permissions for the selected sheet')
      return -1
    }
  }).then(data => {
    if (data == -1){
      return -1
    }else
    return data.replies[0].addSheet.properties.sheetId
  })
.catch(error => {
console.error('Error fetching data:', error);
});
  }
  