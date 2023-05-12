button = document.getElementById("carsReviewBtn");

if(button.classList.contains("disabled"))
{
    button.className = "btn fill-w ";
    button.removeAttribute("data-tip");
}
