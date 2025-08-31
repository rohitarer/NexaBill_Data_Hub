// client/js/main.js
const API_BASE = 'http://localhost:5001';

// simple inline status helper
function showStatus(msg, type = 'info') {
  let el = document.getElementById('status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'status';
    el.style.margin = '12px 0';
    el.style.padding = '10px 12px';
    el.style.borderRadius = '8px';
    el.style.fontSize = '14px';
    el.style.lineHeight = '1.3';
    el.style.border = '1px solid transparent';
    const form = document.getElementById('productForm');
    form.parentNode.insertBefore(el, form); // put above the form
  }
  const colors = {
    info:  ['#0b5cff20', '#0b5cff'],
    ok:    ['#22c55e20', '#16a34a'],
    error: ['#ef444420', '#b91c1c']
  };
  const [bg, border] = colors[type] || colors.info;
  el.style.background = bg;
  el.style.borderColor = border;
  el.style.color = border;
  el.textContent = msg;
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  // Basic client-side checks (avoid server roundtrip for obvious misses)
  if (!form.name.value.trim()) {
    showStatus('Please enter product name.', 'error');
    return;
  }
  if (!form.image.files || !form.image.files[0]) {
    showStatus('Please choose an image.', 'error');
    return;
  }

  const formData = new FormData(form);
  showStatus('Uploading… please wait.', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });

    // Always attempt to parse JSON for a clear message
    let data = null;
    try { data = await response.json(); } catch { /* fallback below */ }

    if (!response.ok || (data && data.ok === false)) {
      const msg =
        (data && (data.error || data.message)) ||
        `HTTP ${response.status}`;
      showStatus(`Upload failed: ${msg}`, 'error');
      return;
    }

    showStatus('✅ Product uploaded successfully!', 'ok');
    form.reset();

    // Optional: after a short delay, navigate to the list so the user sees it
    // setTimeout(() => { window.location.href = 'products.html'; }, 500);

  } catch (error) {
    showStatus('Server error: ' + error.message, 'error');
  }
});



// // client/js/main.js
// const API_BASE = 'http://localhost:5001';

// // simple inline status helper
// function showStatus(msg, type = 'info') {
//   let el = document.getElementById('status');
//   if (!el) {
//     el = document.createElement('div');
//     el.id = 'status';
//     el.style.margin = '12px 0';
//     el.style.padding = '10px 12px';
//     el.style.borderRadius = '8px';
//     el.style.fontSize = '14px';
//     el.style.lineHeight = '1.3';
//     el.style.border = '1px solid transparent';
//     const form = document.getElementById('productForm');
//     form.parentNode.insertBefore(el, form); // put above the form
//   }
//   const colors = {
//     info:  ['#0b5cff20', '#0b5cff'],
//     ok:    ['#22c55e20', '#16a34a'],
//     error: ['#ef444420', '#b91c1c']
//   };
//   const [bg, border] = colors[type] || colors.info;
//   el.style.background = bg;
//   el.style.borderColor = border;
//   el.style.color = border;
//   el.textContent = msg;
// }

// document.getElementById('productForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const form = e.target;
//   const formData = new FormData(form);

//   showStatus('Uploading… please wait.', 'info');

//   try {
//     const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
//     const text = await response.text();
//     let data;
//     try { data = JSON.parse(text); } catch { data = { error: text }; }

//     if (!response.ok) {
//       showStatus(`Upload failed (${response.status}): ${data?.error || 'Unknown error'}`, 'error');
//       return;
//     }

//     showStatus('Product uploaded successfully!', 'ok');
//     form.reset();
//   } catch (error) {
//     showStatus('Server error: ' + error.message, 'error');
//   }
// });



// const API_BASE = 'http://localhost:5001';

// document.getElementById('productForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const form = e.target;
//   const formData = new FormData(form);
//   try {
//     const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
//     if (response.ok) { alert('✅ Product uploaded successfully!'); form.reset(); }
//     else { const err = await response.text(); alert('❌ Upload failed: ' + err); }
//   } catch (error) { alert('❌ Server error. Please check connection.'); }
// });
