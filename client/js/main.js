const API_BASE = 'http://localhost:5001';

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  try {
    const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
    if (response.ok) { alert('✅ Product uploaded successfully!'); form.reset(); }
    else { const err = await response.text(); alert('❌ Upload failed: ' + err); }
  } catch (error) { alert('❌ Server error. Please check connection.'); }
});
