
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.local.get({
      language: 'English',
    }, function(items) {
      document.getElementById("valuesId").textContent = lang[items.language].valuesText;
      document.getElementById("valuesGapId").textContent = lang[items.language].gapText;
    });
  }




function inject_attributes_details(){

    if(!done){
try {
    title = document.querySelector("#carResearch > thead > tr");
    values = document.createElement("th");
    values.id="valuesId";
    values_gap = document.createElement("th"); 
    values_gap.id = "valuesGapId";
    values.style.width ="7%";
    values_gap.style.width ="30px";
    title.childNodes[0].style.width = "20%";
  
    title.insertBefore(values, title.childNodes[0]);
    title.insertBefore(values_gap, title.childNodes[1]);

table = document.querySelector("#carResearch > tbody");


for(i=0; i<8 ; i++)
  {
    attribute= table.rows[i];
    data_area = document.createElement("th"); 
    gap_area = document.createElement("th"); 
    //gap_area.style.backgroundColor="red";
    value = get_attribute_value(i);
    gap = value[0]-value[1];

    data = document.createTextNode(value[1]+" : "+value[0]);
    gap_data = document.createTextNode(gap);

    data_area.appendChild(data);
    gap_area.appendChild(gap_data);

    attribute.insertBefore(data_area, attribute.childNodes[0]);
    attribute.insertBefore(gap_area, attribute.childNodes[1]);
  }
  done = true;
  restore_options();
} catch (error) {
    console.log(error);
    setTimeout(() => {
        inject_attributes_details();
    }, 200);
}

    }
}

function get_attribute_value(attr){

    function useRegex(input) {
        let regex = /[0-9]+%/g;
        return regex.exec(input)[0];
    }
    
    attribute_values=[];

    switch(attr) {
        case 0:
            //acceleration
          best_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(1) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
          my_attr =   parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(1) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 1:
            //braking
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(2) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(2) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 2:
            //cooling
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(3) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(3) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 3:
            //downforce
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(4) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(4) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 4:
            //fuel economy
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(5) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(5) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 5:
            //handling
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(6) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(6) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 6:
            //reliability
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(7) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(7) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        case 7:
            //tyre economy
            best_attr =parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(8) > td:nth-child(3) > div > img:nth-child(1)").outerHTML))*200/100;
            my_attr = parseInt(useRegex(document.querySelector("#carResearch > tbody > tr:nth-child(8) > td:nth-child(3) > div > div").outerHTML))*200/100;
        break;
        default:
            console.log("error");
            }

            attribute_values[0] = best_attr;
            attribute_values[1] = my_attr;
            return attribute_values;

}


done = false;
if(document.getElementById("valuesId")==null)
inject_attributes_details();




