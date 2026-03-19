async function loadFullTable() {
  const circuits = await getActiveCircuits();
  const container = document.getElementById('table-container');
  
  // Create a simple table that loops through tiers 1, 2, 3 
  // and every circuit code (ae, at, au...)
  // Provide an <input> for every value.
}