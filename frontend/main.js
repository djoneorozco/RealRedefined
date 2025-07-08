// ==========================================================
// #1 ELEMENT SELECTORS
// ==========================================================
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
const headline = document.querySelector('.left-panel h1');
const paragraphs = document.querySelectorAll('.left-panel p, .branding');

const glassBox = document.getElementById('glassBox');
const resultEl = document.getElementById('result');
const schoolListEl = document.getElementById('schoolList');
const crimeInfoEl = document.getElementById('crimeInfo');
const zipEl = document.getElementById('zip');
const priceEl = document.getElementById('price');
const promptEl = document.getElementById('prompt');
const chartContainer = document.getElementById('chartContainer');
let chart;

// ==========================================================
// #2 LET'S BEGIN button
// ==========================================================
beginBtn.addEventListener('click', () => {
  console.log("👉 Begin button clicked");
  avatarImage.style.display = 'none';
  beginBtn.style.display = 'none';
  introVideo.style.display = 'block';
  introVideo.play();
});

// ==========================================================
// #3 When intro video ends, play follow up video
// ==========================================================
introVideo.onended = () => {
  console.log("🎥 introVideo ended");
  introVideo.style.display = 'none';
  headline.style.display = 'none';
  paragraphs.forEach(el => el.style.display = 'none');

  followUpVideo.style.display = 'block';
  followUpVideo.play();
};

// ==========================================================
// #4 When follow up video ends, show feeling options
// ==========================================================
followUpVideo.onended = () => {
  console.log("🎥 followUpVideo ended");
  followUpVideo.style.display = 'none';
  feelingsAudio.play();
  feelingOptions.style.display = 'block';
};

// ==========================================================
// #5 Feeling options → click moves to surrounding options
// ==========================================================
document.querySelectorAll('#feelingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    console.log("🖼️ Feeling image clicked");
    surroundingAudio.play();
    feelingOptions.style.display = 'none';
    surroundingOptions.style.display = 'block';
  });
});

// ==========================================================
// #6 Surrounding options → click moves to quiz form
// ==========================================================
document.querySelectorAll('#surroundingOptions .feeling-images img').forEach(img => {
  img.addEventListener('click', () => {
    console.log("🖼️ Surrounding image clicked");
    feelingsAudio.play();
    surroundingOptions.style.display = 'none';
    quizForm.style.display = 'block';
  });
});

// ==========================================================
// #7 Ask AI button
// ==========================================================
document.getElementById('btn-ask').onclick = async () => {
  const zip = zipEl.value.trim();
  const price = priceEl.value.trim();
  const prompt = promptEl.value.trim();

  console.log("🔍 Ask AI clicked:", { zip, price, prompt });

  if (!zip || !price || !prompt) {
    resultEl.textContent = '⚠️ Please fill out all three fields.';
    glassBox.classList.add('show');
    return;
  }

  // Start goodbye video immediately
  goodbyeVideo.style.display = 'block';
  goodbyeVideo.play();

  // Send request in parallel
  const request = fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zip, prompt, price })
  }).then(res => res.json());

  // Clear old data
  resultEl.textContent = '⏳ Waiting for AI...';
  glassBox.classList.remove('show');
  chartContainer.style.display = 'none';
  schoolListEl.innerHTML = '';
  crimeInfoEl.innerHTML = '';

  // When goodbye video ends, reveal the results
  goodbyeVideo.onended = async () => {
    console.log("🎥 goodbyeVideo ended");
    goodbyeVideo.style.display = 'none';

    try {
      const json = await request;
      if (json.error) throw new Error(json.error);

      console.log("✅ AI response:", json);
      resultEl.textContent = json.answer;

      // Chart
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

      // Schools
      if (json.schools && json.schools.length) {
        let html = '<h3>Nearby Schools</h3><ul>';
        json.schools.forEach(s => {
          html += `<li><strong>${s.name}</strong> — Grades: ${s.grades} (${s.type})</li>`;
        });
        html += '</ul>';
        schoolListEl.innerHTML = html;
      }

      // Crime
      if (json.crime) {
        let html = '<h3>Crime Risk</h3>';
        html += `<p><strong>Risk Level:</strong> ${json.crime.riskLevel}</p>`;
        html += `<p><strong>City:</strong> ${json.crime.city}</p>`;
        html += `<p><strong>Violent Crime Rate:</strong> ${json.crime.violentCrimeRate}</p>`;
        html += `<p><strong>Property Crime Rate:</strong> ${json.crime.propertyCrimeRate}</p>`;
        crimeInfoEl.innerHTML = html;
      }

      glassBox.classList.add('show');

    } catch (err) {
      console.error(err);
      resultEl.textContent = '❌ Request failed: ' + err.message;
      glassBox.classList.add('show');
    }
  };
};

// ==========================================================
// #8 🆕 Headshot Overlay Upload — ADD TO END
// ==========================================================
document.getElementById("btn-overlay").onclick = async () => {
  const propertyFile = document.getElementById("propertyFile").files[0];
  const headshotFile = document.getElementById("headshotFile").files[0];

  if (!propertyFile || !headshotFile) {
    alert("Both images are required!");
    return;
  }

  const formData = new FormData();
  formData.append("property", propertyFile);
  formData.append("headshot", headshotFile);

  const res = await fetch("/api/overlay", {
    method: "POST",
    body: formData
  });
  const json = await res.json();

  if (json.url) {
    document.getElementById("overlayResult").innerHTML = `<img src="${json.url}" style="max-width:100%"/>`;
  } else {
    document.getElementById("overlayResult").textContent = "❌ Overlay failed.";
  }
};
