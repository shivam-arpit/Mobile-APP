// script.js - Final Complete Code

console.log('PWA Script loaded');
console.log('Window location:', window.location.href);

// === ALL VARIABLES TOGETHER AT THE TOP ===
let currentDropdown = null;
let currentFilter = 'all';
let currentSort = 'newest';
let leadToDelete = null;
let mediaRecorder;
let audioChunks = [];
let recordingTimer;
let recordingStartTime;
let isRecording = false;
let leads = JSON.parse(localStorage.getItem('leads')) || [];

// NEW VARIABLES FOR OPPORTUNITIES AND PROPOSALS
let opportunities = JSON.parse(localStorage.getItem('opportunities')) || [];
let proposals = JSON.parse(localStorage.getItem('proposals')) || [];
let currentOppFilter = 'all';
let currentProposalFilter = 'all';

let dropdownOptions = {
  client: ['Client 1', 'Client 2'],
  industry: ['Retail', 'Manufacturing', 'Technology', 'Healthcare'],
  source: ['Website', 'Referral', 'Social Media', 'Cold Call'],
  mmProducts: ['Product X', 'Product Y', 'Product Z'],
  brand: ['Brand A', 'Brand B', 'Brand C'],
  tag: ['Hot', 'Warm', 'Cold', 'Follow Up'],
  organizationAgency: ['Organization 1', 'Organization 2'],
  orgAgencyContact: ['Contact 1', 'Contact 2'],
  clientContact: ['Client Contact 1', 'Client Contact 2'],
  clientProduct: ['Product A', 'Product B'],
  sendNotification: ['Immediate', 'Daily Digest', 'Weekly Digest', 'None']
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSampleData();
});

// Initialize the application
function initializeApp() {
    initializeDropdowns();
    renderList();
    renderLeadsList();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Registration Failed'));
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Navigation tiles
    document.querySelectorAll('.tile').forEach(tile => {
        tile.addEventListener('click', function() {
            const screen = this.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.getAttribute('data-screen');
            showScreen(screen);
        });
    });

    // Filter buttons in shop dashboard
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterLeads(filter);
        });
    });

    // New lead button
    document.getElementById('newLeadBtn').addEventListener('click', function() {
        showCreateLeadForm();
    });

    // New opportunity button
    document.getElementById('newOpportunityBtn').addEventListener('click', function() {
        showCreateOpportunityForm();
    });

    // Refresh proposals button
    document.getElementById('refreshProposalsBtn').addEventListener('click', function() {
        updateProposalsFromOpportunities();
        showNotification('Proposals refreshed from opportunities', 'success');
    });

    // Floating add button
    document.getElementById('floatingNewLeadBtn').addEventListener('click', function() {
        showCreateLeadForm();
    });

    // Voice recording functionality
    initializeVoiceRecording();

    // Location functionality
    setupLocation();

    // Search functionality
    setupSearch();

    // Install PWA button
    document.getElementById('installButton').addEventListener('click', installPWA);

    // Modal event listeners
    document.getElementById('addNewModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Search inputs
    document.getElementById('searchInput')?.addEventListener('input', (e) => renderList(e.target.value));
    document.getElementById('leadSearchInput')?.addEventListener('input', (e) => renderLeadsList(e.target.value));
    document.getElementById('shopSearchInput')?.addEventListener('input', (e) => filterShopList(e.target.value));
    document.getElementById('opportunitySearchInput')?.addEventListener('input', (e) => renderOpportunitiesList(e.target.value));
    document.getElementById('proposalSearchInput')?.addEventListener('input', (e) => renderProposalsList(e.target.value));

    // Sort functionality
    const sortSelect = document.getElementById('leadSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            renderLeadsList();
        });
    }

    // Proposal status filter
    const proposalStatusFilter = document.getElementById('proposalStatusFilter');
    if (proposalStatusFilter) {
        proposalStatusFilter.addEventListener('change', function() {
            currentProposalFilter = this.value;
            renderProposalsList();
        });
    }

    // Opportunity form submission
    const opportunityForm = document.querySelector('#createOpportunityForm .lead-form');
    if (opportunityForm) {
        opportunityForm.onsubmit = function(e) {
            e.preventDefault();
            saveOpportunity();
        };
    }

    // Back buttons for opportunity forms
    document.querySelectorAll('#createOpportunityForm .back-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.getAttribute('data-screen');
            showScreen(screen);
        });
    });
}

// Initialize dropdowns
function initializeDropdowns() {
  Object.keys(dropdownOptions).forEach(dropdownId => {
    const select = document.getElementById(dropdownId);
    if (select) {
      const firstOption = select.options[0];
      select.innerHTML = '';
      if (firstOption) select.appendChild(firstOption);
      
      const savedOptions = JSON.parse(localStorage.getItem(`options_${dropdownId}`)) || dropdownOptions[dropdownId];
      savedOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.toLowerCase().replace(/\s+/g, '-');
        optionElement.textContent = option;
        select.appendChild(optionElement);
      });
      
      const addNewOption = document.createElement('option');
      addNewOption.value = 'add-new';
      addNewOption.textContent = '+ Add New...';
      addNewOption.className = 'add-new-option';
      select.appendChild(addNewOption);
      
      select.addEventListener('change', function() {
        if (this.value === 'add-new') {
          openAddNewModal(dropdownId);
          this.value = ''; 
        }
      });
    }
  });
}

function openAddNewModal(dropdownId) {
  currentDropdown = dropdownId;
  const modal = document.getElementById('addNewModal');
  const title = document.getElementById('modalTitle');
  const input = document.getElementById('modalInput');
  
  const fieldNames = {
    client: 'Client',
    industry: 'Industry', 
    source: 'Source',
    mmProducts: 'MM Product',
    brand: 'Brand',
    tag: 'Tag',
    organizationAgency: 'Organization/Agency',
    orgAgencyContact: 'Organization/Agency Contact',
    clientContact: 'Client Contact',
    clientProduct: 'Client Product',
    sendNotification: 'Send Notification'
  };
  
  title.textContent = `Add New ${fieldNames[dropdownId] || 'Option'}`;
  input.placeholder = `Enter new ${fieldNames[dropdownId]?.toLowerCase() || 'option'}...`;
  input.value = '';
  
  modal.style.display = 'flex';
  input.focus();
}

function closeModal() {
  document.getElementById('addNewModal').style.display = 'none';
  currentDropdown = null;
}

function saveNewOption() {
  const input = document.getElementById('modalInput');
  const newValue = input.value.trim();
  
  if (!newValue) {
    alert('Please enter a value');
    return;
  }
  
  if (!currentDropdown) return;
  
  const savedOptions = JSON.parse(localStorage.getItem(`options_${currentDropdown}`)) || dropdownOptions[currentDropdown];
  
  if (!savedOptions.includes(newValue)) {
    savedOptions.push(newValue);
    localStorage.setItem(`options_${currentDropdown}`, JSON.stringify(savedOptions));
  
    const select = document.getElementById(currentDropdown);
    if (select) {
      const addNewOption = select.querySelector('.add-new-option');
      
      const newOption = document.createElement('option');
      newOption.value = newValue.toLowerCase().replace(/\s+/g, '-');
      newOption.textContent = newValue;
      select.insertBefore(newOption, addNewOption);
      
      select.value = newOption.value;
    }
  }
  
  closeModal();
}

// Dashboard functions
function initializeDashboard() {
  updateDashboardStats();
}

function updateDashboardStats() {
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new-lead').length;
  const convertedLeads = leads.filter(lead => lead.status === 'won').length;
  const hotLeads = leads.filter(lead => 
    lead.tags && lead.tags.includes('hot')
  ).length;

  const totalEl = document.getElementById('totalLeads');
  const newEl = document.getElementById('newLeads');
  const convertedEl = document.getElementById('convertedLeads');
  const hotEl = document.getElementById('hotLeads');
  
  if (totalEl) totalEl.textContent = totalLeads;
  if (newEl) newEl.textContent = newLeads;
  if (convertedEl) convertedEl.textContent = convertedLeads;
  if (hotEl) hotEl.textContent = hotLeads;
}

function deleteLead(leadId) {
  leadToDelete = leadId;
  const lead = leads.find(l => l.id === leadId);
  
  if (lead) {
    document.getElementById('deleteLeadPreview').innerHTML = `
      <strong>${lead.name}</strong><br>
      <small>Status: ${lead.status} | Created: ${lead.createdAt}</small>
    `;
    document.getElementById('deleteModal').style.display = 'flex';
  }
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  leadToDelete = null;
}

function confirmDeleteLead() {
  if (leadToDelete) {
    leads = leads.filter(lead => lead.id !== leadToDelete);
    localStorage.setItem('leads', JSON.stringify(leads));
    
    updateDashboardStats();
    renderLeadsList();
    closeDeleteModal();
    
    showNotification('Lead deleted successfully', 'success');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Voice Recording Functions
function initializeVoiceRecording() {
  const startBtn = document.getElementById('startRecord');
  const cancelBtn = document.getElementById('cancelRecord');
  const sendBtn = document.getElementById('sendRecord');
  const deleteBtn = document.getElementById('deleteRecording');
  
  let pressTimer;
  let isLongPress = false;
  const longPressDuration = 500;

  if (startBtn) {
    startBtn.addEventListener('mousedown', startPress);
    startBtn.addEventListener('touchstart', startPress);
    
    startBtn.addEventListener('mouseup', cancelPress);
    startBtn.addEventListener('touchend', cancelPress);
    startBtn.addEventListener('mouseleave', cancelPress);
    
    cancelBtn.addEventListener('click', cancelRecording);
    sendBtn.addEventListener('click', sendRecording);
    deleteBtn.addEventListener('click', deleteRecording);
  }
}

function startPress(e) {
  e.preventDefault();
  const startBtn = document.getElementById('startRecord');
  
  startBtn.classList.add('recording-lock');
  
  pressTimer = setTimeout(() => {
    isLongPress = true;
    startRecording();
  }, 500);
}

function cancelPress(e) {
  e.preventDefault();
  const startBtn = document.getElementById('startRecord');
  
  startBtn.classList.remove('recording-lock');
  
  if (pressTimer) {
    clearTimeout(pressTimer);
  }
  
  if (!isLongPress && isRecording) {
    cancelRecording();
  }
  
  isLongPress = false;
}

async function startRecording() {
  try {
    console.log('Starting recording...');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    });
    
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audioPlayback = document.getElementById('audioPlayback');
        audioPlayback.src = audioUrl;
        window.currentAudioBlob = audioBlob;
        showPlaybackState();
      }
      
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    isRecording = true;
    showRecordingState();
    startRecordingTimer();
    
    console.log('Recording started...');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Unable to access microphone. Please check permissions.');
    resetRecordingUI();
  }
}

function cancelRecording() {
  console.log('Canceling recording...');
  
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    resetRecordingUI();
    console.log('Recording canceled');
  }
}

function sendRecording() {
  console.log('Sending recording...');
  
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    stopRecordingTimer();
    console.log('Recording sent');
  }
}

function deleteRecording() {
  console.log('Deleting recording...');
  
  const audioPlayback = document.getElementById('audioPlayback');
  audioPlayback.src = '';
  window.currentAudioBlob = null;
  showReadyState();
  console.log('Recording deleted');
}

function showRecordingState() {
  document.getElementById('readyState').style.display = 'none';
  document.getElementById('recordingState').style.display = 'block';
  document.getElementById('playbackState').style.display = 'none';
}

function showReadyState() {
  document.getElementById('readyState').style.display = 'block';
  document.getElementById('recordingState').style.display = 'none';
  document.getElementById('playbackState').style.display = 'none';
}

function showPlaybackState() {
  document.getElementById('readyState').style.display = 'none';
  document.getElementById('recordingState').style.display = 'none';
  document.getElementById('playbackState').style.display = 'block';
}

function resetRecordingUI() {
  document.getElementById('startRecord').classList.remove('recording-lock');
  showReadyState();
  stopRecordingTimer();
}

function startRecordingTimer() {
  recordingStartTime = Date.now();
  recordingTimer = setInterval(updateRecordingTimer, 1000);
}

function stopRecordingTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  document.getElementById('recordingTimer').textContent = '00:00';
}

function updateRecordingTimer() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  
  document.getElementById('recordingTimer').textContent = `${minutes}:${seconds}`;

  if (elapsed >= 180) {
    sendRecording();
  }
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Screen Navigation
function showScreen(id) {
  console.log('Showing screen:', id);
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show target screen
  const targetScreen = document.getElementById(id);
  if (targetScreen) {
    targetScreen.style.display = 'block';
  } else {
    console.error('Screen not found:', id);
    return;
  }
  
  // Update current screen
  currentScreen = id;

  // Load screen-specific data
  switch(id) {
    case 'shop-dashboard':
      updateDashboardStats();
      renderShopList();
      break;
    case 'lead-management':
      document.getElementById('createLeadForm').style.display = 'none';
      document.getElementById('leadsList').style.display = 'block';
      initializeDashboard();
      renderLeadsList();
      break;
    case 'opportunity-management':
      document.getElementById('createOpportunityForm').style.display = 'none';
      initializeOpportunityManagement();
      break;
    case 'proposal-management':
      initializeProposalManagement();
      break;
  }
}

function showCreateLeadForm() {
  console.log('Showing create lead form');
  document.getElementById('createLeadForm').style.display = 'block';
  document.getElementById('leadsList').style.display = 'none';
  
  setTimeout(() => {
    initializeDropdowns();
    initializeVoiceRecording();
  }, 100);
}

// Lead Management Functions
async function saveLead() {
  console.log('Saving lead...');
  
  let voiceNoteData = null;
  if (window.currentAudioBlob) {
    try {
      voiceNoteData = await blobToBase64(window.currentAudioBlob);
    } catch (error) {
      console.error('Error converting voice note:', error);
    }
  }
  
  const leadData = {
    id: 'LD-' + Date.now(),
    name: document.getElementById('leadName').value,
    description: document.getElementById('description').value,
    mmProducts: document.getElementById('mmProducts').value,
    tag: document.getElementById('tag').value,
    assignTo: document.getElementById('assignTo').value,
    client: document.getElementById('client').value,
    clientProduct: document.getElementById('clientProduct').value,
    brand: document.getElementById('brand').value,
    industry: document.getElementById('industry').value,
    organizationAgency: document.getElementById('organizationAgency').value,
    orgAgencyContact: document.getElementById('orgAgencyContact').value,
    primaryContact: document.querySelector('input[name="primaryContact"]:checked').value,
    clientContact: document.getElementById('clientContact').value,
    rollingMonth: document.getElementById('rollingMonth').value,
    source: document.getElementById('source').value,
    mmDivision: document.getElementById('mmDivision').value,
    subDivision: document.getElementById('subDivision').value,
    region: document.getElementById('region').value,
    status: document.getElementById('status').value,
    sendNotification: document.getElementById('sendNotification').value,
    voiceNote: voiceNoteData,
    voiceNoteTimestamp: voiceNoteData ? new Date().toISOString() : null,
    createdAt: new Date().toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  if (!leadData.name || !leadData.mmDivision || !leadData.region || !leadData.subDivision || !leadData.assignTo || !leadData.status) {
    alert('Please fill all required fields (*)');
    return;
  }

  leads.push(leadData);
  localStorage.setItem('leads', JSON.stringify(leads));
  
  document.querySelector('.lead-form').reset();
  deleteRecording(); 
  showScreen('lead-management');
  showNotification('Lead created successfully!', 'success');
}

function renderLeadsList(filter = '') {
  const container = document.getElementById('leadsList');
  container.innerHTML = '';
  
  let filteredLeads = [...leads];
  
  if (filter.trim()) {
    const f = filter.trim().toLowerCase();
    filteredLeads = filteredLeads.filter(lead => 
      !f || 
      lead.name.toLowerCase().includes(f) || 
      lead.mmDivision.toLowerCase().includes(f) ||
      lead.status.toLowerCase().includes(f) ||
      lead.client?.toLowerCase().includes(f) ||
      lead.industry?.toLowerCase().includes(f) ||
      lead.assignTo?.toLowerCase().includes(f)
    );
  }

  if (currentFilter !== 'all') {
    if (currentFilter === 'hot') {
      filteredLeads = filteredLeads.filter(lead => 
        lead.tags && lead.tags.includes('hot')
      );
    } else {
      filteredLeads = filteredLeads.filter(lead => lead.status === currentFilter);
    }
  }
  
  filteredLeads.sort((a, b) => {
    switch (currentSort) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'value':
        return (b.leadValue || 0) - (a.leadValue || 0);
      case 'priority':
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  });
  
  updateDashboardStats();
  
  if (filteredLeads.length === 0) {
    if (leads.length === 0 && !filter.trim()) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div style="font-size:18px; font-weight:600; margin-bottom:8px; color:#333;">No Leads Yet</div>
          <div style="margin-bottom:24px; font-size:14px;">Get started by creating your first lead</div>
          <button class="btn btn-primary" onclick="showCreateLeadForm()" style="padding:12px 24px;">
            <span style="font-size:16px; margin-right:8px;">+</span>
            Create First Lead
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div style="font-size:18px; font-weight:600; margin-bottom:8px; color:#333;">No leads found</div>
          <div style="margin-bottom:24px; font-size:14px;">Try adjusting your search terms</div>
        </div>
      `;
    }
    return;
  }

  filteredLeads.forEach(lead => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.onclick = () => showLeadDetail(lead.id); 
    
    const statusColors = {
      'new-lead': { bg: '#e8f5e8', color: '#2e7d32' },
      'contacted': { bg: '#e3f2fd', color: '#1565c0' },
      'qualified': { bg: '#fff3e0', color: '#ef6c00' },
      'proposal-sent': { bg: '#f3e5f5', color: '#7b1fa2' },
      'negotiation': { bg: '#e0f2f1', color: '#00796b' },
      'won': { bg: '#e8f5e8', color: '#2e7d32' },
      'lost': { bg: '#ffebee', color: '#c62828' }
    };
    
    const statusStyle = statusColors[lead.status] || statusColors['new-lead'];
    const voiceNoteIndicator = lead.voiceNote ? '<span class="voice-note-indicator">🎤</span>' : '';
    
    card.innerHTML = `
      <div class="lead-actions">
        <button class="action-btn btn-edit" onclick="event.stopPropagation(); editLead('${lead.id}')" title="Edit Lead">
          ✏️
        </button>
        <button class="action-btn btn-delete" onclick="event.stopPropagation(); deleteLead('${lead.id}')" title="Delete Lead">
          🗑️
        </button>
      </div>
      
      <div class="lead-header">
        <div class="lead-name">${lead.name} ${voiceNoteIndicator}</div>
        <div class="lead-status" style="background:${statusStyle.bg};color:${statusStyle.color}">
          ${lead.status.replace('-', ' ').toUpperCase()}
        </div>
      </div>
      <div class="lead-meta">
        <div class="lead-meta-item">
          <div class="lead-meta-label">Division</div>
          <div class="lead-meta-value">${lead.mmDivision}</div>
        </div>
        <div class="lead-meta-item">
          <div class="lead-meta-label">Region</div>
          <div class="lead-meta-value">${lead.region}</div>
        </div>
        <div class="lead-meta-item">
          <div class="lead-meta-label">Assigned To</div>
          <div class="lead-meta-value">${lead.assignTo}</div>
        </div>
        <div class="lead-meta-item">
          <div class="lead-meta-label">Status</div>
          <div class="lead-meta-value">${lead.status.replace('-', ' ').toUpperCase()}</div>
        </div>
      </div>
      ${lead.client ? `
        <div class="lead-meta">
          <div class="lead-meta-item">
            <div class="lead-meta-label">Client</div>
            <div class="lead-meta-value">${lead.client}</div>
          </div>
          <div class="lead-meta-item">
            <div class="lead-meta-label">Industry</div>
            <div class="lead-meta-value">${lead.industry || 'N/A'}</div>
          </div>
        </div>
      ` : ''}
      ${lead.description ? `
        <div style="margin-top:12px;">
          <div class="lead-meta-label">Description</div>
          <div class="lead-meta-value">${lead.description}</div>
        </div>
      ` : ''}
      ${lead.voiceNote ? `
  <div class="lead-voice-note">
    <audio controls class="audio-player">
      <source src="${lead.voiceNote}" type="audio/webm">
      Your browser does not support the audio element.
    </audio>
  </div>
` : ''}
      <div style="margin-top:12px; font-size:12px; color:var(--muted);">
        Created: ${lead.createdAt}
        ${lead.updatedAt ? `<br>Updated: ${lead.updatedAt}` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// Shop List Functions
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

function renderList(filter = '') {
  const container = document.getElementById('shopList');
  container.innerHTML = '';
  const f = filter.trim().toLowerCase();
  shops.forEach(s => {
    if (f && !(s.name.toLowerCase().includes(f) || s.owner.toLowerCase().includes(f) || s.id.toLowerCase().includes(f))) return;
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

function renderShopList() {
  renderList();
}

function filterShopList(searchTerm) {
  renderList(searchTerm);
}

function filterLeads(filter) {
  currentFilter = filter;
  renderLeadsList();
}

// PWA Installation
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎉 beforeinstallprompt event fired!');
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'block';
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    deferredPrompt = null;
  });
}

window.addEventListener('appinstalled', (evt) => {
  installButton.style.display = 'none';
  deferredPrompt = null;
});

// Location Setup
function setupLocation() {
    const mapBtn = document.getElementById('mapBtn');
    const coordsInput = document.getElementById('coords');
    const locationStatus = document.getElementById('locationStatus');

    if (mapBtn) {
        mapBtn.addEventListener('click', getLocation);
    }

    function getLocation() {
        if (!navigator.geolocation) {
            locationStatus.textContent = 'Geolocation is not supported by this browser.';
            return;
        }

        locationStatus.textContent = 'Getting location...';
        mapBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                coordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                locationStatus.textContent = 'Location acquired successfully!';
                mapBtn.disabled = false;
            },
            error => {
                let errorMessage = 'Unable to retrieve your location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'User denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'The request to get user location timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
                locationStatus.textContent = errorMessage;
                mapBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }
}

// Search Setup
function setupSearch() {
    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Shop dashboard search
    const shopSearchInput = document.getElementById('shopSearchInput');
    if (shopSearchInput) {
        shopSearchInput.addEventListener('input', debounce(() => {
            filterShopList(shopSearchInput.value);
        }, 300));
    }

    // Lead management search
    const leadSearchInput = document.getElementById('leadSearchInput');
    if (leadSearchInput) {
        leadSearchInput.addEventListener('input', debounce(() => {
            renderLeadsList(leadSearchInput.value);
        }, 300));
    }

    // Opportunity search
    const opportunitySearchInput = document.getElementById('opportunitySearchInput');
    if (opportunitySearchInput) {
        opportunitySearchInput.addEventListener('input', debounce(() => {
            renderOpportunitiesList(opportunitySearchInput.value);
        }, 300));
    }

    // Proposal search
    const proposalSearchInput = document.getElementById('proposalSearchInput');
    if (proposalSearchInput) {
        proposalSearchInput.addEventListener('input', debounce(() => {
            renderProposalsList(proposalSearchInput.value);
        }, 300));
    }
}

// Load sample data for demonstration
function loadSampleData() {
    // Sample leads
    if (leads.length === 0) {
        leads = [
            {
                id: 'LD-1',
                name: 'Tech Solutions Inc.',
                description: 'YuktaMedia',
                status: 'new-lead',
                tag: 'hot',
                assignTo: 'shivam-arpit',
                mmDivision: 'Junction K',
                region: 'Ahmedabad',
                subDivision: 'na',
                client: 'Tech Solutions Inc.',
                industry: 'Technology',
                source: 'Website',
                createdAt: new Date('2024-01-15').toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }
        ];
        localStorage.setItem('leads', JSON.stringify(leads));
    }

    // Sample opportunities
    if (opportunities.length === 0) {
        opportunities = [
            {
                id: 'OPP-1',
                name: 'YuktaMedia',
                relatedLead: 'LD-1',
                expectedValue: 50000,
                probability: 75,
                stage: 'proposal',
                closeDate: '2024-02-28',
                description: 'Annual enterprise license for 500 users',
                createdAt: new Date('2024-01-20').toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            },
            {
                id: 'OPP-2',
                name: 'Custom Development Project',
                relatedLead: 'LD-1',
                expectedValue: 75000,
                probability: 50,
                stage: 'needs-analysis',
                closeDate: '2024-03-15',
                description: 'Custom CRM development project',
                createdAt: new Date('2024-01-18').toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }
        ];
        localStorage.setItem('opportunities', JSON.stringify(opportunities));
    }

    // Sample proposals will be auto-generated from opportunities
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Lead Edit Functionality
function editLead(leadId) {
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('leadName').value = lead.name || '';
  document.getElementById('description').value = lead.description || '';
  document.getElementById('mmProducts').value = lead.mmProducts || '';
  document.getElementById('tag').value = lead.tag || '';
  document.getElementById('assignTo').value = lead.assignTo || '';
  document.getElementById('client').value = lead.client || '';
  document.getElementById('clientProduct').value = lead.clientProduct || '';
  document.getElementById('brand').value = lead.brand || '';
  document.getElementById('industry').value = lead.industry || '';
  document.getElementById('organizationAgency').value = lead.organizationAgency || '';
  document.getElementById('orgAgencyContact').value = lead.orgAgencyContact || '';
  
  const primaryContact = lead.primaryContact || 'none';
  document.querySelector(`input[name="primaryContact"][value="${primaryContact}"]`).checked = true;
  
  document.getElementById('clientContact').value = lead.clientContact || '';
  document.getElementById('rollingMonth').value = lead.rollingMonth || '';
  document.getElementById('source').value = lead.source || '';
  document.getElementById('mmDivision').value = lead.mmDivision || '';
  document.getElementById('subDivision').value = lead.subDivision || '';
  document.getElementById('region').value = lead.region || '';
  document.getElementById('status').value = lead.status || 'new-lead';
  document.getElementById('sendNotification').value = lead.sendNotification || '';

  window.editingLeadId = leadId;

  document.querySelector('#createLeadForm h2').textContent = 'Edit Lead';
  document.querySelector('#createLeadForm .btn-primary').textContent = 'Update Lead';

  showCreateLeadForm();
}

// Lead Detail Functions
let currentLeadId = null;

function showLeadDetail(leadId) {
  currentLeadId = leadId;
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return;

  document.getElementById('detailLeadName').textContent = lead.name;
  
  const infoGrid = document.getElementById('leadInfoGrid');
  infoGrid.innerHTML = `
    <div class="detail-item">
      <div class="detail-label">Status</div>
      <div class="detail-value">${lead.status.replace('-', ' ').toUpperCase()}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Division</div>
      <div class="detail-value">${lead.mmDivision}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Region</div>
      <div class="detail-value">${lead.region}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Assigned To</div>
      <div class="detail-value">${lead.assignTo}</div>
    </div>
    ${lead.client ? `
      <div class="detail-item">
        <div class="detail-label">Client</div>
        <div class="detail-value">${lead.client}</div>
      </div>
    ` : ''}
    ${lead.industry ? `
      <div class="detail-item">
        <div class="detail-label">Industry</div>
        <div class="detail-value">${lead.industry}</div>
      </div>
    ` : ''}
    ${lead.source ? `
      <div class="detail-item">
        <div class="detail-label">Source</div>
        <div class="detail-value">${lead.source}</div>
      </div>
    ` : ''}
    ${lead.description ? `
      <div class="detail-item" style="grid-column: 1 / -1;">
        <div class="detail-label">Description</div>
        <div class="detail-value">${lead.description}</div>
      </div>
    ` : ''}
  `;

  loadTasks(leadId);
  loadActivityLog(leadId);

  document.getElementById('editDetailLead').onclick = () => {
    editLead(leadId);
    showScreen('lead-management'); 
  };

  showScreen('lead-detail');
}

function loadTasks(leadId) {
  const tasks = JSON.parse(localStorage.getItem(`tasks_${leadId}`)) || [];
  const container = document.getElementById('tasksList');
  
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-state-icon">📝</div>
        <div style="font-size:16px; font-weight:600; margin-bottom:8px; color:#333;">No Tasks Yet</div>
        <div style="margin-bottom:16px; font-size:14px;">Add your first task to track follow-ups</div>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map((task, index) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'No due date';
    
    return `
      <div class="task-item ${isOverdue ? 'task-overdue' : ''}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
             onclick="toggleTask(${index})">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
          <div class="task-description">${task.description}</div>
          <div class="task-meta">
            <span>Due: ${dueDate}</span>
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            ${isOverdue ? '<span style="color:#dc3545;">OVERDUE</span>' : ''}
          </div>
        </div>
        <button class="action-btn btn-delete" onclick="deleteTask(${index})" title="Delete Task">
          🗑️
        </button>
      </div>
    `;
  }).join('');
}

function showAddTaskForm() {
  document.getElementById('addTaskModal').style.display = 'flex';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskDueDate').value = '';
  document.getElementById('taskPriority').value = 'medium';
}

function closeTaskModal() {
  document.getElementById('addTaskModal').style.display = 'none';
}

function saveTask() {
  const description = document.getElementById('taskDescription').value.trim();
  const dueDate = document.getElementById('taskDueDate').value;
  const priority = document.getElementById('taskPriority').value;

  if (!description) {
    alert('Please enter a task description');
    return;
  }

  const tasks = JSON.parse(localStorage.getItem(`tasks_${currentLeadId}`)) || [];
  const newTask = {
    id: 'T' + Date.now(),
    description,
    dueDate,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  localStorage.setItem(`tasks_${currentLeadId}`, JSON.stringify(tasks));

  addActivity(`Task added: "${description}"`);

  closeTaskModal();
  loadTasks(currentLeadId);
  loadActivityLog(currentLeadId);
}

function toggleTask(taskIndex) {
  const tasks = JSON.parse(localStorage.getItem(`tasks_${currentLeadId}`)) || [];
  if (tasks[taskIndex]) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;
    
    localStorage.setItem(`tasks_${currentLeadId}`, JSON.stringify(tasks));
    
    const action = tasks[taskIndex].completed ? 'completed' : 'reopened';
    addActivity(`Task ${action}: "${tasks[taskIndex].description}"`);
    
    loadTasks(currentLeadId);
    loadActivityLog(currentLeadId);
  }
}

function deleteTask(taskIndex) {
  const tasks = JSON.parse(localStorage.getItem(`tasks_${currentLeadId}`)) || [];
  if (tasks[taskIndex]) {
    const taskDescription = tasks[taskIndex].description;
    tasks.splice(taskIndex, 1);
    localStorage.setItem(`tasks_${currentLeadId}`, JSON.stringify(tasks));
    
    addActivity(`Task deleted: "${taskDescription}"`);
    
    loadTasks(currentLeadId);
    loadActivityLog(currentLeadId);
  }
}

function loadActivityLog(leadId) {
  const activities = JSON.parse(localStorage.getItem(`activities_${leadId}`)) || [];
  const container = document.getElementById('activityLog');
  
  if (activities.length === 0) {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      addActivity(`Lead "${lead.name}" was created`, true);
      loadActivityLog(leadId);  
      return;
    }
  }

  container.innerHTML = activities.map(activity => {
    const time = new Date(activity.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <div class="activity-item">
        <div class="activity-icon">📋</div>
        <div class="activity-content">
          <div class="activity-text">${activity.message}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
}

function addActivity(message, isInitial = false) {
  if (!currentLeadId) return;
  
  const activities = JSON.parse(localStorage.getItem(`activities_${currentLeadId}`)) || [];
  const newActivity = {
    message,
    timestamp: new Date().toISOString()
  };
  
  activities.unshift(newActivity); 
  localStorage.setItem(`activities_${currentLeadId}`, JSON.stringify(activities));
  
  if (!isInitial) {
    loadActivityLog(currentLeadId);
  }
}

// =================================================================
// OPPORTUNITY MANAGEMENT FUNCTIONS
// =================================================================

function initializeOpportunityManagement() {
  updateOpportunityDashboard();
  setupOpportunitySearch();
  setupOpportunityFilters();
}

function setupOpportunityFilters() {
  const stageFilter = document.getElementById('opportunityStageFilter');
  if (stageFilter) {
    stageFilter.addEventListener('change', function() {
      renderRecentOpportunities(this.value);
    });
  }
}

function updateOpportunityDashboard() {
  updateOpportunityStats();
  updatePipelineChart();
  renderRecentOpportunities('all');
}

function updateOpportunityStats() {
  const totalOpportunities = opportunities.length;
  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + (opp.expectedValue || 0), 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + ((opp.expectedValue || 0) * (opp.probability || 0) / 100), 0);
  
  const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed-won').length;
  const winRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;

  document.getElementById('totalOpportunities').textContent = totalOpportunities;
  document.getElementById('totalPipelineValue').textContent = `₹${totalPipelineValue.toLocaleString()}`;
  document.getElementById('weightedValue').textContent = `₹${weightedValue.toLocaleString()}`;
  document.getElementById('winRate').textContent = `${winRate}%`;

  // Calculate additional metrics
  const avgDealSize = totalOpportunities > 0 ? totalPipelineValue / totalOpportunities : 0;
  document.getElementById('avgDealSize').textContent = `₹${Math.round(avgDealSize).toLocaleString()}`;
  
  // For now, setting a placeholder for sales cycle
  document.getElementById('avgSalesCycle').textContent = '45 days';
}

function updatePipelineChart() {
  const stages = ['qualification', 'needs-analysis', 'proposal', 'negotiation', 'closed-won'];
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.expectedValue || 0), 0);
  
  stages.forEach(stage => {
    const stageOpps = opportunities.filter(opp => opp.stage === stage);
    const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.expectedValue || 0), 0);
    const percentage = totalValue > 0 ? (stageValue / totalValue) * 100 : 0;
    
    const stageElement = document.querySelector(`.stage-${stage.replace('-', '-')} .stage-fill`);
    if (stageElement) {
      stageElement.style.width = `${percentage}%`;
      stageElement.setAttribute('data-value', `₹${stageValue.toLocaleString()}`);
    }
    
    const amountElement = document.querySelector(`.stage-${stage.replace('-', '-')} .stage-amount`);
    if (amountElement) {
      amountElement.textContent = `₹${stageValue.toLocaleString()}`;
    }
  });
}

function renderRecentOpportunities(stageFilter = 'all') {
  const container = document.getElementById('recentOpportunities');
  if (!container) return;
  
  let filteredOpportunities = [...opportunities];
  
  if (stageFilter !== 'all') {
    filteredOpportunities = filteredOpportunities.filter(opp => opp.stage === stageFilter);
  }
  
  // Sort by creation date (newest first) and take top 5
  filteredOpportunities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentOpps = filteredOpportunities.slice(0, 5);
  
  if (recentOpps.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #7f8c8d;">
        <div style="font-size: 48px; margin-bottom: 8px;">📊</div>
        <div style="font-size: 14px;">No opportunities found</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recentOpps.map(opp => {
    const weightedValue = (opp.expectedValue || 0) * (opp.probability || 0) / 100;
    
    return `
      <div class="opportunity-list-item" onclick="editOpportunity('${opp.id}')">
        <div class="item-main">
          <div class="item-name">${opp.name}</div>
          <div class="item-meta">
            <span class="item-stage stage-${opp.stage}">${opp.stage.replace('-', ' ').toUpperCase()}</span>
            <span>${opp.probability}% probability</span>
          </div>
        </div>
        <div class="item-side">
          <div class="item-value">₹${(opp.expectedValue || 0).toLocaleString()}</div>
          <div class="item-probability">₹${weightedValue.toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join('');
}

function setupOpportunitySearch() {
  const searchInput = document.getElementById('opportunitySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      renderOpportunitiesList(e.target.value);
    });
  }
}

function showCreateOpportunityForm() {
  console.log('Showing create opportunity form');
  document.getElementById('createOpportunityForm').style.display = 'block';
  
  // Populate related leads dropdown
  populateLeadDropdown('relatedLead');
  
  // Set default close date (30 days from now)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  document.getElementById('closeDate').value = defaultDate.toISOString().split('T')[0];
}

function saveOpportunity() {
  console.log('Saving opportunity...');
  
  const opportunityData = {
    id: 'OPP-' + Date.now(),
    name: document.getElementById('opportunityName').value,
    relatedLead: document.getElementById('relatedLead').value,
    expectedValue: parseFloat(document.getElementById('expectedValue').value) || 0,
    probability: parseInt(document.getElementById('probability').value) || 0,
    stage: document.getElementById('opportunityStage').value,
    closeDate: document.getElementById('closeDate').value,
    description: document.getElementById('opportunityDescription').value,
    createdAt: new Date().toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  // Validation
  if (!opportunityData.name || !opportunityData.expectedValue || !opportunityData.closeDate) {
    alert('Please fill all required fields (Name, Expected Value, Close Date)');
    return;
  }

  opportunities.push(opportunityData);
  localStorage.setItem('opportunities', JSON.stringify(opportunities));
  
  // Reset form
  document.querySelector('#createOpportunityForm .lead-form').reset();
  
  // Show success and return to list
  showScreen('opportunity-management');
  showNotification('Opportunity created successfully!', 'success');
}

function renderOpportunitiesList(filter = '') {
  // This function is kept for compatibility but the main view is now the dashboard
  updateOpportunityDashboard();
}

function editOpportunity(opportunityId) {
  console.log('Edit opportunity:', opportunityId);
  // Add edit functionality here
}

function deleteOpportunity(opportunityId) {
  if (confirm('Are you sure you want to delete this opportunity?')) {
    opportunities = opportunities.filter(opp => opp.id !== opportunityId);
    localStorage.setItem('opportunities', JSON.stringify(opportunities));
    updateOpportunityDashboard();
    showNotification('Opportunity deleted successfully', 'success');
  }
}

// =================================================================
// PROPOSAL MANAGEMENT FUNCTIONS - INHERITED FROM OPPORTUNITIES
// =================================================================

function initializeProposalManagement() {
  updateProposalsFromOpportunities();
  setupProposalSearch();
}

function updateProposalsFromOpportunities() {
  // Get opportunities in proposal stage
  const proposalOpportunities = opportunities.filter(opp => opp.stage === 'proposal');
  
  // Update proposals based on opportunities
  proposals = proposalOpportunities.map(opp => {
    // Check if proposal already exists for this opportunity
    const existingProposal = proposals.find(p => p.relatedOpportunity === opp.id);
    
    if (existingProposal) {
      // Update existing proposal with latest opportunity data
      return {
        ...existingProposal,
        title: `Proposal: ${opp.name}`,
        client: opp.relatedLead ? getClientFromLead(opp.relatedLead) : 'Not specified',
        value: opp.expectedValue || 0,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Create new proposal from opportunity
      return {
        id: 'PROP-' + opp.id,
        title: `Proposal: ${opp.name}`,
        relatedOpportunity: opp.id,
        client: opp.relatedLead ? getClientFromLead(opp.relatedLead) : 'Not specified',
        value: opp.expectedValue || 0,
        status: 'draft',
        validityPeriod: 30,
        notes: `Auto-generated from opportunity: ${opp.description || 'No description'}`,
        createdAt: opp.createdAt,
        lastUpdated: new Date().toISOString(),
        source: 'opportunity'
      };
    }
  });
  
  // Save updated proposals
  localStorage.setItem('proposals', JSON.stringify(proposals));
  
  // Update UI
  updateProposalStats();
  renderProposalsList();
}

function getClientFromLead(leadId) {
  const lead = leads.find(l => l.id === leadId);
  return lead ? lead.client || lead.name : 'Unknown Client';
}

function updateProposalStats() {
  const totalProposals = proposals.length;
  const activeProposals = proposals.filter(p => 
    p.status === 'draft' || p.status === 'sent' || p.status === 'reviewed'
  ).length;
  const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
  
  document.getElementById('totalProposals').textContent = totalProposals;
  document.getElementById('activeProposals').textContent = activeProposals;
  document.getElementById('acceptedProposals').textContent = acceptedProposals;
}

function setupProposalSearch() {
  const searchInput = document.getElementById('proposalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      renderProposalsList(e.target.value);
    });
  }

  // Setup status filter
  const statusFilter = document.getElementById('proposalStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      currentProposalFilter = this.value;
      renderProposalsList();
    });
  }
}

function renderProposalsList(filter = '') {
  const container = document.getElementById('proposalsList');
  if (!container) {
    console.error('Proposals list container not found!');
    return;
  }
  
  container.innerHTML = '';
  
  let filteredProposals = [...proposals];
  
  // Apply search filter
  if (filter.trim()) {
    const searchTerm = filter.trim().toLowerCase();
    filteredProposals = filteredProposals.filter(prop => 
      prop.title.toLowerCase().includes(searchTerm) || 
      prop.client.toLowerCase().includes(searchTerm) ||
      prop.status.toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  if (currentProposalFilter !== 'all') {
    filteredProposals = filteredProposals.filter(prop => prop.status === currentProposalFilter);
  }

  // Show empty state if no proposals
  if (filteredProposals.length === 0) {
    if (proposals.length === 0 && !filter.trim() && currentProposalFilter === 'all') {
      container.innerHTML = `
        <div class="proposals-empty-state">
          <div class="proposals-empty-state-icon">📋</div>
          <div style="font-size:18px; font-weight:600; margin-bottom:8px; color:#333;">No Proposals Yet</div>
          <div style="margin-bottom:16px; font-size:14px; color:#7f8c8d;">
            Proposals are automatically created from opportunities in the "Proposal" stage.
          </div>
          <div class="proposal-help-text">
            💡 <strong>How to create a proposal:</strong><br>
            1. Go to Opportunity Management<br>
            2. Move an opportunity to "Proposal" stage<br>
            3. Return here to see the auto-generated proposal
          </div>
          <button class="btn btn-primary" onclick="showScreen('opportunity-management')" style="margin-top:20px; padding:12px 24px;">
            📊 Go to Opportunities
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div style="font-size:18px; font-weight:600; margin-bottom:8px; color:#333;">No proposals found</div>
          <div style="margin-bottom:24px; font-size:14px;">Try adjusting your search terms or filters</div>
        </div>
      `;
    }
    return;
  }

  // Render proposals list
  filteredProposals.forEach(proposal => {
    const card = document.createElement('div');
    card.className = 'proposal-card';
    
    // Get related opportunity info
    const relatedOpp = opportunities.find(opp => opp.id === proposal.relatedOpportunity);
    
    card.innerHTML = `
      <div class="proposal-header">
        <div style="flex: 1;">
          <div class="proposal-title">${proposal.title}</div>
          <div style="display: flex; align-items: center; margin-top: 4px;">
            <span class="proposal-status-badge status-${proposal.status}">
              ${proposal.status.toUpperCase()}
            </span>
            ${proposal.source === 'opportunity' ? 
              '<span class="proposal-source">FROM OPPORTUNITY</span>' : ''}
          </div>
        </div>
      </div>
      
      <div class="proposal-meta">
        <div class="proposal-meta-item">
          <div class="proposal-meta-label">Client</div>
          <div class="proposal-meta-value">${proposal.client}</div>
        </div>
        <div class="proposal-meta-item">
          <div class="proposal-meta-label">Proposal Value</div>
          <div class="proposal-meta-value">₹${proposal.value.toLocaleString()}</div>
        </div>
        <div class="proposal-meta-item">
          <div class="proposal-meta-label">Validity</div>
          <div class="proposal-meta-value">${proposal.validityPeriod} days</div>
        </div>
        <div class="proposal-meta-item">
          <div class="proposal-meta-label">Related Opportunity</div>
          <div class="proposal-meta-value">${relatedOpp ? relatedOpp.name : 'Not linked'}</div>
        </div>
      </div>
      
      ${proposal.notes ? `
        <div style="margin-bottom:12px;">
          <div class="proposal-meta-label">Notes</div>
          <div class="proposal-meta-value" style="font-size:13px;">${proposal.notes}</div>
        </div>
      ` : ''}
      
      <div class="proposal-actions">
        <button class="btn-proposal-action primary" onclick="updateProposalStatus('${proposal.id}', 'sent')">
          📤 Send
        </button>
        <button class="btn-proposal-action secondary" onclick="updateProposalStatus('${proposal.id}', 'reviewed')">
          👀 Mark Reviewed
        </button>
        <button class="btn-proposal-action secondary" onclick="editProposal('${proposal.id}')">
          ✏️ Edit
        </button>
      </div>
      
      <div style="margin-top:12px; font-size:11px; color:var(--muted); display: flex; justify-content: space-between;">
        <span>Created: ${proposal.createdAt}</span>
        ${proposal.lastUpdated ? `<span>Updated: ${new Date(proposal.lastUpdated).toLocaleDateString('en-IN')}</span>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function updateProposalStatus(proposalId, newStatus) {
  const proposal = proposals.find(p => p.id === proposalId);
  if (proposal) {
    const oldStatus = proposal.status;
    proposal.status = newStatus;
    proposal.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('proposals', JSON.stringify(proposals));
    
    // If accepted, update related opportunity to closed-won
    if (newStatus === 'accepted') {
      const relatedOpp = opportunities.find(opp => opp.id === proposal.relatedOpportunity);
      if (relatedOpp) {
        relatedOpp.stage = 'closed-won';
        localStorage.setItem('opportunities', JSON.stringify(opportunities));
        showNotification('Proposal accepted and opportunity moved to Closed Won!', 'success');
      }
    }
    
    updateProposalStats();
    renderProposalsList();
    showNotification(`Proposal status updated from ${oldStatus} to ${newStatus}`, 'success');
  }
}

function editProposal(proposalId) {
  const proposal = proposals.find(p => p.id === proposalId);
  if (!proposal) return;
  
  // Simple edit modal for proposal details
  const newTitle = prompt('Edit Proposal Title:', proposal.title);
  if (newTitle !== null && newTitle.trim() !== '') {
    proposal.title = newTitle.trim();
    proposal.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('proposals', JSON.stringify(proposals));
    renderProposalsList();
    showNotification('Proposal title updated', 'success');
  }
}

function deleteProposal(proposalId) {
  if (confirm('Are you sure you want to delete this proposal? This will not affect the related opportunity.')) {
    proposals = proposals.filter(prop => prop.id !== proposalId);
    localStorage.setItem('proposals', JSON.stringify(proposals));
    updateProposalStats();
    renderProposalsList();
    showNotification('Proposal deleted successfully', 'success');
  }
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

function populateLeadDropdown(selectId) {
  const select = document.getElementById(selectId);
  const leads = JSON.parse(localStorage.getItem('leads')) || [];
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  leads.forEach(lead => {
    const option = document.createElement('option');
    option.value = lead.id;
    option.textContent = lead.name;
    select.appendChild(option);
  });
}

function populateOpportunityDropdown(selectId) {
  const select = document.getElementById(selectId);
  const opportunities = JSON.parse(localStorage.getItem('opportunities')) || [];
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  opportunities.forEach(opp => {
    const option = document.createElement('option');
    option.value = opp.id;
    option.textContent = `${opp.name} (₹${opp.expectedValue.toLocaleString()})`;
    select.appendChild(option);
  });
}

function populateClientDropdown(selectId) {
  const select = document.getElementById(selectId);
  const leads = JSON.parse(localStorage.getItem('leads')) || [];
  const uniqueClients = [...new Set(leads.filter(lead => lead.client).map(lead => lead.client))];
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  uniqueClients.forEach(client => {
    const option = document.createElement('option');
    option.value = client;
    option.textContent = client;
    select.appendChild(option);
  });
}
