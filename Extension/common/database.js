// indexDB.js

const DB_NAME = 'iGPlusDB';
const STORE_NAMES = ['race_result', 'reports'];

// Open the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => {
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
}

// Add/update data to the specified object store
function addData(storeName, data) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.put(data);

        request.onsuccess = (event) => {
          resolve(event.target.result);
        };

        request.onerror = (event) => {
          reject('Error adding data');
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Get all data from the specified object store
function getAllData(storeName) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
          resolve(event.target.result);
        };

        request.onerror = (event) => {
          reject('Error getting data');
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Clear all data from the specified object store
function clearData(storeName) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.clear();

        request.onsuccess = (event) => {
          resolve();
        };

        request.onerror = (event) => {
          reject('Error clearing data');
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// Get an element by its ID
function getElementById(id,storeName) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(id);

        request.onsuccess = (event) => {
          const element = event.target.result;
          resolve(element);
        };

        request.onerror = (event) => {
          reject('Error getting element');
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// delete an element by its ID
function deleteElementById(id,storeName) {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const deleteRequest  = objectStore.delete(id);

        deleteRequest.onsuccess = (event) => {
            console.log('Entry deleted successfully.');
          resolve(true);
        };

        deleteRequest.onerror = (event) => {
          reject('Error deleting  element');
        };
      })
      .catch((error) => {
        reject(error);
      });
  });
}



export { addData, getAllData, clearData, getElementById,deleteElementById };
