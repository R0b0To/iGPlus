addCustom();


function update(){
    const colorPicker = document.getElementById('teamColour');
    colorPicker.value = this.value;
}

function addCustom(){
  
    const colorPicker = document.getElementById('teamColour');
    const parent = colorPicker.parentElement;
    parent.classList.add('custom-color-container');
    const new_colorPicker = document.createElement("input");
            new_colorPicker.classList.add('custom-color');
            new_colorPicker.type = "color";
            new_colorPicker.value = colorPicker.value;
            new_colorPicker.addEventListener("change",update);
            
            colorPicker.style.display= "none";

    if(document.getElementsByClassName('custom-color').length>0)return;
    parent.append(new_colorPicker);  
    const device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if(device)
        {
            
            //parent.setAttribute("style","display:grid; align-items: center; justify-content: start");
            
            new_colorPicker.addEventListener("change",function(e){
                text_input.value = this.value});
            const text_input = document.createElement("input");
            text_input.classList.add('text-color');
            text_input.placeholder = colorPicker.value;
            text_input.maxLength = 7;
            text_input.addEventListener("input", function(event) {
                if (this.value.length === 7) {
                   
                    const t_value = this.value;
                    if(t_value != "")
                    {
                    const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/gm;
                    if(regex.test(t_value))
                    {
                        colorPicker.value = text_input.value; 
                        new_colorPicker.value = text_input.value;  
                    }
                    else{
                        alert("Wrong input, The format is #0934af");
                        text_input.value = colorPicker.value;
                    }
                    }      


                }
            });
            //const validate = document.createElement("a");
            //validate.classList.add('validate-button','pushBtn','btn');
            //validate.textContent = "ok";
            //validate.addEventListener("click",confirm);
            //parent.append(validate);
            
            parent.append(text_input);
            
       
        }
        else{
            
        }
    
    
    


}