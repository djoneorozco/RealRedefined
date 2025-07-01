const beginBtn = document.getElementById('beginBtn');
const avatarImage = document.getElementById('avatarImage');
const introVideo = document.getElementById('introVideo');
const followUpVideo = document.getElementById('followUpVideo');
const goodbyeVideo = document.getElementById('goodbyeVideo');
const feelingOptions = document.getElementById('feelingOptions');
const surroundingOptions = document.getElementById('surroundingOptions');
const quizForm = document.getElementById('quizForm');
const zipEl = document.getElementById('zip');
const priceEl = document.getElementById('price');
const btnAsk = document.getElementById('btn-ask');
const glassBox = document.getElementById('glassBox');
const resultEl = document.getElementById('result');
const chartContainer = document.getElementById('chartContainer');
let chart;

beginBtn.onclick = () => {
  avatarImage.style.display = 'none';
  beginBtn.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();
};

introVideo.onended = () => {
  introVideo.style.display = 'none';
  document.getElementById('headline').style.display = 'none';
  followUpVideo.style.display = 'block';
  followUpVideo.play();
};

followUpVideo.onended = () => {
  followUpVideo.style.display = 'none';
  feelingOptions.style.display = 'block';
};

document.querySelectorAll('#feelingOptions img').forEach(img => {
  img.onclick = () => {
    feelingOptions.style.display = 'none';
    surroundingOptions.style.display = 'block';
  };
});
document.querySelectorAll('#surroundingOptions img').forEach(img => {
  img.onclick = () => {
    surroundingOptions.style.display = 'none';
    quizForm.style.display = 'block';
  };
});

btnAsk.onclick = async () => {
  const zip = zipEl.value.trim();
  const price = priceEl.value.trim();
  if (!zip || !price) {
    alert('Please fill in ZIP and Price.');
    return;
  }
  resultEl.textContent = '⏳ Asking AI…';
  glassBox.classList.remove('show');

  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zip, prompt: 'N/A', price })
  });
  const json = await res.json();

  goodbyeVideo.style.display = 'block';
  goodbyeVideo.play();

  goodbyeVideo.onended = () => {
    resultEl.textContent = json.answer;
    chartContainer.style.display = 'block';
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('priceChart'), {
      type: 'bar',
      data: {
        labels: ['Median', 'Your Price'],
        datasets: [{
          label: 'Price Comparison',
          data: [json.prices[0].value, json.prices[1].value],
          backgroundColor: ['#36A2EB', '#FF6384']
        }]
      }
    });
    glassBox.classList.add('show');
  };
};