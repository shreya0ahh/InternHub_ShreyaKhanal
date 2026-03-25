/**
 * InternHub - API Utility
 * Handles communication with the Laravel backend
 */

// Detect if we're running locally or on a server
const HOST_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : ''; // Relative to current host in production

const API_BASE_URL = `${HOST_URL}/api`;
window.API_HOST_URL = HOST_URL;


const API = {
    // Helper for fetch with auth
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('internhub_token');

        const headers = {
            'Accept': 'application/json',
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('internhub_token');
                    localStorage.removeItem('internhub_user');
                    if (!window.location.href.includes('index.html')) {
                        window.location.href = 'index.html';
                    }
                }
                throw data;
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // Auth methods
    async register(userData) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async login(credentials) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    async forgotPassword(email) {
        return this.request('/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    async resetPassword(resetData) {
        return this.request('/reset-password', {
            method: 'POST',
            body: JSON.stringify(resetData)
        });
    },

    async logout() {
        return this.request('/logout', { method: 'POST' });
    },

    async getCurrentUser() {
        return this.request('/user');
    },

    // Jobs methods
    async getJobs(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/jobs?${query}`);
    },

    async getJob(id) {
        return this.request(`/jobs/${id}`);
    },

    async postJob(jobData) {
        return this.request('/jobs', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    },

    async deleteJob(id) {
        return this.request(`/jobs/${id}`, { method: 'DELETE' });
    },

    async toggleJobStatus(id) {
        return this.request(`/jobs/${id}/toggle-status`, { method: 'PATCH' });
    },

    async applyForJob(jobId, formData) {
        return this.request(`/jobs/${jobId}/apply`, {
            method: 'POST',
            body: formData // Expecting FormData for file upload
        });
    },

    async getApplicants(jobId) {
        return this.request(`/jobs/${jobId}/applicants`);
    },

    async getAllApplicants() {
        return this.request('/applicants');
    },

    async getApplications() {
        return this.request('/applications');
    },

    async updateApplicationStatus(appId, status) {
        return this.request(`/applications/${appId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    // Feed methods
    async getFeed() {
        return this.request('/feed');
    },

    async searchPosts(query) {
        return this.request(`/feed/search?q=${encodeURIComponent(query)}`);
    },

    async getPost(postId) {
        return this.request(`/feed/posts/${postId}`);
    },

    async postUpdate(postData) {
        return this.request('/feed', {
            method: 'POST',
            body: postData instanceof FormData ? postData : JSON.stringify(postData)
        });
    },

    async toggleLike(postId) {
        return this.request(`/posts/${postId}/like`, { method: 'POST' });
    },

    async likePost(postId) {
        return this.toggleLike(postId);
    },

    async likeComment(commentId) {
        return this.request(`/comments/${commentId}/like`, { method: 'POST' });
    },

    async deletePost(postId) {
        return this.request(`/feed/posts/${postId}`, { method: 'DELETE' });
    },

    async commentOnPost(postId, content, parentId = null) {
        const payload = { content };
        if (parentId) payload.parent_id = parentId;
        return this.request(`/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async addComment(postId, content) {
        return this.commentOnPost(postId, content);
    },

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, { method: 'DELETE' });
    },

    // profile
    async getProfile(id) {
        return this.request(`/profile/${id || ''}`);
    },

    async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },

    async uploadAvatar(formData) {
        return this.request('/profile/avatar', {
            method: 'POST',
            body: formData
        });
    },

    async uploadCover(formData) {
        return this.request('/profile/cover', {
            method: 'POST',
            body: formData
        });
    },

    // connections
    async getConnections() {
        return this.request('/connections');
    },

    async getSuggestions() {
        return this.request('/connections/suggestions');
    },

    async sendConnectionRequest(receiverId) {
        return this.request('/connections', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: receiverId })
        });
    },

    async updateConnectionStatus(connectionId, status) {
        return this.request(`/connections/${connectionId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    async cancelConnectionRequest(connectionId) {
        return this.request(`/connections/${connectionId}`, {
            method: 'DELETE'
        });
    },

    // notifications
    async getNotifications() {
        return this.request('/notifications');
    },

    async searchUsers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/users/search?${query}`);
    },

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PUT' });
    },

    async getConversations() {
        return this.request('/messages');
    },

    async getUnreadMessageCount() {
        return this.request('/messages/unread/count');
    },

    async getMessages(contactId) {
        return this.request(`/messages/${contactId}`);
    },

    async sendMessage(receiverId, content) {
        return this.request('/messages', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: receiverId, content })
        });
    },

    async markMessagesRead(contactId) {
        return this.request(`/messages/${contactId}/read`, { method: 'PUT' });
    }
};

window.API = API;
