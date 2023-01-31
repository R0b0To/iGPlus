button = document.getElementById("carsReviewBtn");

if(button.classList.contains("disabled"))
{
    button.className = "btn4 fill-w ";
    button.removeAttribute("data-tip");
}
