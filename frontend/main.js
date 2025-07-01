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
  formData.append('file', promptFile);

  console.log('Sending FormData:', zip, price, promptFile);

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      body: formData
    });

    const text = await res.text();
    console.log('Raw response:', text);

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Server did not return valid JSON: ' + text);
    }

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