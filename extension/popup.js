(() => {
  "use strict";

  // Initialize extension auth
  const auth = new ExtensionAuth();
  const fieldMatcher = new FieldMatcher();

  // UI Elements
  const authSection = document.getElementById('authSection');
  const mainSection = document.getElementById('mainSection');
  const loadingSection = document.getElementById('loadingSection');

  const loginBtn = document.getElementById('loginBtn');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const authStatus = document.getElementById('authStatus');

  const userEmail = document.getElementById('userEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  const autofillBtn = document.getElementById('autofillBtn');
  const manageProfileBtn = document.getElementById('manageProfileBtn');
  const syncProfileBtn = document.getElementById('syncProfileBtn');
  const mainStatus = document.getElementById('mainStatus');

  // Initialize UI
  initializeUI();

  async function initializeUI() {
    showSection('loading');
    
    try {
      const isAuth = await auth.isAuthenticated();
      if (isAuth) {
        const email = await auth.getUserEmail();
        userEmail.textContent = email;
        showSection('main');
      } else {
        showSection('auth');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      showSection('auth');
    }
  }

  // ============ AUTH FLOW ============

  loginBtn.addEventListener('click', handleLogin);
  loginEmail.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());
  loginPassword.addEventListener('keypress', (e) => e.key === 'Enter' && handleLogin());

  async function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showStatus('authStatus', 'Please enter email and password', 'error');
      return;
    }

    loginBtn.disabled = true;

    try {
      await auth.login(email, password);
      
      // Fetch and cache profile data
      await auth.fetchProfileData();
      
      showStatus('authStatus', 'Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        initializeUI();
        clearForm();
      }, 1000);
    } catch (error) {
      showStatus('authStatus', error.message || 'Login failed', 'error');
    } finally {
      loginBtn.disabled = false;
    }
  }

  logoutBtn.addEventListener('click', handleLogout);

  async function handleLogout() {
    await auth.logout();
    showStatus('mainStatus', 'Logged out', 'success');
    setTimeout(() => {
      initializeUI();
    }, 500);
  }

  // ============ SYNC PROFILE ============

  syncProfileBtn.addEventListener('click', handleSyncProfile);

  async function handleSyncProfile() {
    syncProfileBtn.disabled = true;

    try {
      await auth.fetchProfileData();
      showStatus('mainStatus', 'Profile synced successfully', 'success');
    } catch (error) {
      showStatus('mainStatus', error.message || 'Sync failed', 'error');
    } finally {
      syncProfileBtn.disabled = false;
    }
  }

  // ============ AUTOFILL ============

  autofillBtn.addEventListener('click', handleAutofill);

  async function handleAutofill() {
    autofillBtn.disabled = true;

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('mainStatus', 'No active tab found', 'error');
        autofillBtn.disabled = false;
        return;
      }

      // Get cached profile data
      let profileData = await auth.getCachedProfileData();
      
      if (!profileData) {
        // If not cached, fetch from server
        profileData = await auth.fetchProfileData();
      }

      if (!profileData) {
        showStatus('mainStatus', 'Profile data not found', 'error');
        autofillBtn.disabled = false;
        return;
      }

      // Send autofill message to content script
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: 'autofill',
          profileData: profileData,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message || 'Unable to autofill on this page';
            console.error('[Filla] Chrome runtime error:', errorMsg);
            
            // Provide helpful message for specific sites
            if (tab.url.includes('linkedin.com')) {
              showStatus('mainStatus', 'LinkedIn forms require a refresh. Please reload the page and try again.', 'error');
            } else {
              showStatus('mainStatus', 'Unable to autofill on this page. Try refreshing.', 'error');
            }
          } else if (response && response.success) {
            showStatus('mainStatus', `${response.filledCount} fields autofilled! ✓`, 'success');
          } else if (response && response.error) {
            console.error('[Filla] Autofill error:', response.error);
            showStatus('mainStatus', response.error, 'error');
          } else {
            showStatus('mainStatus', 'No matching fields found', 'info');
          }
          autofillBtn.disabled = false;
        }
      );
    } catch (error) {
      showStatus('mainStatus', error.message || 'Autofill failed', 'error');
      autofillBtn.disabled = false;
    }
  }

  // ============ MANAGE PROFILE ============

  manageProfileBtn.addEventListener('click', () => {
    // Open web dashboard to manage profile
    chrome.tabs.create({
      url: 'http://localhost:5173/dashboard'
    });
  });

  // ============ UTILITY FUNCTIONS ============

  function showSection(section) {
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    loadingSection.classList.add('hidden');

    switch (section) {
      case 'auth':
        authSection.classList.remove('hidden');
        loginEmail.focus();
        break;
      case 'main':
        mainSection.classList.remove('hidden');
        break;
      case 'loading':
        loadingSection.classList.remove('hidden');
        break;
    }
  }

  function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }

  function clearForm() {
    loginEmail.value = '';
    loginPassword.value = '';
    authStatus.textContent = '';
    authStatus.className = '';
  }
})();
