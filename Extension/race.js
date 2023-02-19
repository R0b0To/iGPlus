async function request(url) {
    return await fetch(url)
    .then(response => response.json())
    .then(data => {return data})
    .catch(error => console.error(error))
} 
function addWeatherLink()
{
    var weather = document.getElementById("race").childNodes[0].lastChild.childNodes[1];
    weather.parentElement.className="tree-btn";

    var weatherAlt = weather.cloneNode(true);
    weatherAlt.addEventListener("click",getWeather);
    weatherAlt.textContent = "Weather";
    weatherAlt.href = "#";//url+weatherLocation[trackID];
    weatherAlt.id = "chartWeather";
    weatherAlt.className = "btn4";
    
    var weatherContainer = document.createElement("div");
    weatherContainer.id = "container";
    weatherContainer.setAttribute("style","position:absolute; left:0; right:0");
    weather.parentElement.appendChild(weatherAlt);
    weather.parentElement.appendChild(weatherContainer);
 
}
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
async function getWeather(){
    url = "https://igpmanager.com/index.php?action=fireUp&addon=igp&ajax=1&jsReply=fireUp&uwv=false&csrfName=&csrfToken=";
    managerJSON = await request(url);
    managerJSON.manager.format.temperature;
    url2 = "";
    if( managerJSON.manager.format.temperature == 2)
    url2="&temperature_unit=fahrenheit";

    var trackID = document.getElementById("race").childNodes[0].lastChild.childNodes[1].href.match(/\d+/)[0];
    
    url = "https://api.open-meteo.com/v1/forecast?latitude="+weatherLocation[trackID][0]+"&longitude="+weatherLocation[trackID][1]+"&hourly=temperature_2m,relativehumidity_2m,precipitation&models=gfs_seamless"+url2;
    data = await request(url);
   
    //url3 = "http://api.weatherunlocked.com/api/forecast/51.50,-0.12?app_id=ba14cfca&app_key=637253385cd6ff853a6cf83c85132a4b"; 
 /*  chrome.runtime.sendMessage( //goes to bg_page.js
      url3,
      data => previewData2(data) //your callback
); */

    previewData(data); 
}
function previewData(data) {


    Object.keys(data.hourly).forEach((ele) =>
    {
        data.hourly[ele] =  data.hourly[ele].slice(0,48);
    })
    //console.log(data);

    var yAxis = [];
    let codes = {0: "fair", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 
        48: "depositing rime fog", 51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle", 
        56: "light freezing drizzle", 57: "dense freezing drizzle", 61: "slight rain", 63: "moderate rain", 
        65: "heavy rain", 66: "light freezing rain", 67: "heavy freezing rain", 71: "slight snow fall", 
        73: "moderate snow fall", 75: "heavy snow fall", 77: "snow grains", 80: "slight rain showers", 
        81: "moderate rain showers", 82: "heavy rain showers", 85: "slight snow showers", 86: "heavy snow showers",
        95: "slight to moderate thunderstorm", 96: "thunderstorm with slight hail", 99: "thunderstorm with heavy hail"
    };
    //data = JSON.parse(data);
   // console.log(data);
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
            {
                colorP= Highcharts.getOptions().colors[1];
                k[0] ="humidity";
            }
                    
            if(k[0]=="temperature_2m")
            {
               colorP = Highcharts.getOptions().colors[3]; 
               k[0] ="temperature";
            }
            



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
            //console.log(ser);
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
        
        accessibility: {
            enabled: false
        },
        title: {
            text: ""
        },

        chart: {
            type: 'spline',
            zoomType: 'x',
            panning: true,
            panKey: 'shift',
            backgroundColor:"#e3e4e5"
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
    ],
       
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
            verticalAlign: 'middle',
         
           

        },
    
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                },
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
            crosshairs: true
        },
        caption: {
            text: '<b> Click and drag in the chart to zoom in and inspect the data.</b>'
        }
    }
   
    if (document.getElementById('container')) {
        Highcharts.chart('container', json);
    }
    if (document.getElementById('containerStockcharts')) {
        Highcharts.stockChart('containerStockcharts', json);
    }
}
//latitude, longitude
var weatherLocation = {
    1:[-37.84,144.96],//australia
    2:[2.74,101.72],//malaysia
    3:[31.32,121.21],//china
    4:[26.02,50.51],//bahrain
    5:[41.55,2.25],//spain
    6:[43.7347,7.4206],//monaco
    7:[40.93,29.42],//turkey
    9:[49.32,8.55],//germany
    10:[47.60,19.24],//hungary
    11:[39.47,-0.38],//europe
    12:[50.39,5.93],//belgium
    13:[45.58,9.27],//italy
    14:[1.29,103.86],//singapore
    15:[34.84,136.55],//japan
    16:[-23.70,-46.70],//brazil
    17:[24.45,54.38],//abu
    18:[52.08,-1.02],//gb
    19:[43.20,5.80],//france
    20:[47.21,14.79],//austria
    21:[45.50,-73.56],//canada
    22:[40.3777,49.892],//azerbaijan
    23:[19.40,-99.09],//mexico
    24:[43.59,39.72],//russia
    25:[30.17,-97.62]//usa
}
try {
 (function main(){
if(document.getElementById("chartWeather")==null)
addWeatherLink();
swapMap();
showValues();})();
} catch (error) {
    //console.log('page not loaded');
}

