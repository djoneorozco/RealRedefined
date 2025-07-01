//#1 ELEMENT SELECTORS
const beginBtn = document.getElementById('beginBtn');
const avatarImage = document.getElementById('avatarImage');
const introVideo = document.getElementById('introVideo');
const followUpVideo = document.getElementById('followUpVideo');
const feelingsAudio = document.getElementById('feelingsAudio');
const surroundingAudio = document.getElementById('surroundingAudio');
const feelingOptions = document.getElementById('feelingOptions');
const surroundingOptions = document.getElementById('surroundingOptions');
const quizForm = document.getElementById('quizForm');
const headline = document.getElementById('headline');
const glassBox = document.getElementById('glassBox');
const resultEl = document.getElementById('result');
const schoolListEl = document.getElementById('schoolList');
const crimeInfoEl = document.getElementById('crimeInfo');
const zipEl = document.getElementById('zip');
const priceEl = document.getElementById('price');
const promptEl = document.getElementById('prompt');
const chartContainer = document.getElementById('chartContainer');
let chart;

//#2 LET'S BEGIN button
beginBtn.addEventListener('click', () => {
  console.log("👉 Begin button clicked");
  avatarImage.style.display = 'none';
  beginBtn.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();
});

//#3 When intro video ends, play follow up video
introVideo.onended = () => {
  console.log("🎥 introVideo ended");
  introVideo.style.display = 'none';
  headline.style.display = 'none';
  document.querySelectorAll('.left-panel p, .branding').forEach(el => el.style.display = 'none');

  followUpVideo.style.display = 'block';
  followUpVideo.play();
};

//#4 When follow up video ends, play audio and show feeling options
followUpVideo.onended = () => {
  console.log("🎥 followUpVideo ended");
  followUpVideo.style.display = 'none';
  feelingsAudio.play();
  feelingOptions.style.display = 'block';
};

//#5 Feeling image clicks → show surrounding options
document.querySelectorAll('#feelingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    console.log(`🖼️ Feeling selected: ${img.alt}`);
    surroundingAudio.play();
    feelingOptions.style.display = 'none';
    surroundingOptions.style.display = 'block';
  });
});

//#6 Surrounding image clicks → show quiz form
document.querySelectorAll('#surroundingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    console.log(`🖼️ Surrounding selected: ${img.alt}`);
    feelingsAudio.play();
    surroundingOptions.style.display = 'none';
    quizForm.style.display = 'block';
  });
});