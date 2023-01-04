function addWeatherLink()
{
   
    var weatherLocation = {
        1:"au/melbourne/-37.84,144.96",
        2:"my/sepang-district/2.74,101.72",
        3:"cn/shanghai/31.32,121.21",
        4:"bh/horat-anaqa/26.02,50.51",
        5:"es/montmeló/41.55,2.25",
        6:"mc/condamine",
        7:"tr/tuzla/40.93,29.42",
        9:"de/hockenheim/49.32,8.55",
        10:"hu/buziii/47.60,19.24",
        11:"/es/39.47,-0.38",
        12:"be/stavelot/50.39,5.93",
        13:"it/monza/45.58,9.27",
        14:"sg-01/singapore/1.29,103.86",
        15:"jp/suzuka/34.84,136.55",
        16:"br/são-paulo/-23.70,-46.70",
        17:"ae/abu-dhabi/24.45,54.38",
        18:"gb/towcester/52.08,-1.02",
        19:"fr/le-castellet/43.20,5.80",
        20:"at/spielberg/47.21,14.79",
        21:"ca/montreal/45.50,-73.56",
        22:"UBBB",
        23:"mx/mexico-city/19.40,-99.09",
        24:"ru/sochi/43.59,39.72",
        25:"us/tx/del-valle/30.17,-97.62"
    }
    
    var url = "https://www.wunderground.com/forecast/";
    var weather = document.getElementById("race").childNodes[0].lastChild.childNodes[1];
    darkWeather = weather.cloneNode(true);
    trackID = weather.href.match(/\d+/)[0];
    darkWeather.addEventListener("click",getWeather);
    //darkWeather.className+=" avoid";
    //darkWeather.target="_blank";
    darkWeather.textContent = "Weather";
    darkWeather.setAttribute("style",'background:#00899e');
    darkWeather.href = "#";//url+weatherLocation[trackID];
    darkWeather.id = "darkWeather";
    weather.parentElement.className="tree-btn";
    test = document.createElement("div");
    test.id = "container";
    weather.parentElement.appendChild(darkWeather);
    weather.parentElement.appendChild(test);

    
    
}

if(document.getElementById("darkWeather")==null)
addWeatherLink();
swapMap();
showValues();
function swapMap()
{
    circuit = document.querySelector("#race > div:nth-child(1) > h1 > img").outerHTML;
    code = /[^-]+(?=">)/g.exec(circuit)[0];
    image = document.querySelector("#race > div.eight.columns.text-center > img");
    image.src= chrome.runtime.getURL('images/circuits/'+code+'.png');
    image.setAttribute("style","width:90%");
}
function showValues()
{
    function createEle(value)
    {
    number = document.createElement("span");
    number.setAttribute("style","position:absolute; top:-90%; left:"+value+";font-size:90%");
    number.className = "showStat";
    number.textContent= value;
    return number;
    }

    if(document.getElementsByClassName("showStat").length==0)
    {
    table = document.querySelector("#race > div:nth-child(1) > table > tbody");

    table.rows[2].childNodes[1].childNodes[0].appendChild(createEle(table.rows[2].childNodes[1].childNodes[0].childNodes[0].style.width));
    table.rows[3].childNodes[1].childNodes[0].appendChild(createEle(table.rows[3].childNodes[1].childNodes[0].childNodes[0].style.width));
    table.rows[4].childNodes[1].childNodes[0].appendChild(createEle(table.rows[4].childNodes[1].childNodes[0].childNodes[0].style.width));
    table.rows[5].childNodes[1].childNodes[0].appendChild(createEle(table.rows[5].childNodes[1].childNodes[0].childNodes[0].style.width));
}
    
}

function request(url) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.response)
          } else {
            reject(xhr.status)
          }
        }
      }
      xhr.ontimeout = function () {
        reject('timeout')
      }
      xhr.open('get', url, true)
      xhr.send()
    })
  } 

async function getWeather(){


    url = "https://igpmanager.com/index.php?action=fireUp&addon=igp&ajax=1&jsReply=fireUp&uwv=false&csrfName=&csrfToken=";
    managerData = await request(url);
    managerJSON = JSON.parse(managerData)
    
    
    managerJSON.manager.format.temperature;
    url2 = "";
    if( managerJSON.manager.format.temperature == 2)
    url2="&temperature_unit=fahrenheit";

    var trackID = document.getElementById("race").childNodes[0].lastChild.childNodes[1].href.match(/\d+/)[0];
    coordinates = weatherLocation2[trackID].split(",");
    url = "https://api.open-meteo.com/v1/forecast?latitude="+coordinates[0]+"&longitude="+coordinates[1]+"&hourly=temperature_2m,relativehumidity_2m,precipitation"+url2;
    weatherResponse = await request(url);
    data = JSON.parse(weatherResponse)
  
    
  
    
    previewData(data);

   
}
var weatherLocation2 = {
    1:"-37.84,144.96",
    2:"2.74,101.72",
    3:"31.32,121.21",
    4:"26.02,50.51",
    5:"41.55,2.25",
    6:"43.7347,7.4206",
    7:"40.93,29.42",
    9:"49.32,8.55",
    10:"47.60,19.24",
    11:"39.47,-0.38",
    12:"50.39,5.93",
    13:"45.58,9.27",
    14:"1.29,103.86",
    15:"4.84,136.55",
    16:"-23.70,-46.70",
    17:"24.45,54.38",
    18:"52.08,-1.02",
    19:"43.20,5.80",
    20:"47.21,14.79",
    21:"45.50,-73.56",
    22:"40.3777,49.892",
    23:"19.40,-99.09",
    24:"43.59,39.72",
    25:"30.17,-97.62"
}


function previewData(data) {
    var yAxis = [];
    let codes = {0: "fair", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 
        48: "depositing rime fog", 51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle", 
        56: "light freezing drizzle", 57: "dense freezing drizzle", 61: "slight rain", 63: "moderate rain", 
        65: "heavy rain", 66: "light freezing rain", 67: "heavy freezing rain", 71: "slight snow fall", 
        73: "moderate snow fall", 75: "heavy snow fall", 77: "snow grains", 80: "slight rain showers", 
        81: "moderate rain showers", 82: "heavy rain showers", 85: "slight snow showers", 86: "heavy snow showers",
        95: "slight to moderate thunderstorm", 96: "thunderstorm with slight hail", 99: "thunderstorm with heavy hail"
    };

    var series = [];
    ["hourly", "six_hourly", "three_hourly", "daily"].forEach(function (section, index) {
        if (!(section in data)) {
            return
        }
        Object.entries(data[section]||[]).forEach(function(k){
            if (k[0] == "time" || k[0] == "sunrise" || k[0] == "sunset") {
                return
            }
            let date = new Date(data[section].time[0]);
            let date2 = new Date(data[section].time[1]);
            offset = -new Date().getTimezoneOffset();
            let hourly_starttime = (date.getTime() + offset);
            let pointInterval = (date2.getTime() - date.getTime());
            let unit = data[`${section}_units`][k[0]];
            var axisId = null;
            for (let i = 0; i < yAxis.length; i++) {
                if (yAxis[i].title.text == unit) {
                    axisId = i;
                }
            }
            if (axisId == null) {
                yAxis.push({title: {text: unit}});
                axisId = yAxis.length-1;
            }
            

            typeP ="";

            if(k[0]=="precipitation")
            {
                var colorP= Highcharts.getOptions().colors[0];
                typeP = "area";
            }   
            if(k[0]=="relativehumidity_2m")
                    colorP= Highcharts.getOptions().colors[1];
            if(k[0]=="temperature_2m")
            colorP = Highcharts.getOptions().colors[3];



            var ser = {
                name: k[0],
                data: k[1],
                color: colorP,
                type: typeP,
                yAxis: axisId,
                pointStart: hourly_starttime,
                pointInterval: pointInterval,
                tooltip: {
                    valueSuffix: " " + unit,
                }
            };
    
            if (k[0] == "weathercode") {
                ser.tooltip.pointFormatter = function () {
                    let condition = codes[this.y];
                    return "<span style=\"color:"+this.series.color+"\">\u25CF</span> "+this.series.name+": <b>"+condition+"</b> ("+this.y+" wmo)<br/>"
                }
            }

            series.push(ser);
        });
    });

    var plotBands = []
    if ('daily' in data && 'sunrise' in data.daily && 'sunset' in data.daily) {
        let rise = data.daily.sunrise
        let set = data.daily.sunset
        var plotBands = rise.map(function(r, i) {
            return {
                "color": "rgb(255, 255, 194)",
                "from": (r + data.utc_offset_seconds) * 1000,
                "to": (set[i] + data.utc_offset_seconds) * 1000
            };
        });
    }

    let latitude = data.latitude.toFixed(2);
    let longitude = data.longitude.toFixed(2);
    let title = `${latitude}°N ${longitude}°E`;
    
    if ("elevation" in data) {
        let elevation = data.elevation.toFixed(0);
        title = `${title} ${elevation}m above sea level`;
    }

    offset = -new Date().getTimezoneOffset();
    let json =  {
       
        title: {
            text: ""
        },

        chart: {
            type: 'spline',
            zoomType: 'x'
        },    
    
        yAxis:[{ 
            visible:false
        },
        { 
            visible:false
        },
        { 
            visible:false
        },
    ],/* [{ // Primary yAxis
            labels: {
                format: '{value}°C',
                style: {
                    color: Highcharts.getOptions().colors[3]
                }
            },
            title: {
                text: 'Temperature',
                style: {
                    color: Highcharts.getOptions().colors[3]
                }
            },
            opposite: true
    
        }, { // Secondary yAxis
            gridLineWidth: 0,
            title: {
                text: 'Humidity',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                format: '{value} %',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            }
    
        },{ // tert yAxis
            gridLineWidth: 1,
            title: {
                text: 'WaterLevel',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                format: '{value} mm',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            }
    
        }],*/
       
        xAxis: {
            type: 'datetime',
            plotLines: [{
                value: Date.now() + (offset * 60000),
                color: 'red',
                width: 2
            }],
            plotBands: plotBands
        },
    
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },
    
        plotOptions: {
            series: {
                label: {
                    connectorAllowed: false
                },
            }
        },
    
        series: series,
    
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 800
                },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        },
        tooltip: {
            shared: true,
        }
    }
   
    if (document.getElementById('container')) {
        Highcharts.chart('container', json);
    }
    if (document.getElementById('containerStockcharts')) {
        Highcharts.stockChart('containerStockcharts', json);
    }
}
