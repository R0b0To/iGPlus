function fuel_calc(f){
  switch (true) {
  /* case f >= 180:
        case f >= 160:
        case f >= 140:
        case f >= 120:
          return ((f ** -0.089) * 0.679);*/
  case f >= 100:
    return ((f ** -0.0792) * 0.652);
  case f >= 80:
    return ((f ** -0.081) * 0.657);
  case f >= 60:
    return ((f ** -0.0835) * 0.665);
  case f >= 40:
    return ((f ** -0.0854) * 0.669); //very good
  case f >= 20: //(20-40)
    return ((f ** -0.0886) * 0.678);
  default:  //(1-20)
    return ((f ** -0.0947) * 0.69);
  }}

function get_wear(tyre,laps,track_info,car_economy,multiplier){
  const tyreWearFactors = {SS: 2.03,S: 1.338,M: 1,H: 0.824};
  const tyreWear  = tyreWearFactors[tyre] ?? 1;
  const t = (1.43 * car_economy.te ** -0.0778) * (0.00364 * track_info.wear + 0.354) * track_info.length * 1.384612 * multiplier * tyreWear;
  //calculate stint wear
  const stint = Math.exp(1) ** ((-t / 100 * 1.18) * laps) * 100;
  let stint2 = (1 - (1 * ((t) + (0.0212 * laps - 0.00926) * track_info.length) / 100));
  for(let j = 1 ; j < laps ; j++)
  {
    stint2 *= (1 - (1 * ((t) + (0.0212 * j - 0.00926) * track_info.length) / 100));
  }
  stint2 = stint2 * 100;
  const average = ((stint + stint2) / 2).toFixed(2);
  return average;
}

export{
    fuel_calc,
    get_wear
}