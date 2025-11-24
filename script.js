// Debug info
console.log('PWA Script loaded');
console.log('Window location:', window.location.href);

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

// --- PWA Installation ---
let deferredPrompt;
const installButton = document.getElementById('installButton');

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎉 beforeinstallprompt event fired!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  installButton.style.display = 'block';
  
  // Log for debugging
  console.log('PWA is installable! Install button shown.');
});

// Install button click handler
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) {
    console.log('No deferred prompt available');
    return;
  }
  
  console.log('Showing install prompt...');
  deferredPrompt.prompt();
  
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response: ${outcome}`);
  
  deferredPrompt = null;
  installButton.style.display = 'none';
});

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('🏆 PWA was installed successfully!');
  installButton.style.display = 'none';
  deferredPrompt = null;
});

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    const swUrl = 'serviece-worker.js';
    console.log('Registering Service Worker:', swUrl);
    
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Check if controlled
        if (navigator.serviceWorker.controller) {
          console.log('✅ Page is controlled by Service Worker');
        } else {
          console.log('❌ Page is not controlled by Service Worker');
        }
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
} else {
  console.log('❌ Service Worker not supported in this browser');
}

// Check manifest
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  console.log('✅ Manifest found:', manifestLink.href);
} else {
  console.log('❌ No manifest found');
}

