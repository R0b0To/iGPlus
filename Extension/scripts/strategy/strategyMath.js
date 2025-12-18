function fuel_calc(f){
  /*switch (true) {
   case f >= 180:
        case f >= 160:
        case f >= 140:
        case f >= 120:
          return ((f ** -0.089) * 0.679);
  case f >= 250:
    return (((0.6666 * f) ** -0.08434) * 0.669);          
  case f >= 200:
    return (((0.6666 * f) ** -0.08434) * 0.669);          
  case f >= 150:
    return (((0.6666 * f) ** -0.08473) * 0.669);        
  case f >= 100:
    return (((0.6666 * f) ** -0.08505) * 0.669);
  case f >= 80:
    return (((0.6666 * f) ** -0.08505) * 0.669);
  case f >= 60:
    return (((0.6666 * f) ** -0.08505) * 0.669);
  case f >= 40:
    return (((0.6666 * f) ** -0.0842) * 0.669); //very good
  case f >= 20: //(20-40)
    return (((0.6666 * f) ** -0.083) * 0.669);
  default:  //(1-20)
    return (((0.6616417192 * f) ** -0.06846035841));
  }*/
  const fuel = (0.6566417192 * f ** -0.06846035841);
    return fuel;
 
  }

function get_wear(tyre,laps,track_info,car_economy,multiplier){
  //console.log(tyre,laps,track_info,car_economy,multiplier);

  //TO DO. if wear is needed for strategy preview make a request to open.weather with specified track
  const weatherNow = convertToCelsius((document.getElementsByClassName('pWeather text-right green')[0]?.lastChild.textContent ) ?? '25');
  //console.log('past temperature')
  const optimal = -0.0323 * track_info.avg  + 10.9 - (weatherNow / 10);
  const tyreScale = {SS:optimal - 1,S:optimal,M:optimal + 1,H:optimal + 2,I:optimal + 1,W:optimal + 1};

  //console.log(tyre,tyreScale[tyre],5 - car_economy.push,'difference is:',tyreScale[tyre] - (5 - car_economy.push));
  const diff =   tyreScale[tyre] - (5 - car_economy.push);
  let pushDecay = 0;
  switch (true) {
  case diff >= 1 && diff <= 2:
    pushDecay = 0.3;   break;
  case diff >= 2 && diff <= 3:
    pushDecay = 0.5;   break;
  case diff >= 3:
    pushDecay = 1.5;   break;
  case diff >= 0  && diff <= 1:
    pushDecay = 0;   break;
  case diff >= -1 && diff <= 0:
    pushDecay = -0.3;   break;
  case diff >= -2 && diff <= -1:
    pushDecay = -0.8;   break;
  case diff <= -2:
    pushDecay = -1.5;   break;
  default:  //(1-20)
    pushDecay = 0;
  }

  const tyreWearFactors = {SS: 2.14,S: 1.4,M: 1,H: 0.78};

  const tyreWear  = tyreWearFactors[tyre] ?? 1;
  const track_wear = track_info.wear;
  const track_length = track_info.length;
  const te = car_economy.te;

  const t = (1.29 * te ** -0.0696) * (0.00527 * track_wear + 0.556) * track_length * multiplier * tyreWear;

  //calculate stint wear
  const stint = Math.exp(1) ** ((-t / 100 * 1.18) * laps) * 100;
  let stint2 = (1 - (1 * ((t) + (0.0212 * laps - 0.00926) * track_length) / 100));
  for(let j = 1 ; j < laps ; j++)
  {
    stint2 *= (1 - (1 * ((t) + (0.0212 * j - 0.00926) * track_length) / 100));
  }
  stint2 = stint2 * 100;
  
  const stint3 = calculateWear(laps,t,pushDecay,diff);

  //console.log('laps:',laps,stint3, stint);
  const average = ((stint + stint) / 2).toFixed(2);
  // return average;
  return average;
}

function calculateWear(n, wear, push,diff) {
  let lapWear = ((1 - wear / 100 + push / 100) ** n) * 100;
  if(n > 3 && diff <= -2){
    lapWear = ((1 - wear/100 + push/100 -0.013)** n)*100;
  }
  /*if(lapWear<60)
        lapWear = ((1 - wear/100 + push/100 -0.002)** n)*100;
  console.log(lapWear)*/
  return lapWear;
}


export{
  fuel_calc,
  get_wear
};

function convertToCelsius(temperature) {
  temperature = temperature.trim();
  if (/^\d+°F$/.test(temperature)) {
    const fahrenheit = parseInt(temperature);
    const celsius = Math.round(((fahrenheit - 32) * 5) / 9);
    return celsius;
  } else if (/^\d+°C$/.test(temperature)) {
    return parseInt(temperature);
  } else {
    // Invalid format
    return null;
  }
}