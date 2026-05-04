/**
 * Cleanly appends data and updates the index list at the top of the sheet
 */
async function import_to_sheet(spreadsheetId, accessToken, values, id_list, sheetId) {
  const appendRange = 'imported_data!A151';
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${appendRange}:append?valueInputOption=USER_ENTERED`;

  try {
    // 1. Append the new data rows
    await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: values }),
    });

    // 2. Prepare the batch update for the index (rows 1-150)
    const batchUpdateRequest = {
      requests: [{
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            startColumnIndex: 0,
            endRowIndex: 150,
            endColumnIndex: 4,
          },
          rows: id_list.map((row) => {
            return {
              values: [
                { userEnteredValue: { numberValue: Number(row[0]) || 0 } }, // race id
                { userEnteredValue: { stringValue: String(row[1]) } },     // track
                { userEnteredValue: { stringValue: String(row[2]) } },     // timestamp
                { userEnteredValue: { stringValue: String(row[3]) } }      // rules
              ]
            };
          }),
          fields: 'userEnteredValue',
        },
      }],
    };

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchUpdateRequest),
    });

    if (!response.ok) throw new Error("Batch update failed");

    alert('Race exported successfully!');
    return true;
  } catch (error) {
    console.error('Error in import_to_sheet:', error);
    throw error;
  }
}

async function access_gSheet(id, access_token, values, race_info) {
  const RANGE_NAME = 'imported_data';
  const RANGE = `${RANGE_NAME}!A1:D150`;
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
      sheetId = await addSheet(id, access_token);
      if (sheetId === -1) return false;
    } else {
      sheetId = sheet.properties.sheetId;
    }

    // 3. Fetch existing values
    const dataResponse = await fetch(`${API_SPREADSHEET_ENDPOINT}/values/${RANGE}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    let id_list = [];
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      // FIX: Deep clone the data to bypass Firefox XrayWrapper
      id_list = data.values ? JSON.parse(JSON.stringify(data.values)) : [];
    }

    // 4. Check for duplicates
    const race_id = String(values[0][0]);
    const isValuePresent = id_list.some(row => String(row[0]) === race_id);

    if (!isValuePresent && id_list.length < 150) {
      // Clean data before pushing
      id_list.push([
        race_id, 
        String(race_info.track_code), 
        String(race_info.race_date), 
        String(race_info.rules)
      ]);
      
      await import_to_sheet(id, access_token, values, id_list, sheetId);
      return true;
    } else {
      alert(isValuePresent ? "Race report already stored." : "Sheet limit (150) reached.");
      return false;
    }
  } catch (error) {
    console.error('Error in access_gSheet:', error);
    throw error;
  }
}

async function addSheet(id, access_token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          addSheet: { properties: { title: "imported_data" } }
        }]
      }),
    });

    if (response.status === 403) {
      alert('You do not have edit permissions for the selected sheet');
      return -1;
    }

    const data = await response.json();
    return data.replies[0].addSheet.properties.sheetId;
  } catch (error) {
    console.error('Error adding sheet:', error);
    return -1;
  }
}

export { import_to_sheet, access_gSheet };