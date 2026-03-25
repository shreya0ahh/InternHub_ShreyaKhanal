// InternHub - Storage Management
// Handles localStorage operations

const Storage = {
  // Keys
  KEYS: {
    USER: 'internhub_user',
    NOTIFICATIONS: 'internhub_notifications',
    SAVED_JOBS: 'internhub_saved_jobs'
  },

  // Get item from localStorage
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from storage:', error);
      return null;
    }
  },

  // Set item in localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error setting in storage:', error);
      return false;
    }
  },

  // Remove item from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  },

  // Clear all storage
  clear() {
    localStorage.clear();
  },

  // Current user
  getCurrentUser() {
    return this.get(this.KEYS.USER);
  },

  setCurrentUser(user) {
    this.set(this.KEYS.USER, user);
  },

  logout() {
    this.remove(this.KEYS.USER);
    localStorage.removeItem('internhub_token');
  }
};

// Make Storage available globally
window.Storage = Storage;
