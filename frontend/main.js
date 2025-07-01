//#1 ELEMENT SELECTORS
const beginBtn = document.getElementById('beginBtn');
const avatarImage = document.getElementById('avatarImage');
const introVideo = document.getElementById('introVideo');
const followUpVideo = document.getElementById('followUpVideo');
const headline = document.getElementById('headline');

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

//#4 Log follow up video ended (if you want to chain more)
followUpVideo.onended = () => {
  console.log("🎥 followUpVideo ended");
  // Here you can add what happens next
};