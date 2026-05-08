const ext = globalThis.browser || globalThis.chrome;

/**
 * Universal Fetch Helper for Dropbox (Includes Text Support)
 */
async function fetchDropboxAPI(url, options, asText = false) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    console.warn("iGPlus | Token expired, attempting background refresh...");
    const oldToken = options.headers['Authorization'].replace('Bearer ', '');

    try {
      const refreshResponse = await ext.runtime.sendMessage({ 
        action: 'refreshToken', 
        oldToken: oldToken 
      });

      if (refreshResponse && refreshResponse.token) {
        const newToken = refreshResponse.token.access_token;
        options.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, options);
        console.log("iGPlus | Refresh successful, request retried.");
      } else {
        throw new Error("Silent refresh failed");
      }
    } catch (err) {
      console.error("iGPlus | Could not refresh token:", err);
      throw new Error("Unauthorized: Please re-connect Dropbox.");
    }
  }

  if (!response.ok) {
    // 409 usually means the file doesn't exist yet, which is fine for new files
    if (response.status === 409) return asText ? "" : null; 
    const errorText = await response.text();
    throw new Error(`Dropbox API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return asText ? "" : null;
  return asText ? await response.text() : await response.json();
}

/**
 * Helper to encode an array into a valid CSV row
 */
function encodeCSVRow(row) {
  return row.map(v => {
    let str = (v === null || v === undefined) ? '' : String(v);
    // Escape quotes and wrap in quotes if there's a comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }).join(',');
}

/**
 * Helper to parse a basic CSV row securely
 */
function parseCSVRow(str) {
  const result =[];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"') {
      if (inQuotes && str[i + 1] === '"') {
        current += '"';
        i++; // skip the escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Reconstructs and uploads the CSV
 */
async function import_to_csv(fileId, accessToken, values, id_list, dataLines) {
  try {
    // 1. Rebuild the index (pad exactly to 150 rows with empty lines)
    const newIndexLines = id_list.map(row => encodeCSVRow(row));
    while (newIndexLines.length < 150) {
      newIndexLines.push("");
    }

    // 2. Format the new data rows being appended
    const newValuesLines = values.map(row => encodeCSVRow(row));

    // 3. Combine everything: 150 index lines, existing data lines, and new lines
    const validDataLines = dataLines.filter(l => l.trim() !== '');
    const finalCSV =[...newIndexLines, ...validDataLines, ...newValuesLines].join('\n');

    // 4. Upload to Dropbox (overwrites previous version)
    await fetchDropboxAPI('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: fileId, // fileId acts as the path in Dropbox API
          mode: 'overwrite',
          autorename: false,
          mute: true
        })
      },
      body: finalCSV
    });

    alert('Race exported successfully!');
    return true;
  } catch (error) {
    console.error('Error in import_to_csv:', error);
    throw error;
  }
}

/**
 * Main entry point: Downloads text, checks duplicates, triggers rewrite
 */
async function access_csv(id, access_token, values, race_info) {
  try {
    // 1. Download existing file text
    const rawText = await fetchDropboxAPI('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Dropbox-API-Arg': JSON.stringify({ path: id })
      }
    }, true); // Ask the helper to return raw text

    const lines = rawText ? rawText.split(/\r?\n/) :[];

    // 2. Split file into index (first 150 rows) and pure data rows
    const rawIndexLines = lines.slice(0, 150);
    const dataLines = lines.slice(150);


    // 3. Parse the index (ignoring empty padded rows)
    let id_list =[];
    for (const line of rawIndexLines) {
      if (line.trim() !== '') {
        id_list.push(parseCSVRow(line));
      }
    }

    // 4. Check for duplicates
    const race_id = String(values[0][0]);
    const isValuePresent = id_list.some(row => String(row[0]) === race_id);

    if (!isValuePresent && id_list.length < 150) {
      // Clean data before pushing to the index
      id_list.push([
        race_id, 
        String(race_info.track_code || ''), 
        String(race_info.race_date || ''), 
        String(race_info.rules || '')
      ]);
      
      await import_to_csv(id, access_token, values, id_list, dataLines);
      return true;
    } else {
      alert(isValuePresent ? "Race report already stored." : "CSV index limit (150) reached.");
      return false;
    }
  } catch (error) {
    console.error('Error in access_csv:', error);
    throw error;
  }
}

async function create_new_csv(fileName, accessToken) {
  // Ensure the filename ends with .csv
  if (!fileName.toLowerCase().endsWith('.csv')) {
    fileName += '.csv';
  }

  // Uploading an empty file to initialize it in Dropbox.
  // The response will return the file metadata (including its ID and name).
  const response = await fetchDropboxAPI('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: `/${fileName}`, // Assuming root folder, change if using specific subfolders
        mode: 'add',
        autorename: true,
        mute: false
      })
    },
    body: '' // Empty string body creates an empty file
  });

  return response; 
}
async function delete_csv(filePath, accessToken) {
  const response = await fetchDropboxAPI('https://api.dropboxapi.com/2/files/delete_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath })
  });
  return response;
}


export { 
     import_to_csv as import_to_sheet,
     access_csv as access_gSheet,
     create_new_csv,
     delete_csv 
     };