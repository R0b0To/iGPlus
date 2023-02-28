function addExtraButtons() {
  if (document.getElementById('raceReview')) {
    return;
  }

  try {
    const previousRaceBtn = document.querySelector('a.btn2.fill-w');
    previousRaceBtn.classList.remove('fill-w');
    previousRaceBtn.removeAttribute('style', ''); // let's drive with css

    const raceReviewBtn = document.createElement('a');
    raceReviewBtn.id = 'raceReview';
    raceReviewBtn.href = 'd=raceReview';
    raceReviewBtn.classList.add('btn4');
    raceReviewBtn.textContent = 'Race Review';

    previousRaceBtn.after(raceReviewBtn);
  } catch (err) {
    console.warn(err);
  }
}

addExtraButtons();
