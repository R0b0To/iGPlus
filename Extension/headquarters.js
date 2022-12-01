
function addLevelLabels()
{
    try {

        if(document.getElementsByClassName("levelLabel")[0]!=null)
        return;
   
        building = document.getElementById("page-content");

    for(var i=3 ; i<=8; i++)
    {
       level = building.childNodes[i].childNodes[2].childNodes[0].childNodes[0].currentSrc.match(/\d+/)[0];
       levelDiv = document.createElement("div");
       levelDiv.textContent= "Lv: "+level;
       levelDiv.className="levelLabel";
       levelDiv.setAttribute("style","position:absolute; margin-left: 8px;");
       building.childNodes[i].childNodes[0].after(levelDiv)
    }
} catch (error) {
    setTimeout(() => {
        addLevelLabels();
      }, 200);
}
    
}

 addLevelLabels();