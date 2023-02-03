function addLevelLabels()
{
    try {
        if(document.getElementsByClassName("levelLabel")[0]!=null)
        return;
        buildings = document.querySelectorAll("div.c-wrap.text-center > a");
        buildings.forEach(async node => {
            var levelDiv = document.createElement("div");
            levelDiv.className="levelLabel";
            levelDiv.setAttribute("style","position:absolute; margin-left: 8px;");
            id = node.href.match(/\d+/)[0];
            url= `https://igpmanager.com/index.php?action=fetch&d=facility&id=${id}&csrfName=&csrfToken=`;
            fetch(url)
            .then(response => response.json())
            .then(data => {
                try{
                    if (data.vars.level != null)
                        levelDiv.textContent = "Lv: " + data.vars.level;
                } catch (error) {
                    console.log("couldn't get level of building");
                }
                    node.previousSibling.append(levelDiv);
                })
            .catch(error => console.error(error))

          });
} catch (error) {
    setTimeout(() => {
        addLevelLabels();
      }, 200);
}  
}

 addLevelLabels();