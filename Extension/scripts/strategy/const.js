const track_info = {
  'au': { 'length': 5.3017135, 'wear': 40, avg:226.1090047 },//Australia
  'my': { 'length': 5.5358276, 'wear': 80, avg:208.879 },//Malaysia
  'cn': { 'length': 5.4417996, 'wear': 80, avg:207.975 },//China
  'bh': { 'length': 4.7273, 'wear': 60, avg:184.933 },//Bahrain
  'es': { 'length': 4.4580207, 'wear': 85, avg:189.212 },//Spain
  'mc': { 'length': 4.0156865, 'wear': 20, avg:187 },//Monaco
  'tr': { 'length': 5.1630893, 'wear': 90, avg:196 },//Turkey
  'de': { 'length': 4.1797523, 'wear': 50, avg:215.227 },//Germany
  'hu': { 'length': 3.4990127, 'wear': 30, avg:165.043 },//Hungary
  'eu': { 'length': 5.5907145, 'wear': 45, avg:199.05 },//Europe
  'be': { 'length': 7.0406127, 'wear': 60, avg:217.7 },//Belgium
  'it': { 'length': 5.4024186, 'wear': 35, avg:263.107 },//Italy
  'sg': { 'length': 5.049042, 'wear': 45, avg:187.0866142 },//Singapore
  'jp': { 'length': 5.0587635, 'wear': 70, avg:197.065 },//Japan
  'br': { 'length': 3.9715014, 'wear': 60, avg:203.932 },//Brazil
  'ae': { 'length': 5.412688, 'wear': 50, avg:213.218309 },//AbuDhabi
  'gb': { 'length': 5.75213, 'wear': 65, avg:230.552 },//Great Britain
  'fr': { 'length': 5.882508, 'wear': 80, avg:215.1585366 },//France
  'at': { 'length': 4.044372, 'wear': 60, avg:228.546 },//Austria
  'ca': { 'length': 4.3413563, 'wear': 45, avg:221.357243 },//Canada
  'az': { 'length': 6.053212, 'wear': 45, avg:220.409 },//Azerbaijan
  'mx': { 'length': 4.3076024, 'wear': 60, avg:172.32 },//Mexico
  'ru': { 'length': 6.078335, 'wear': 50, avg:197.092 },//Russia
  'us': { 'length': 4.60296, 'wear': 65, avg:186.568 },//USA
  'nl': { 'length': 4.259, 'wear': 65, avg:186.568 },//Netherlands
};
const trackLink = {
  'au': 'd=circuit&id=1&tab=history' ,//Australia
  'my': 'd=circuit&id=2&tab=history' ,//Malaysia
  'cn': 'd=circuit&id=3&tab=history' ,//China
  'bh': 'd=circuit&id=4&tab=history' ,//Bahrain
  'es': 'd=circuit&id=5&tab=history' ,//Spain
  'mc': 'd=circuit&id=6&tab=history' ,//Monaco
  'tr': 'd=circuit&id=7&tab=history' ,//Turkey
  'de': 'd=circuit&id=9&tab=history' ,//Germany
  'hu': 'd=circuit&id=10&tab=history' ,//Hungary
  'eu': 'd=circuit&id=11&tab=history' ,//Europe
  'be': 'd=circuit&id=12&tab=history' ,//Belgium
  'it': 'd=circuit&id=13&tab=history' ,//Italy
  'sg': 'd=circuit&id=14&tab=history' ,//Singapore
  'jp': 'd=circuit&id=15&tab=history' ,//Japan
  'br': 'd=circuit&id=16&tab=history' ,//Brazil
  'ae': 'd=circuit&id=17&tab=history' ,//AbuDhabi
  'gb': 'd=circuit&id=18&tab=history' ,//Great Britain
  'fr': 'd=circuit&id=19&tab=history' ,//France
  'at': 'd=circuit&id=20&tab=history' ,//Austria
  'ca': 'd=circuit&id=21&tab=history' ,//Canada
  'az': 'd=circuit&id=22&tab=history' ,//Azerbaijan
  'mx': 'd=circuit&id=23&tab=history' ,//Mexico
  'ru': 'd=circuit&id=24&tab=history' ,//Russia
  'us': 'd=circuit&id=25&tab=history', //USA
  'nl': 'd=circuit&id=26&tab=history' //Netherlands
};
const trackDictionary  = {
  'au':['australia','au',1],//,//Australia
  'my':['malaysia','my',2],//,//Malaysia
  'cn':['china','cn',3],//,//China
  'bh':['bahrain','bh',4],//,//Bahrain
  'es':['spain','es',5],//,//Spain
  'mc':['monaco','mc',6],//,//Monaco
  'tr':['turkey','tr',7],//,//Turkey
  'de':['germany','de',9],//,//Germany
  'hu':['hungary','hu',10],//,//Hungary
  'eu':['europe','eu',11],//,//Europe
  'be':['belgium','be',12],//,//Belgium
  'it':['italy','it',13],//,//Italy
  'sg':['sg','singapore',14],//,//Singapore
  'jp':['japan','jp',15],//,//Japan
  'br':['brazil','br',16],//,//Brazil
  'ae':['abu dhabi','abudhabi',17,'ae'],//,//AbuDhabi
  'gb':['gb','gb 19','great britan',18],//,//Great Britain
  'fr':['france','fr',19],//,//France
  'at':['austria','at',20],//,//Austria
  'ca':['canada','ca',21],//,//Canada
  'az':['azerbaijan','az',22],//,//Azerbaijan
  'mx':['mexico','mx',23],//,//Mexico
  'ru':['russia','ru',24],//,//Russia
  'us':['usa','us',25],////USA
  'nl':['netherlands','nl',25]////Netherlands


};
const multipliers = { 100: 1, 75: 1.25, 50: 1.5, 25: 3 };
export {
  track_info,
  multipliers,
  trackLink,
  trackDictionary
};