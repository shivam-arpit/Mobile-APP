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

// --- Sample shop data ---
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
renderList();

// --- PWA Installation Handler ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button after 5 seconds
  setTimeout(showInstallPrompt, 5000);
});

function showInstallPrompt() {
  if (!deferredPrompt) return;
  
  const installBtn = document.createElement('button');
  installBtn.innerHTML = '📱 Install App';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #385f8c;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    cursor: pointer;
  `;
  
  installBtn.onclick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User installed the PWA');
    }
    
    deferredPrompt = null;
    installBtn.remove();
  };
  
  document.body.appendChild(installBtn);
}

// --- Service Worker registration ---
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('SW registered successfully'))
    .catch(e => console.warn('SW registration failed:', e));
}
