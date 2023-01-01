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
    darkWeather.className+=" avoid";
    darkWeather.target="_blank";
    darkWeather.textContent = "Weather";
    darkWeather.setAttribute("style",'background:#00899e');
    darkWeather.href = url+weatherLocation[weather.href.match(/\d+/)[0]];
    darkWeather.id = "darkWeather";
    weather.parentElement.className="tree-btn";
    weather.parentElement.appendChild(darkWeather);
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