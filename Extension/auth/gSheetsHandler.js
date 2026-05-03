function import_to_sheet(id,access_token,values,id_list,sheetId){
    const spreadsheetId = id;
    const accessToken = access_token; 
    const range = 'imported_data!A151';
    

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
                endRowIndex: 150, 
                endColumnIndex: 4, 
              },
              rows: id_list.map((id, index) => {
                return {  
                  values: [
                    {userEnteredValue: {numberValue: id[0]}},//race id
                    {userEnteredValue: {stringValue: id[1]}},//race track 
                    {userEnteredValue: {stringValue: id[2]}}, //race timestamp
                    {userEnteredValue: {stringValue: id[3]}} //race rules
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
            alert('Race exported successfully:');
        })
        .catch(error => {
          console.error('Error appending data:', error);
        });   
}

async function access_gSheet(id, access_token, values, race_info) {
  const RANGE_NAME = 'imported_data';
  const RANGE = `${RANGE_NAME}!A1:D150`;
  const API_ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${RANGE}`;
  const API_SPREADSHEET_ENDPOINT = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;

  try {
    // 1. Get Spreadsheet Metadata
    const response = await fetch(API_SPREADSHEET_ENDPOINT, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!response.ok) throw new Error(`Failed to fetch spreadsheet info: ${response.status}`);
    const spreadsheetData = await response.json();

    // 2. Check if the sheet exists
    let sheet = spreadsheetData.sheets.find(s => s.properties.title === RANGE_NAME);
    let sheetId;

    if (!sheet) {
      // Sheet doesn't exist, create it and wait for it to finish
      sheetId = await addSheet(id, access_token);
      if (sheetId === -1) throw new Error("Failed to create new sheet.");
    } else {
      sheetId = sheet.properties.sheetId;
    }

    // 3. Fetch existing values to check for duplicates
    const dataResponse = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    // If the sheet was JUST created, it might return 404/400 or just empty
    let id_list = [];
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      id_list = data.values ?? [];
    }

    // 4. Check for duplicates
    const race_id = values[0][0];
    const isValuePresent = id_list.some(row => row.includes(race_id));

    if (!isValuePresent && id_list.length < 151) {
      id_list.push([race_id, race_info.track_code, race_info.race_date, race_info.rules]);
      
      // 5. IMPORTANT: Await the final import call
      // Ensure import_to_sheet is also an async function or returns a promise!
      await import_to_sheet(id, access_token, values, id_list, sheetId);
      return true; 
    } else {
      const msg = isValuePresent ? "Race report already stored." : "Sheet limit (150) reached.";
      alert(msg);
      return false;
    }
  } catch (error) {
    console.error('Error in access_gSheet:', error);
    throw error; // Re-throw so the Dialog UI can catch it and stop the spinner
  }
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
  