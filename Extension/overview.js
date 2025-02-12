button = document.getElementById("carsReviewBtn");

if(button.classList.contains("disabled"))
{
    button.className = "btn pushBtn right mright";
    button.removeAttribute("data-tip");
}
