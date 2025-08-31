const API_BASE = 'http://localhost:5001';
const listEl = document.getElementById('productList');
const known = new Map(); // _id -> element
let loading = false;

function skeletonCard() {
  const wrap = document.createElement('div');
  wrap.className = 'product-card skeleton';
  wrap.innerHTML = `
    <div class="img"></div>
    <div class="meta">
      <div class="line w60"></div>
      <div class="line w40"></div>
      <div class="line w50"></div>
    </div>
  `;
  return wrap;
}

function productCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card fade-in';
  card.innerHTML = `
    <img loading="lazy" decoding="async"
         src="${API_BASE}/${p.image_path}" alt="${p.name}" />
    <div class="product-info">
      <h3>${p.name}</h3>
      <p><strong>Brand:</strong> ${p.brand ?? '-'}</p>
      <p><strong>MRP:</strong> ₹${Number(p.mrp || 0).toFixed(2)}</p>
      <p><strong>Weight:</strong> ${p.weight ?? '-'}</p>
      ${p.flavor ? `<p><strong>Flavor:</strong> ${p.flavor}</p>` : ''}
      <p><strong>GST:</strong> ${p.gst ?? 0}%</p>
    </div>
  `;
  return card;
}

async function fetchProducts(signal) {
  const res = await fetch(`${API_BASE}/api/products`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refreshOnce() {
  if (loading) return;
  loading = true;

  // show 3 skeletons only if first load and empty
  if (known.size === 0 && listEl.children.length === 0) {
    for (let i = 0; i < 3; i++) listEl.appendChild(skeletonCard());
  }

  try {
    const controller = new AbortController();
    const data = await fetchProducts(controller.signal);

    // Build a document fragment only with NEW items
    const frag = document.createDocumentFragment();
    for (const p of data) {
      const id = p._id || `${p.name}-${p.image_path}`;
      if (known.has(id)) continue; // already on screen
      const el = productCard(p);
      known.set(id, el);
      frag.appendChild(el);
    }

    // Remove skeletons once we have data
    if (known.size > 0) {
      [...listEl.querySelectorAll('.skeleton')].forEach(n => n.remove());
    }

    // Append without clearing (prevents flicker)
    if (frag.childNodes.length) listEl.appendChild(frag);

  } catch (e) {
    // Optional: lightweight inline error (no alert)
    console.warn('Products refresh failed:', e.message);
  } finally {
    loading = false;
  }
}

// Initial load
refreshOnce();

// Optional: tiny poll (every 6s) without flicker
setInterval(refreshOnce, 6000);
