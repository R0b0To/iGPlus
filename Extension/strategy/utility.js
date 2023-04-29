function createSlider(node,min,max) {
  const settingValueDiv = node.previousElementSibling.childNodes[1];
  settingValueDiv.classList.remove('green');

  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('sliderContainer');
  const sliderLabelTrack = document.createElement('div');
  sliderLabelTrack.classList.add('track');
  sliderContainer.append(sliderLabelTrack);
  const slider = document.createElement('input');
  slider.className = 'sliderX';
  slider.type = 'range';
  slider.max = max;
  slider.min = min;
  slider.value = settingValueDiv.textContent;

  function getRangePercent(sliderE){
    return (sliderE.value - sliderE.min) / (sliderE.max - sliderE.min) * 100;
  }
  slider.addEventListener('input', function () {
    sliderLabelTrack.append(settingValueDiv);
    settingValueDiv.textContent = this.value;
    settingValueDiv.classList.add('slider-label');
    settingValueDiv.style.left = getRangePercent(slider) + '%';
  });

  slider.addEventListener('change', function () {
    settingValueDiv.classList.remove('slider-label');
    sliderContainer.classList.remove('visible');
    slider.parentElement.parentElement.append(settingValueDiv);
    slider.parentElement.parentElement.nextElementSibling.value = slider.value;
    if(slider.value == 0)
    {
      const driverStrategyId = this.closest('form').id;
      document.getElementsByName('fuel1')[driverStrategyId[1] - 1].value = 0;
    }
  });

  settingValueDiv.addEventListener('click', function () {
    if (!sliderContainer.classList.contains('visible')) {
      sliderLabelTrack.append(settingValueDiv);
      sliderContainer.classList.add('visible');
      settingValueDiv.classList.add('slider-label');
      settingValueDiv.style.left = getRangePercent(slider) + '%';
    } else {
      sliderContainer.classList.remove('visible');
      settingValueDiv.classList.remove('slider-label');
      slider.parentElement.parentElement.append(settingValueDiv);
    }
  });

  sliderContainer.append(slider);
  settingValueDiv.classList.add('withSlider');

  node.previousElementSibling.prepend(sliderContainer);


}

export{
  createSlider
};