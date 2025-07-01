// ELEMENT SELECTORS
const beginBtn = document.getElementById('beginBtn');
const avatarImage = document.getElementById('avatarImage');
const introVideo = document.getElementById('introVideo');
const followUpVideo = document.getElementById('followUpVideo');
const goodbyeVideo = document.getElementById('goodbyeVideo');
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

// LET'S BEGIN button
beginBtn.addEventListener('click', () => {
  avatarImage.style.display = 'none';
  beginBtn.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();
});

// When intro video ends, play follow up video
introVideo.onended = () => {
  introVideo.style.display = 'none';
  headline.style.display = 'none';
  document.querySelectorAll('.left-panel p, .branding').forEach(el => el.style.display = 'none');
  followUpVideo.style.display = 'block';
  followUpVideo.play();
};

followUpVideo.onended = () => {
  followUpVideo.style.display = 'none';
  feelingsAudio.play();
  feelingOptions.style.display = 'block';
};

// Feeling options
document.querySelectorAll('#feelingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    surroundingAudio.play();
    feelingOptions.style.display = 'none';
    surroundingOptions.style.display = 'block';
  });
});

// Surrounding options
document.querySelectorAll('#surroundingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    feelingsAudio.play();
    surroundingOptions.style.display = 'none';
    quizForm.style.display = 'block';
  });
});

// Ask AI button
document.getElementById('btn-ask').onclick = async () => {
  const zip = zipEl.value.trim();
  const price = priceEl.value.trim();
  const promptFile = promptEl.files[0];

  if (!zip || !price || !promptFile) {
    resultEl.textContent = 'Please fill out all fields and upload an image.';
    glassBox.classList.add('show');
    return;
  }

  resultEl.textContent = '⏳ Asking AI…';
  glassBox.classList.remove('show');

  const formData = new FormData();
  formData.append('zip', zip);
  formData.append('price', price);
  formData.append('file', promptFile); // Ensure the backend expects 'file'

  console.log('Sending FormData:', zip, price, promptFile);

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();

    chartContainer.style.display = 'none';
    schoolListEl.innerHTML = '';
    crimeInfoEl.innerHTML = '';
    goodbyeVideo.style.display = 'block';
    goodbyeVideo.play();

    goodbyeVideo.onended = () => {
      goodbyeVideo.style.display = 'none';

      if (json.error) {
        throw new Error(json.error);
      }

      resultEl.textContent = json.answer;

      const medianValue = json.prices?.[0]?.value || 0;
      const offeredValue = json.prices?.[1]?.value || 0;

      const ctx = document.getElementById('priceChart');
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Median Price', 'Your Price'],
          datasets: [{
            label: 'Sale Price Comparison',
            data: [medianValue, offeredValue],
            backgroundColor: ['#36A2EB', '#FF6384'],
            borderRadius: 5
          }]
        },
        options: {
          animation: {
            duration: 1200,
            easing: 'easeOutBounce'
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      chartContainer.style.display = 'block';

      if (json.schools && json.schools.length) {
        let html = '<h3>Nearby Schools</h3><ul>';
        json.schools.forEach(s => {
          html += `<li><strong>${s.name}</strong> — Grades: ${s.grades} (${s.type})</li>`;
        });
        html += '</ul>';
        schoolListEl.innerHTML = html;
      }

      if (json.crime) {
        let html = '<h3>Crime Risk</h3>';
        html += `<p><strong>Risk Level:</strong> ${json.crime.riskLevel}</p>`;
        html += `<p><strong>City:</strong> ${json.crime.city}</p>`;
        html += `<p><strong>Violent Crime Rate:</strong> ${json.crime.violentCrimeRate}</p>`;
        html += `<p><strong>Property Crime Rate:</strong> ${json.crime.propertyCrimeRate}</p>`;
        crimeInfoEl.innerHTML = html;
      }

      glassBox.classList.add('show');
    };

  } catch (err) {
    console.error(err);
    resultEl.textContent = 'Request failed: ' + err.message;
    glassBox.classList.add('show');
  }
};