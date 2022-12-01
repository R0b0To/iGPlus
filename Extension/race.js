function swapWeatherLink()
{
    var weatherLocation = {
        1:"-37.8464,144.9712",
        2:"2.7606,101.7375",
        3:"31.3389,121.2197",
        4:"26.0325,50.5106",
        5:"41.57,2.2611",
        6:"43.7347,7.4206",
        7:"40.9517,29.405",
        9:"49.3268,8.5652",
        10:"47.5822,19.2511",
        11:"39.4588,-0.3256",
        12:"50.4372,5.9714",
        13:"45.6206,9.2894",
        14:"1.2915,103.8639",
        15:"34.8431,136.5406",
        16:"-23.7011,-46.6972",
        17:"24.4672,54.6031",
        18:"52.0786,-1.0169",
        19:"43.2489,5.8037",
        20:"47.2235,14.7642",
        21:"45.5034,-73.5291",
        22:"40.3777,49.892",
        23:"19.3986,-99.0863",
        24:"43.5943,39.7252",
        25:"30.1462,-97.6236"
    }
    var url = "https://darksky.net/forecast/";
    var weather = document.getElementById("race").childNodes[0].lastChild.childNodes[1];
    darkWeather = weather.cloneNode(true);
    darkWeather.className+=" avoid";
    darkWeather.target="_blank";
    darkWeather.textContent = "DarkSky";
    darkWeather.setAttribute("style",'background:#00899e');
    darkWeather.href = url+weatherLocation[weather.href.match(/\d+/)[0]];
    darkWeather.id = "darkWeather";
    weather.parentElement.className="tree-btn";
    weather.parentElement.appendChild(darkWeather);
}

if(document.getElementById("darkWeather")==null)
swapWeatherLink();

