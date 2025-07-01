// 1) Select your elements
const introVideo = document.getElementById('introVideo');
const followUpVideo = document.getElementById('followUpVideo');

// 2) Start intro video on Begin click
beginBtn.addEventListener('click', () => {
  avatarImage.style.display = 'none';
  beginBtn.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();
});

// 3) When intro video ends, play follow-up
introVideo.onended = () => {
  introVideo.style.display = 'none';
  headline.style.display = 'none';
  document.querySelectorAll('.left-panel p, .branding').forEach(el => el.style.display = 'none');
  followUpVideo.style.display = 'block';
  followUpVideo.play();
};

// 4) When follow-up ends, show quiz flow
followUpVideo.onended = () => {
  followUpVideo.style.display = 'none';
  feelingsAudio.play();
  feelingOptions.style.display = 'block';
};