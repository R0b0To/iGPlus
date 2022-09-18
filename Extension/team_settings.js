colorPicker = document.getElementsByClassName("colorPicker")[0];
new_colorPicker = document.createElement("input");
 new_colorPicker.type = "color";
 new_colorPicker.value = colorPicker.value;
 new_colorPicker.style.width = "32px";
 new_colorPicker.style.height = "32px";
 new_colorPicker.addEventListener("change",update)



parent = colorPicker.parentElement;

parent.append(new_colorPicker);


if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    {
        ///new_colorPicker.style.gridColumn ="1 / span 1";
        parent.style.display="grid";
        parent.style.alignItems="center";
        parent.style.justifyContent="start";
        text_input = document.createElement("input");
        text_input.style.gridColumn ="2 / span 1";
        text_input.maxLength = "7";
        text_input.style.width = "64px";
        text_input.placeholder = colorPicker.value;
        validate = document.createElement("a");
        validate.style.background = "#689954";
        validate.style.borderRadius="4px";
        
        validate.style.textAlign = "center";
        validate.style.fontFamily="RobotoCondensedBold";
        validate.style.color = 'white';
        validate.innerText = "ok";
        validate.style.gridColumn ="3 / span 1";
        validate.style.width = "32px";
        validate.style.height = "32px";
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
