async function request(url) {
    return await fetch(url)
    .then(response => response.json())
    .then(data => {return data})
    .catch(error => console.error(error))
} 
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
            data = await request(url);
            try {
               levelDiv.textContent = "Lv: " + data.vars.level; 
            } catch (error) {
                console.log("couldn't get level of building");
            }
            node.previousSibling.append(levelDiv);
          });
} catch (error) {
    setTimeout(() => {
        addLevelLabels();
      }, 200);
}  
}

 addLevelLabels();