function import_to_sheet(id,access_token,values,id_list,sheetId){
    const spreadsheetId = id;
    const accessToken = access_token; // Replace with your access token.
    console.log(id_list)
    // The range where you want to append the data (e.g., Sheet1!A1).
    const range = 'imported_data!A31';
    

const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: values,
    }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('Append response:', data);
    })
    .catch(error => {
      console.error('Error appending data:', error);
    });

    const batchUpdateRequest = {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: sheetId, // The sheet ID, usually 0 for the first sheet
                startRowIndex: 0,
                startColumnIndex: 0,
                endRowIndex: 30, // Adjust based on your range
                endColumnIndex: 1, // Assuming one column range
              },
              rows: id_list.map((id, index) => {
                return {
                  values: id.map(value => ({
                    userEnteredValue: {
                      stringValue: value,
                    },
                  })),
                };
              }),
              fields: 'userEnteredValue',
            },
          },
        ],
      };

    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchUpdateRequest),
      })
        .then(response => response.json())
        .then(data => {
            console.log('Data updated successfully:', data);
        })
        .catch(error => {
          console.error('Error appending data:', error);
        });   
}

function access_gSheet(id,access_token,values){
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
            console.log(response)
            return response.json();
          }else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        })
        .then(spreadsheetData => {
            // Check if the specified sheet exists in the spreadsheet.
            const sheet = spreadsheetData.sheets.find(sheet => sheet.properties.title === RANGE.split('!')[0]);
            console.log(sheet)
            if (sheet) {
                // Extract the sheetId
                sheetId = sheet.properties.sheetId;
                console.log(`Sheet ID for ": ${sheetId}`);
              // If the sheet exists, proceed to fetch its values.
              return fetch(API_ENDPOINT, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                },
              });
            } else {

              console.log('Sheet does not exist. You might want to create a new sheet.');

              addSheet(id,access_token);

            }
          }).then(response => {
            console.log("testing")
            if (response.status === 200) {
              return response.json();
            }
          })
          .then(data => {
            // Process the data if the sheet exists.
            console.log(data ? data.values : 'Sheet found or created.');
            const id_list = data.values ?? [];
            const race_id = values[0][0];
            if(id_list.length > 0)
            var isValuePresent = data.values.some(function(subArray) {return subArray.includes(race_id);});
            
            if(!isValuePresent){
                id_list.push([race_id]);
                 import_to_sheet(id,access_token,values,id_list,sheetId)
            }else{
                console.log("already in sheets")
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

  function addSheet(id,access_token){
    const API_SPREADSHEET_ENDPOINT  = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;
    fetch(API_SPREADSHEET_ENDPOINT, {
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
  });
  }
  