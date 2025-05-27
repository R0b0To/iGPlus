import { isElementChildOf } from '../../common/customUtils.js';

// TODO: Refine column selection logic in getStintInfo and setStintInfo for robustness.

/**
 * Initializes the drag-and-drop functionality for stints.
 * It sets up an observer to re-apply drag events if the number of pit stops changes.
 */
function initializeDragAndDropStints() {
  // Check if the drag-and-drop event listeners have already been initialized.
  // Uses a marker element with ID 'dragDropEventMarker' to track initialization.
  if (!document.getElementById('dragDropEventMarker')) {
    const eventMarkerElement = document.createElement('div'); // Changed from h1 to div for semantics
    eventMarkerElement.id = 'dragDropEventMarker';
    eventMarkerElement.style.display = 'none'; // Marker is not visible

    // Attempt to find a stable parent for the marker; strategy table's parent.
    const firstFuelElement = document.getElementsByClassName('fuel')[0];
    if (firstFuelElement && firstFuelElement.parentElement && firstFuelElement.parentElement.parentElement) {
      firstFuelElement.parentElement.parentElement.append(eventMarkerElement);
    } else {
      // console.warn("Could not find a suitable element to place the dragDropEventMarker.");
      // Fallback or alternative placement might be needed if this occurs.
      document.body.append(eventMarkerElement); // Fallback to body
    }
    
    // Select all pit number display elements for all drivers.
    const pitNumberDisplays = document.querySelectorAll('form[id$=strategy] .num');
    
    // Observer to re-initialize drag-and-drop when the number of pit stops changes.
    const pitChangeObserver = new MutationObserver(mutationsList => {
      // Check if the mutation target is a pit number display.
      if (mutationsList.some(mutation => mutation.target.classList.contains('num'))) {
        setupDragAndDropForStints();
      }
    });

    pitNumberDisplays.forEach(pitDisplay => {
      pitChangeObserver.observe(pitDisplay, { subtree: true, childList: true });
    });
  }
  // Initial setup of drag-and-drop for existing stints.
  setupDragAndDropForStints();
}

/**
 * Adds drag event listeners to all visible stint headers for every driver.
 * It first cleans up any existing listeners to prevent duplicates.
 */
function setupDragAndDropForStints() {
  const fuelDisplayElements = document.getElementsByClassName('fuel'); // Elements within each driver's strategy table.
  const driverStintHeaderRows = [];
  let allVisibleStintHeaders = [];

  // Collect the first row (assumed to be header row) of each driver's strategy table.
  for (const fuelElement of fuelDisplayElements) {
    const tableBody = fuelElement.closest('tbody');
    if (tableBody && tableBody.firstChild) {
      driverStintHeaderRows.push(tableBody.firstChild);
    }
  }

  // Iterate over each driver's stint header row.
  driverStintHeaderRows.forEach(stintHeaderRowNode => {
    // Clear existing drag setup from all stint headers (th elements, excluding the first "Stint" label cell).
    stintHeaderRowNode.querySelectorAll('th:not(:first-child)').forEach(stintHeaderCell => {
      stintHeaderCell.classList.remove('draggableStintHeader'); // Use a more descriptive class name.
      // Remove previously attached event listeners to prevent multiple executions.
      stintHeaderCell.removeEventListener('mousedown', handleDragMouseDown, true);
      stintHeaderCell.removeEventListener('touchstart', handleDragMouseDown, true);
    });
    // Get all currently visible stint headers for this driver and add them to the overall list.
    allVisibleStintHeaders = allVisibleStintHeaders.concat(getVisibleStintHeaders(stintHeaderRowNode));
  });

  // Add mousedown and touchstart event listeners to all collected visible stint headers.
  allVisibleStintHeaders.forEach(stintHeaderCell => {
    stintHeaderCell.addEventListener('mousedown', handleDragMouseDown, true);
    stintHeaderCell.addEventListener('touchstart', handleDragMouseDown, true);
    stintHeaderCell.classList.add('draggableStintHeader');
  });
}

// --- Dropzone Styling Functions ---
/**
 * Adds 'accept' class to visualize a valid drop target.
 * @param {Event} event - The pointerenter event.
 */
function handleDropzoneEnter(event) {
  const columnCells = getFullStintColumn(event.target);
  columnCells.forEach(cell => cell.classList.add('dropzoneAccept')); // Renamed class for clarity
}

/**
 * Removes 'accept' class when the pointer leaves a drop target.
 * @param {Event} event - The pointerleave event.
 */
function handleDropzoneLeave(event) {
  const columnCells = getFullStintColumn(event.target);
  columnCells.forEach(cell => cell.classList.remove('dropzoneAccept'));
}

// --- Drag Preview Functions ---
/**
 * Updates the position of the drag preview element.
 * @param {PointerEvent} event - The pointermove event.
 */
function updateDraggedElementPosition(event) {
  const dragPreviewElements = document.getElementsByClassName('stintDragPreview'); // Renamed class
  Array.from(dragPreviewElements).forEach(preview => {
    // Position the preview near the cursor, with an offset.
    preview.style.top = `${event.pageY}px`;
    preview.style.left = `${event.pageX - 30}px`; // Offset to prevent cursor overlap
  });
}

/**
 * Creates a visual preview element for the stint being dragged.
 * @param {HTMLElement} stintHeaderCell - The header cell (th) of the stint being dragged.
 * @param {{x: number, y: number}} initialCoordinates - The initial coordinates for the preview.
 * @returns {HTMLElement} The created preview table element.
 */
function createDragPreviewElement(stintHeaderCell, initialCoordinates) {
  // Remove any existing drag previews.
  const existingPreviews = document.getElementsByClassName('stintDragPreview');
  Array.from(existingPreviews).forEach(preview => preview.remove());

  const previewTable = document.createElement('table');
  previewTable.classList.add('stintDragPreview'); // Renamed class
  previewTable.id = 'activeDragPreview'; // More specific ID

  // Create header row for the preview.
  const headerRow = previewTable.insertRow();
  headerRow.append(stintHeaderCell.cloneNode(true));

  // Create tyre row for the preview.
  // Assumes tyre cell is in the next row at the same cellIndex.
  const tableBody = stintHeaderCell.closest('tbody');
  if (tableBody && stintHeaderCell.closest('tr').nextElementSibling) {
      const tyreCellOriginal = tableBody.rows[stintHeaderCell.closest('tr').rowIndex + 1].cells[stintHeaderCell.cellIndex];
      if (tyreCellOriginal) {
        const tyreRowPreview = previewTable.insertRow();
        tyreRowPreview.append(tyreCellOriginal.cloneNode(true));
        tyreRowPreview.classList.add('tyre'); // Keep original class for styling consistency
      }
  }
  
  // Set initial position of the preview.
  previewTable.style.position = 'absolute'; // Ensure it's positioned correctly
  previewTable.style.top = `${initialCoordinates.y}px`;
  previewTable.style.left = `${initialCoordinates.x}px`;
  previewTable.style.zIndex = '1000'; // Ensure preview is on top

  return previewTable;
}

// --- Main Drag-and-Drop Event Handlers ---
/**
 * Handles the mousedown/touchstart event on a draggable stint header.
 * Initializes the drag operation.
 * @param {MouseEvent|TouchEvent} event - The mousedown or touchstart event.
 */
function handleDragMouseDown(event) {
  event.preventDefault(); // Prevent default actions like text selection.

  const draggedStintHeader = event.target; // The 'th' element that was clicked/touched.
  const tableBody = draggedStintHeader.closest('tbody');

  // Ensure the stint is visible and draggable.
  const tyreCellForVisibilityCheck = tableBody?.querySelector('.tyre')?.cells[draggedStintHeader.cellIndex];
  if (!tyreCellForVisibilityCheck || tyreCellForVisibilityCheck.style.visibility !== 'visible') {
    return; // Do not proceed if the stint is not visible.
  }

  // Create and display the drag preview.
  const initialX = (event.touches ? event.touches[0].pageX : event.pageX) - 30;
  const initialY = (event.touches ? event.touches[0].pageY : event.pageY);
  const dragPreview = createDragPreviewElement(draggedStintHeader, { x: initialX, y: initialY });
  document.body.append(dragPreview);

  // Add event listeners for pointer movement during drag.
  document.addEventListener('pointermove', updateDraggedElementPosition, true);
  
  // Get data from the original stint.
  const originalStintData = getStintData(getFullStintColumn(draggedStintHeader));

  // Identify other visible stints to act as dropzones.
  const allStintHeadersInRow = draggedStintHeader.closest('tr');
  if (!allStintHeadersInRow) return;

  const visibleStintHeaders = getVisibleStintHeaders(allStintHeadersInRow);
  visibleStintHeaders.forEach(stintHeader => {
    const stintColumnCells = getFullStintColumn(stintHeader);
    if (stintHeader === draggedStintHeader) {
      // Style the currently dragged column.
      stintColumnCells.forEach(cell => cell.classList.add('draggingStint')); // Renamed class
    } else {
      // Set up other stints as dropzones.
      stintColumnCells.forEach(cell => {
        cell.classList.add('dropzoneTarget'); // Renamed class
        // Add specific class for bottom cells of dropzone (e.g., wear row) if needed for styling.
        if (cell.parentElement.getAttribute('wearevent')) { // Assuming 'wearevent' identifies wear row.
          cell.classList.add('dropzoneTargetBottom');
        }
        cell.addEventListener('pointerenter', handleDropzoneEnter, true);
        cell.addEventListener('pointerleave', handleDropzoneLeave, true);
      });
    }
  });
  // Add event listener for when the drag ends (pointerup).
  // Pass originalStintData to be used when dropping.
  document.addEventListener('pointerup', (e) => handleDragEnd(e, originalStintData), { once: true, capture: true });
}

/**
 * Handles the pointerup event to finalize the drag-and-drop operation.
 * @param {PointerEvent} event - The pointerup event.
 * @param {object} draggedStintOriginalData - The data of the stint that was dragged.
 */
function handleDragEnd(event, draggedStintOriginalData) {
  // Clean up global event listeners for drag movement.
  document.removeEventListener('pointermove', updateDraggedElementPosition, true);
  // Note: The pointerup listener for handleDragEnd itself is already set with { once: true }.

  // Remove styling and event listeners from all potential dropzones and the dragged element.
  document.querySelectorAll('.dropzoneTarget, .draggingStint, .dropzoneTargetBottom, .dropzoneAccept').forEach(element => {
    element.classList.remove('draggingStint', 'dropzoneTarget', 'dropzoneTargetBottom', 'dropzoneAccept');
    element.removeEventListener('pointerenter', handleDropzoneEnter, true);
    element.removeEventListener('pointerleave', handleDropzoneLeave, true);
  });

  // Determine the element where the pointer was released.
  const dropTargetElement = document.elementFromPoint(event.clientX, event.clientY);
  
  // Check if the drop target is within a valid strategy area.
  let isDropTargetValid = false;
  const strategyContainers = document.getElementsByClassName('strategy'); // Main strategy containers.
  for (const strategyContainer of strategyContainers) {
    if (isElementChildOf(dropTargetElement, strategyContainer)) { // Changed from childOf
      isDropTargetValid = true;
      break;
    }
  }
  
  if (isDropTargetValid && dropTargetElement) {
    const targetColumnCells = getFullStintColumn(dropTargetElement); // Changed from getColumnElements
    if (targetColumnCells.length > 0) {
      // Set the data of the original stint to the new target column.
      setStintData(targetColumnCells, draggedStintOriginalData); // Changed from setStintInfo
      
      // TODO: Trigger update for the target stint (e.g., recalculate wear/fuel).
      // This was hinted at in the original code with a commented out `update_stint` call.
      // const targetStintFuelCell = targetColumnCells[0].closest('tbody')?.querySelector('.fuel')?.cells[targetColumnCells[0].cellIndex];
      // if (targetStintFuelCell) {
      //   updateStintVisualsAndRecalculate(targetStintFuelCell); // Assuming this function exists and is imported/available.
      // }
    }
  }

  // Remove the drag preview element.
  const dragPreview = document.getElementById('activeDragPreview');
  if (dragPreview) {
    dragPreview.remove();
  }
}

// --- Utility Functions for Stint Data and DOM Traversal ---

/**
 * Retrieves all cells belonging to a specific stint column.
 * @param {HTMLElement} elementInColumn - Any HTML element within the desired stint column.
 * @returns {HTMLElement[]} An array of cell elements (th, td) in that column.
 */
function getFullStintColumn(elementInColumn) {
  // Determine the cell index. Handles if elementInColumn is a 'th' or 'td' itself, or a child of one.
  const cell = elementInColumn.closest('td, th');
  if (!cell) return [];
  const cellIndex = cell.cellIndex + 1; // nth-child is 1-based.
  
  const tableBody = elementInColumn.closest('tbody');
  if (!tableBody) return [];
  
  // Select all th and td elements in that column index, excluding specific utility cells.
  return Array.from(tableBody.querySelectorAll(`th:nth-child(${cellIndex}), td:nth-child(${cellIndex}):not(.loadStint):not(.trash)`));
}

/**
 * Checks if an element is a child of a given parent element.
 * @param {Node} child - The potential child node.
 * @param {Node} parent - The potential parent node.
 * @returns {boolean} True if child is a descendant of parent, false otherwise.
 */
function isElementChildOf(child, parent) {
  let currentNode = child;
  while (currentNode && currentNode !== document.body) { // Stop if we reach the body or null
    if (currentNode === parent) return true;
    currentNode = currentNode.parentNode;
  }
  return false;
}

/**
 * Gets relevant data from a stint column.
 * @param {HTMLElement[]} stintColumnCells - Array of cells representing the stint column.
 * @returns {object|null} An object with tyre, fuel, push (index), and laps, or null if data extraction fails.
 */
function getStintData(stintColumnCells) {
  try {
    // Indices are based on assumed column structure: 0:Header, 1:Tyre, 2:Wear, 3:Push, 4:Fuel/Laps
    const tyre = stintColumnCells[1].querySelector('input').value;
    const fuel = stintColumnCells[4].querySelector('input').value; // Fuel amount input
    const laps = stintColumnCells[4].querySelector('span').textContent; // Laps displayed in span
    const push = stintColumnCells[3].querySelector('select').selectedIndex; // Push level selected index
    return { tyre, fuel, push, laps };
  } catch (error) {
    // console.error("Error getting stint data:", error, stintColumnCells);
    return null; // Return null or a default object if data extraction fails
  }
}

/**
 * Sets data to a target stint column.
 * @param {HTMLElement[]} targetStintColumnCells - Array of cells for the target stint column.
 * @param {object} stintData - Object containing {tyre, fuel, push (index), laps}.
 */
function setStintData(targetStintColumnCells, stintData) {
  if (!stintData) return;
  try {
    // Indices are based on assumed column structure.
    // Tyre (Cell 1)
    targetStintColumnCells[1].lastChild.textContent = stintData.tyre; // Displayed tyre text
    targetStintColumnCells[1].querySelector('input').value = stintData.tyre; // Hidden input value
    targetStintColumnCells[1].className = `ts-${stintData.tyre}`; // Class for tyre styling
    targetStintColumnCells[1].setAttribute('data-tyre', stintData.tyre); // Data attribute

    // Fuel/Laps (Cell 4)
    const lapsDisplaySpan = targetStintColumnCells[4].querySelector('span');
    if (lapsDisplaySpan.firstChild) {
      lapsDisplaySpan.replaceChild(document.createTextNode(stintData.laps), lapsDisplaySpan.firstChild);
    } else {
      lapsDisplaySpan.appendChild(document.createTextNode(stintData.laps));
    }
    targetStintColumnCells[4].querySelectorAll('input')[0].value = stintData.fuel; // Fuel amount input
    targetStintColumnCells[4].querySelectorAll('input')[1].value = stintData.laps; // Laps input

    // Push Level (Cell 3)
    targetStintColumnCells[3].querySelector('select').selectedIndex = stintData.push;
  } catch (error) {
    // console.error("Error setting stint data:", error, targetStintColumnCells, stintData);
  }
}

/**
 * Gets all visible stint header cells (th) from a given stint header row.
 * @param {HTMLElement} stintHeaderRowNode - The 'tr' element containing stint headers.
 * @returns {HTMLElement[]} An array of visible stint header 'th' elements.
 */
function getVisibleStintHeaders(stintHeaderRowNode) {
  const visibleHeaders = [];
  const allHeaderCells = stintHeaderRowNode.querySelectorAll('th:not(:first-child)'); // Exclude the first static header cell.
  
  allHeaderCells.forEach(headerCell => {
    // Check visibility by looking at the corresponding tyre cell in the next row.
    const tableBody = headerCell.closest('tbody');
    const tyreRow = tableBody?.querySelector('.tyre'); // Assumes tyre row has 'tyre' class.
    if (tyreRow && tyreRow.cells[headerCell.cellIndex] && tyreRow.cells[headerCell.cellIndex].style.visibility === 'visible') {
      visibleHeaders.push(headerCell);
    }
  });
  return visibleHeaders;
}

export{
  initializeDragAndDropStints // Renamed from dragStintHandler
};