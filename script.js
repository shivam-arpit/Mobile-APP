// --- Simple navigation ---
document.querySelectorAll('.tile').forEach(t=>{
  t.addEventListener('click', ()=>{
    const s = t.getAttribute('data-screen');
    showScreen(s === 'shop-dashboard' ? 'shop-dashboard' : 'home');
  });
});
document.getElementById('backBtn').addEventListener('click',()=>showScreen('home'));

function showScreen(id){
  document.querySelectorAll('.screen').forEach(el=>el.style.display='none');
  document.getElementById(id).style.display='block';
}

// --- Sample shop data (we will use your uploaded screenshots visually)
const shops = [
  {
    id: 'SH-398',
    name: 'G A Supermaket',
    owner: 'Ravi',
    phone: '8308831439',
    pincode: '411045',
    address: '3 Baner road',
    lastVisited: '17 Nov 2025 @ 04:47 PM'
  },
  {
    id: 'SH-397',
    name: 'vijay sales',
    owner: 'rahul',
    phone: '7276791913',
    pincode: '440024',
    address: 'nagpur',
    lastVisited: '19 Nov 2025 @ 12:35 PM'
  },
  {
    id: 'SH-396',
    name: 'rahul',
    owner: 'rahul',
    phone: 'N/A',
    pincode: 'N/A',
    address: 'N/A',
    lastVisited: '—'
  }
];

function renderList(filter=''){
  const container = document.getElementById('shopList');
  container.innerHTML = '';
  const f = filter.trim().toLowerCase();
  shops.forEach(s=>{
    if(f && !(s.name.toLowerCase().includes(f) || s.owner.toLowerCase().includes(f) || s.id.toLowerCase().includes(f))) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="tag">${s.id}</div>
      <div class="row">
        <div style="flex:0 0 36px;opacity:0.9">🏪</div>
        <div style="flex:1">
          <div class="meta">
            <div>
              <div class="label">Shop Name</div>
              <div class="value">${s.name}</div>
            </div>
            <div>
              <div class="label">Owner Name</div>
              <div class="value">${s.owner}</div>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="meta">
            <div>
              <div class="label">Contact Number</div>
              <div class="value">${s.phone}</div>
            </div>
            <div>
              <div class="label">PinCode</div>
              <div class="value">${s.pincode}</div>
            </div>
          </div>

          <div style="height:8px"></div>
          <div class="label">Shop Address</div>
          <div class="value">${s.address}</div>

          <div style="height:10px"></div>
          <div class="small">Last Visited At<br>${s.lastVisited}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

document.getElementById('searchInput').addEventListener('input', (e)=> renderList(e.target.value));
// initial render
renderList();

// --- Service Worker registration for PWA offline caching ---
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').then(()=>{
    console.log('SW registered');
  }).catch(e=>console.warn('SW failed',e));
}