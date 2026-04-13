// Extension Auth Service
// Handles login and token management for Chrome extension

const API_URL = 'http://localhost:8000/api'; // Change to your production URL

class ExtensionAuth {
  constructor() {
    this.storageKey = 'fillaExtensionAuth';
    this.tokenKey = 'fillaAuthToken';
    this.userIdKey = 'fillaUserId';
    this.emailKey = 'fillaUserEmail';
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response with token
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // Store token in extension storage
      await chrome.storage.local.set({
        [this.tokenKey]: data.access_token,
        [this.userIdKey]: data.user_id,
        [this.emailKey]: email,
      });

      return data;
    } catch (error) {
      console.error('Extension login error:', error);
      throw error;
    }
  }

  /**
   * Get stored authentication token
   * @returns {Promise<string|null>} JWT token or null
   */
  async getToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.tokenKey], (result) => {
        resolve(result[this.tokenKey] || null);
      });
    });
  }

  /**
   * Get stored user ID
   * @returns {Promise<string|null>} User ID or null
   */
  async getUserId() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.userIdKey], (result) => {
        resolve(result[this.userIdKey] || null);
      });
    });
  }

  /**
   * Get stored user email
   * @returns {Promise<string|null>} User email or null
   */
  async getUserEmail() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.emailKey], (result) => {
        resolve(result[this.emailKey] || null);
      });
    });
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Logout user (clear stored token)
   * @returns {Promise<void>}
   */
  async logout() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([this.tokenKey, this.userIdKey, this.emailKey], () => {
        resolve();
      });
    });
  }

  /**
   * Fetch autofill profile data from server
   * @returns {Promise<Object>} Profile data
   */
  async fetchProfileData() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_URL}/extension/autofill-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch profile data');
      }

      const data = await response.json();

      // Cache profile data locally
      await chrome.storage.local.set({
        fillaProfileData: data.profile,
      });

      return data.profile;
    } catch (error) {
      console.error('Fetch profile data error:', error);
      throw error;
    }
  }

  /**
   * Get cached profile data
   * @returns {Promise<Object|null>} Cached profile data or null
   */
  async getCachedProfileData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['fillaProfileData'], (result) => {
        resolve(result.fillaProfileData || null);
      });
    });
  }
}

// Export for use in other files
window.ExtensionAuth = ExtensionAuth;
