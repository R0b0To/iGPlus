(async () => {
  for (let i = 0; i < 3; i += 1) {
    try {
      document.getElementById('sponsorSignTable').classList.add('tflip'); 
      break;
    } catch (err) {
      await new Promise((res) => setTimeout(res, 200)); // sleep a bit, while page loads  
      console.warn(`Retry #${i + 1}/3`);
    }
  }
})();
