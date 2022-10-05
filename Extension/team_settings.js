colorPicker = document.getElementsByClassName("colorPicker")[0];
new_colorPicker = document.createElement("input");
new_colorPicker.setAttribute("style","width:32px; height: 32px");
 new_colorPicker.type = "color";
 new_colorPicker.value = colorPicker.value;
 new_colorPicker.addEventListener("change",update);



parent = colorPicker.parentElement;

parent.append(new_colorPicker);

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    {
        
        parent.setAttribute("style","display:grid; align-items: center; justify-content: start");
       
        text_input = document.createElement("input");
        text_input.setAttribute("style","grid-Column: 2/span 1; width:64px;");
        text_input.placeholder = colorPicker.value;

        validate = document.createElement("a");
        validate.setAttribute("style","width:32px; height:32px; background:#689954; border-radius:4px; text-align:center; font-family:RobotoCondensedBold; color:white; grid-column: 3/span 1; display:grid; align-content:center;");
        validate.textContent = "ok";
        validate.addEventListener("click",confirm);

        parent.append(text_input);
        parent.append(validate);
    }


colorPicker.style.display= "none";


function update(){
    colorPicker.value = new_colorPicker.value;
}
function confirm()
{
    t_value = text_input.value;
    if(t_value != "")
    {
    regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/gm;
    if(regex.test(t_value))
    {
        colorPicker.value = text_input.value;
        new_colorPicker.value = text_input.value;
    }
    else{
        alert("Wrong input, The format is #123456");
    }
}

}
