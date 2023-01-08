function addLevelLabels()
{
    try {
        if(document.getElementsByClassName("levelLabel")[0]!=null)
        return;
   
        buildings =document.querySelectorAll("div.i100 > img");
        buildings.forEach(node => {
            levelDiv = document.createElement("div");
            levelDiv.className="levelLabel";
            levelDiv.setAttribute("style","position:absolute; margin-left: 8px;");
            level = node.currentSrc.match(/\d+/)[0];
            levelDiv.textContent = "Lv: " + level;
            node.after(levelDiv);
          });
} catch (error) {
    setTimeout(() => {
        addLevelLabels();
      }, 200);
}  
}

 addLevelLabels();