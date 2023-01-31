function addExtraButtons()
{
    if(document.getElementById("raceReview")==null)
    {
        try {
    race = document.querySelector("a.btn2.fill-w");
    race.className = "btn2";
    race.setAttribute("style","width:inherit;");
    raceReview = document.createElement("a");
    raceReview.id="raceReview";
    raceReview.href='d=raceReview';
    raceReview.textContent = "Race Review";
    raceReview.className = "btn4";
    raceReview.setAttribute("style","margin:10px auto;display:inline-block;width: inherit;");
    race.after(raceReview);
        } catch (error) {
            
        }
    

    }
   
}


addExtraButtons();